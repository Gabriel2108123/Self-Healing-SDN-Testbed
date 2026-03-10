from pathlib import Path
from datetime import datetime

import networkx as nx

from ryu.base import app_manager
from ryu.controller import ofp_event
from ryu.controller.handler import CONFIG_DISPATCHER, MAIN_DISPATCHER, DEAD_DISPATCHER
from ryu.controller.handler import set_ev_cls
from ryu.ofproto import ofproto_v1_3
from ryu.lib.packet import packet, ethernet, ether_types
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

    # Fixed host placement for this project topology
    HOSTS = {
        "h1": {"ip": "10.0.0.1", "switch": 1, "port": 1},
        "h2": {"ip": "10.0.0.2", "switch": 2, "port": 1},
    }

    def __init__(self, *args, **kwargs):
        super(SelfHealingController, self).__init__(*args, **kwargs)
        self.datapaths = {}
        self.net = nx.Graph()

    # -------------------------
    # Datapath registration
    # -------------------------
    @set_ev_cls(ofp_event.EventOFPStateChange, [MAIN_DISPATCHER, DEAD_DISPATCHER])
    def state_change_handler(self, ev):
        dp = ev.datapath
        if ev.state == MAIN_DISPATCHER:
            if dp.id not in self.datapaths:
                self.datapaths[dp.id] = dp
                msg = f"Register switch {dp.id}"
                self.logger.info(msg)
                write_log(msg)
        elif ev.state == DEAD_DISPATCHER:
            if dp.id in self.datapaths:
                del self.datapaths[dp.id]
                msg = f"Unregister switch {dp.id}"
                self.logger.info(msg)
                write_log(msg)

    # -------------------------
    # Base flow
    # -------------------------
    @set_ev_cls(ofp_event.EventOFPSwitchFeatures, CONFIG_DISPATCHER)
    def switch_features_handler(self, ev):
        dp = ev.msg.datapath
        parser = dp.ofproto_parser
        ofproto = dp.ofproto

        # Table miss: send only unknown packets to controller
        match = parser.OFPMatch()
        actions = [parser.OFPActionOutput(ofproto.OFPP_CONTROLLER, ofproto.OFPCML_NO_BUFFER)]
        self.add_flow(dp, 0, match, actions)

        msg = f"Switch {dp.id} connected to controller"
        self.logger.info(msg)
        write_log(msg)

    def add_flow(self, datapath, priority, match, actions):
        parser = datapath.ofproto_parser
        ofproto = datapath.ofproto

        inst = [parser.OFPInstructionActions(ofproto.OFPIT_APPLY_ACTIONS, actions)]
        mod = parser.OFPFlowMod(
            datapath=datapath,
            priority=priority,
            match=match,
            instructions=inst
        )
        datapath.send_msg(mod)

    def clear_flows(self):
        for dp in self.datapaths.values():
            parser = dp.ofproto_parser
            ofproto = dp.ofproto

            mod = parser.OFPFlowMod(
                datapath=dp,
                command=ofproto.OFPFC_DELETE,
                out_port=ofproto.OFPP_ANY,
                out_group=ofproto.OFPG_ANY,
                priority=1,
                match=parser.OFPMatch()
            )
            dp.send_msg(mod)

            # Reinstall table miss
            match = parser.OFPMatch()
            actions = [parser.OFPActionOutput(ofproto.OFPP_CONTROLLER, ofproto.OFPCML_NO_BUFFER)]
            self.add_flow(dp, 0, match, actions)

    # -------------------------
    # Topology rebuild
    # -------------------------
    def rebuild_topology(self):
        self.net.clear()

        switch_list = get_switch(self, None)
        for sw in switch_list:
            self.net.add_node(sw.dp.id)

        link_list = get_link(self, None)
        for link in link_list:
            self.net.add_edge(
                link.src.dpid,
                link.dst.dpid,
                src_port=link.src.port_no,
                dst_port=link.dst.port_no
            )

    def get_out_port(self, current_switch, next_hop):
        edge = self.net[current_switch][next_hop]
        return edge["src_port"] if current_switch < next_hop else edge["dst_port"]

    # -------------------------
    # Path installation
    # -------------------------
    def install_path_flows(self):
        if 1 not in self.net.nodes or 2 not in self.net.nodes:
            return

        try:
            path = nx.shortest_path(self.net, 1, 2)
        except nx.NetworkXNoPath:
            msg = "No path available between s1 and s2"
            self.logger.warning(msg)
            write_log(msg)
            return

        msg = f"Installing active path: {path}"
        self.logger.info(msg)
        write_log(msg)

        self.clear_flows()

        h1_ip = self.HOSTS["h1"]["ip"]
        h2_ip = self.HOSTS["h2"]["ip"]

        # Build per-switch forwarding rules for h1 -> h2 and h2 -> h1
        for i, sw in enumerate(path):
            dp = self.datapaths.get(sw)
            if dp is None:
                continue

            parser = dp.ofproto_parser

            # Forward traffic towards h2
            if sw == 1:
                out_port_to_h2 = self.get_out_port(path[i], path[i + 1])
            elif sw == 2:
                out_port_to_h2 = self.HOSTS["h2"]["port"]
            else:
                out_port_to_h2 = self.get_out_port(path[i], path[i + 1])

            # Forward traffic towards h1
            if sw == 2:
                out_port_to_h1 = self.get_out_port(path[i], path[i - 1])
            elif sw == 1:
                out_port_to_h1 = self.HOSTS["h1"]["port"]
            else:
                out_port_to_h1 = self.get_out_port(path[i], path[i - 1])

            # IPv4 flows
            match_h1_to_h2 = parser.OFPMatch(eth_type=0x0800, ipv4_dst=h2_ip)
            actions_h1_to_h2 = [parser.OFPActionOutput(out_port_to_h2)]
            self.add_flow(dp, 20, match_h1_to_h2, actions_h1_to_h2)

            match_h2_to_h1 = parser.OFPMatch(eth_type=0x0800, ipv4_dst=h1_ip)
            actions_h2_to_h1 = [parser.OFPActionOutput(out_port_to_h1)]
            self.add_flow(dp, 20, match_h2_to_h1, actions_h2_to_h1)

            # ARP flows
            match_arp_to_h2 = parser.OFPMatch(eth_type=0x0806, arp_tpa=h2_ip)
            actions_arp_to_h2 = [parser.OFPActionOutput(out_port_to_h2)]
            self.add_flow(dp, 20, match_arp_to_h2, actions_arp_to_h2)

            match_arp_to_h1 = parser.OFPMatch(eth_type=0x0806, arp_tpa=h1_ip)
            actions_arp_to_h1 = [parser.OFPActionOutput(out_port_to_h1)]
            self.add_flow(dp, 20, match_arp_to_h1, actions_arp_to_h1)

    def refresh_and_install(self, reason: str):
        self.rebuild_topology()
        self.install_path_flows()
        self.logger.info(reason)
        write_log(reason)

    # -------------------------
    # Topology events
    # -------------------------
    @set_ev_cls(event.EventSwitchEnter)
    def switch_enter_handler(self, ev):
        self.refresh_and_install("Switch entered topology")

    @set_ev_cls(event.EventSwitchLeave)
    def switch_leave_handler(self, ev):
        self.refresh_and_install("Switch left topology")

    @set_ev_cls(event.EventLinkAdd)
    def link_add_handler(self, ev):
        link = ev.link
        self.refresh_and_install(
            f"Link added: s{link.src.dpid}:port{link.src.port_no} -> s{link.dst.dpid}:port{link.dst.port_no}"
        )

    @set_ev_cls(event.EventLinkDelete)
    def link_delete_handler(self, ev):
        link = ev.link
        self.refresh_and_install(
            f"Link deleted: s{link.src.dpid}:port{link.src.port_no} -> s{link.dst.dpid}:port{link.dst.port_no}"
        )

    # -------------------------
    # PacketIn
    # -------------------------
    @set_ev_cls(ofp_event.EventOFPPacketIn, MAIN_DISPATCHER)
    def packet_in_handler(self, ev):
        msg = ev.msg
        dp = msg.datapath
        pkt = packet.Packet(msg.data)
        eth = pkt.get_protocol(ethernet.ethernet)

        if eth is None:
            return

        if eth.ethertype == ether_types.ETH_TYPE_LLDP:
            return

        if eth.ethertype == ether_types.ETH_TYPE_IPV6:
            return

        # No flood-based learning switch behaviour here.
        # We rely on topology-aware installed flows.
        self.logger.debug("PacketIn on switch %s", dp.id)
