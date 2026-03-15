from pathlib import Path
from datetime import datetime

import networkx as nx

from ryu.base import app_manager
from ryu.controller import ofp_event
from ryu.controller.handler import CONFIG_DISPATCHER, MAIN_DISPATCHER, DEAD_DISPATCHER
from ryu.controller.handler import set_ev_cls
from ryu.ofproto import ofproto_v1_3
from ryu.lib.packet import packet, ethernet, arp, ipv4
from ryu.lib.packet import ether_types
from ryu.topology import event
from ryu.topology.api import get_switch, get_link


LOG_FILE = Path(__file__).resolve().parents[1] / "docs" / "network_events.log"


def write_log(message: str) -> None:
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        f.write(f"[{ts}] {message}\n")


class SelfHealingController(app_manager.RyuApp):
    OFP_VERSIONS = [ofproto_v1_3.OFP_VERSION]

    def __init__(self, *args, **kwargs):
        super(SelfHealingController, self).__init__(*args, **kwargs)

        # Connected switches
        self.datapaths = {}

        # Switch topology graph
        self.net = nx.Graph()

        # Mapping of (src_switch, dst_switch) -> output port on src_switch
        self.link_ports = {}

        # Learned hosts:
        # mac -> {"switch": dpid, "port": port_no, "ip": ip_or_none}
        self.hosts = {}

        # Track installed paths so we can compare/update if topology changes
        self.active_paths = {}

    # -------------------------
    # Utility / logging helpers
    # -------------------------
    def _log(self, message: str) -> None:
        self.logger.info(message)
        write_log(message)

    def _warn(self, message: str) -> None:
        self.logger.warning(message)
        write_log(message)

    def _error(self, message: str) -> None:
        self.logger.error(message)
        write_log(message)

    def _topology_summary(self) -> str:
        switches = sorted(list(self.net.nodes()))
        links = sorted([tuple(sorted(edge)) for edge in self.net.edges()])
        return f"Topology summary -> switches={switches}, links={links}"

    # -------------------------
    # Datapath registration
    # -------------------------
    @set_ev_cls(ofp_event.EventOFPStateChange, [MAIN_DISPATCHER, DEAD_DISPATCHER])
    def state_change_handler(self, ev):
        dp = ev.datapath

        if ev.state == MAIN_DISPATCHER:
            if dp.id not in self.datapaths:
                self.datapaths[dp.id] = dp
                self._log(f"Register switch {dp.id}")

        elif ev.state == DEAD_DISPATCHER:
            if dp.id in self.datapaths:
                del self.datapaths[dp.id]
                self._log(f"Unregister switch {dp.id}")

    # -------------------------
    # Initial switch setup
    # -------------------------
    @set_ev_cls(ofp_event.EventOFPSwitchFeatures, CONFIG_DISPATCHER)
    def switch_features_handler(self, ev):
        datapath = ev.msg.datapath
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser

        # Table-miss flow: send unknown traffic to controller
        match = parser.OFPMatch()
        actions = [
            parser.OFPActionOutput(ofproto.OFPP_CONTROLLER, ofproto.OFPCML_NO_BUFFER)
        ]
        self.add_flow(datapath, priority=0, match=match, actions=actions)

        self._log(f"Switch features received for s{datapath.id}")

    def add_flow(self, datapath, priority, match, actions, buffer_id=None):
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser

        inst = [parser.OFPInstructionActions(ofproto.OFPIT_APPLY_ACTIONS, actions)]

        if buffer_id is not None and buffer_id != ofproto.OFP_NO_BUFFER:
            mod = parser.OFPFlowMod(
                datapath=datapath,
                buffer_id=buffer_id,
                priority=priority,
                match=match,
                instructions=inst,
            )
        else:
            mod = parser.OFPFlowMod(
                datapath=datapath,
                priority=priority,
                match=match,
                instructions=inst,
            )

        datapath.send_msg(mod)

    def delete_non_default_flows(self, datapath):
        """
        Delete flows that were installed above the table-miss rule.
        """
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser

        mod = parser.OFPFlowMod(
            datapath=datapath,
            table_id=0,
            command=ofproto.OFPFC_DELETE,
            out_port=ofproto.OFPP_ANY,
            out_group=ofproto.OFPG_ANY,
            match=parser.OFPMatch(),
        )
        datapath.send_msg(mod)

        # Reinstall table-miss flow after clearing
        match = parser.OFPMatch()
        actions = [
            parser.OFPActionOutput(ofproto.OFPP_CONTROLLER, ofproto.OFPCML_NO_BUFFER)
        ]
        self.add_flow(datapath, priority=0, match=match, actions=actions)

    def clear_path_flows(self):
        for dp in self.datapaths.values():
            self.delete_non_default_flows(dp)

    # -------------------------
    # Topology discovery
    # -------------------------
    @set_ev_cls(event.EventSwitchEnter)
    def switch_enter_handler(self, ev):
        self.refresh_topology()
        self._recompute_installed_paths()

    @set_ev_cls(event.EventSwitchLeave)
    def switch_leave_handler(self, ev):
        self.refresh_topology()
        self._recompute_installed_paths()

    @set_ev_cls(event.EventLinkAdd)
    def link_add_handler(self, ev):
        src = ev.link.src
        dst = ev.link.dst

        self.net.add_edge(src.dpid, dst.dpid)
        self.link_ports[(src.dpid, dst.dpid)] = src.port_no
        self.link_ports[(dst.dpid, src.dpid)] = dst.port_no

        self._log(
            f"Link added: s{src.dpid}:port{src.port_no} -> s{dst.dpid}:port{dst.port_no}"
        )
        self._log(self._topology_summary())

        self._recompute_installed_paths()

    @set_ev_cls(event.EventLinkDelete)
    def link_delete_handler(self, ev):
        src = ev.link.src
        dst = ev.link.dst

        if self.net.has_edge(src.dpid, dst.dpid):
            self.net.remove_edge(src.dpid, dst.dpid)

        self.link_ports.pop((src.dpid, dst.dpid), None)
        self.link_ports.pop((dst.dpid, src.dpid), None)

        self._warn(
            f"Link deleted: s{src.dpid}:port{src.port_no} -> s{dst.dpid}:port{dst.port_no}"
        )
        self._log(self._topology_summary())

        self._recompute_installed_paths()

    def refresh_topology(self):
        switches = get_switch(self, None)
        links = get_link(self, None)

        self.net.clear()
        self.link_ports.clear()

        for sw in switches:
            self.net.add_node(sw.dp.id)

        for link in links:
            src = link.src
            dst = link.dst
            self.net.add_edge(src.dpid, dst.dpid)
            self.link_ports[(src.dpid, dst.dpid)] = src.port_no
            self.link_ports[(dst.dpid, src.dpid)] = dst.port_no

        self._log(self._topology_summary())

    # -------------------------
    # Host learning helpers
    # -------------------------
    def _get_inter_switch_ports(self, dpid):
        ports = set()
        for (src, _dst), port_no in self.link_ports.items():
            if src == dpid:
                ports.add(port_no)
        return ports

    def _learn_host(self, mac, dpid, port_no, ip_addr=None):
        # Ignore obviously invalid / special MACs
        if mac in ("ff:ff:ff:ff:ff:ff", "00:00:00:00:00:00"):
            return False

        # If this port is a switch-to-switch port, do not treat it as a host port
        if port_no in self._get_inter_switch_ports(dpid):
            return False

        existing = self.hosts.get(mac)
        changed = (
            existing is None
            or existing["switch"] != dpid
            or existing["port"] != port_no
            or (ip_addr and existing.get("ip") != ip_addr)
        )

        if changed:
            self.hosts[mac] = {
                "switch": dpid,
                "port": port_no,
                "ip": ip_addr,
            }

            host_desc = f"Learned host {mac} at s{dpid}:port{port_no}"
            if ip_addr:
                host_desc += f" ip={ip_addr}"
            self._log(host_desc)

        return changed

    # -------------------------
    # Path logic
    # -------------------------
    def compute_path_between_hosts(self, src_mac, dst_mac):
        src_host = self.hosts.get(src_mac)
        dst_host = self.hosts.get(dst_mac)

        if not src_host or not dst_host:
            return None

        src_sw = src_host["switch"]
        dst_sw = dst_host["switch"]

        if src_sw not in self.net.nodes or dst_sw not in self.net.nodes:
            return None

        try:
            return nx.shortest_path(self.net, src_sw, dst_sw)
        except nx.NetworkXNoPath:
            return None

    def get_output_port(self, src_sw, dst_sw):
        return self.link_ports.get((src_sw, dst_sw))

    def install_path(self, src_mac, dst_mac, path):
        """
        Install bidirectional flows for traffic between two learned hosts.
        Match on eth_src + eth_dst so both ARP and IPv4 benefit.
        """
        if not path:
            self._warn(f"Cannot install path for {src_mac} -> {dst_mac}: no path")
            return

        src_host = self.hosts.get(src_mac)
        dst_host = self.hosts.get(dst_mac)

        if not src_host or not dst_host:
            self._warn(f"Cannot install path: host data missing for {src_mac}, {dst_mac}")
            return

        # Forward direction: src -> dst
        for i, sw in enumerate(path):
            dp = self.datapaths.get(sw)
            if not dp:
                continue

            parser = dp.ofproto_parser

            if len(path) == 1:
                in_port = src_host["port"]
                out_port = dst_host["port"]
            elif i == 0:
                in_port = src_host["port"]
                out_port = self.get_output_port(path[i], path[i + 1])
            elif i == len(path) - 1:
                in_port = self.get_output_port(path[i], path[i - 1])
                out_port = dst_host["port"]
            else:
                in_port = self.get_output_port(path[i], path[i - 1])
                out_port = self.get_output_port(path[i], path[i + 1])

            if in_port is None or out_port is None:
                self._warn(f"Missing port mapping on s{sw} for forward path {path}")
                continue

            match = parser.OFPMatch(
                in_port=in_port,
                eth_src=src_mac,
                eth_dst=dst_mac,
            )
            actions = [parser.OFPActionOutput(out_port)]
            self.add_flow(dp, priority=100, match=match, actions=actions)

        # Reverse direction: dst -> src
        rev_path = list(reversed(path))
        for i, sw in enumerate(rev_path):
            dp = self.datapaths.get(sw)
            if not dp:
                continue

            parser = dp.ofproto_parser

            if len(rev_path) == 1:
                in_port = dst_host["port"]
                out_port = src_host["port"]
            elif i == 0:
                in_port = dst_host["port"]
                out_port = self.get_output_port(rev_path[i], rev_path[i + 1])
            elif i == len(rev_path) - 1:
                in_port = self.get_output_port(rev_path[i], rev_path[i - 1])
                out_port = src_host["port"]
            else:
                in_port = self.get_output_port(rev_path[i], rev_path[i - 1])
                out_port = self.get_output_port(rev_path[i], rev_path[i + 1])

            if in_port is None or out_port is None:
                self._warn(f"Missing port mapping on s{sw} for reverse path {rev_path}")
                continue

            match = parser.OFPMatch(
                in_port=in_port,
                eth_src=dst_mac,
                eth_dst=src_mac,
            )
            actions = [parser.OFPActionOutput(out_port)]
            self.add_flow(dp, priority=100, match=match, actions=actions)

        self.active_paths[(src_mac, dst_mac)] = path
        self.active_paths[(dst_mac, src_mac)] = rev_path
        self._log(f"Installed active path for {src_mac} <-> {dst_mac}: {path}")

    def _recompute_installed_paths(self):
        """
        After topology changes, clear installed flows and recompute paths
        for all known host pairs.
        """
        self.clear_path_flows()
        self.active_paths = {}

        learned_macs = list(self.hosts.keys())
        if len(learned_macs) < 2:
            return

        for i in range(len(learned_macs)):
            for j in range(i + 1, len(learned_macs)):
                src_mac = learned_macs[i]
                dst_mac = learned_macs[j]
                path = self.compute_path_between_hosts(src_mac, dst_mac)

                if path:
                    self.install_path(src_mac, dst_mac, path)
                else:
                    self._warn(f"No active path available between {src_mac} and {dst_mac}")

    # -------------------------
    # Packet handling
    # -------------------------
    @set_ev_cls(ofp_event.EventOFPPacketIn, MAIN_DISPATCHER)
    def packet_in_handler(self, ev):
        msg = ev.msg
        datapath = msg.datapath
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser
        in_port = msg.match["in_port"]

        pkt = packet.Packet(msg.data)
        eth = pkt.get_protocol(ethernet.ethernet)

        if not eth:
            return

        # Ignore LLDP used by topology discovery
        if eth.ethertype == ether_types.ETH_TYPE_LLDP:
            return

        src_mac = eth.src
        dst_mac = eth.dst

        arp_pkt = pkt.get_protocol(arp.arp)
        ip_pkt = pkt.get_protocol(ipv4.ipv4)

        learned_ip = None
        if arp_pkt:
            learned_ip = arp_pkt.src_ip
        elif ip_pkt:
            learned_ip = ip_pkt.src

        self._learn_host(src_mac, datapath.id, in_port, learned_ip)

        # If destination is not yet known, flood the packet
        if dst_mac not in self.hosts:
            actions = [parser.OFPActionOutput(ofproto.OFPP_FLOOD)]
            data = None if msg.buffer_id != ofproto.OFP_NO_BUFFER else msg.data

            out = parser.OFPPacketOut(
                datapath=datapath,
                buffer_id=msg.buffer_id,
                in_port=in_port,
                actions=actions,
                data=data,
            )
            datapath.send_msg(out)
            return

        path = self.compute_path_between_hosts(src_mac, dst_mac)
        if not path:
            self._warn(f"PacketIn received but no path is available for {src_mac} -> {dst_mac}")
            return

        current = self.active_paths.get((src_mac, dst_mac))
        if current != path:
            self.install_path(src_mac, dst_mac, path)

        src_host = self.hosts[src_mac]
        dst_host = self.hosts[dst_mac]

        out_port = None

        if len(path) == 1 and datapath.id == src_host["switch"]:
            out_port = dst_host["port"]
        else:
            for i, sw in enumerate(path):
                if sw != datapath.id:
                    continue

                if i == 0 and in_port == src_host["port"]:
                    out_port = self.get_output_port(path[i], path[i + 1])
                elif i == len(path) - 1 and in_port == self.get_output_port(path[i], path[i - 1]):
                    out_port = dst_host["port"]
                elif 0 < i < len(path) - 1:
                    prev_port = self.get_output_port(path[i], path[i - 1])
                    next_port = self.get_output_port(path[i], path[i + 1])
                    if in_port == prev_port:
                        out_port = next_port
                break

        if out_port is None:
            self._warn(
                f"No output port decision for packet on s{datapath.id} "
                f"in_port={in_port} src={src_mac} dst={dst_mac}"
            )
            return

        actions = [parser.OFPActionOutput(out_port)]
        data = None if msg.buffer_id != ofproto.OFP_NO_BUFFER else msg.data

        out = parser.OFPPacketOut(
            datapath=datapath,
            buffer_id=msg.buffer_id,
            in_port=in_port,
            actions=actions,
            data=data,
        )
        datapath.send_msg(out)
