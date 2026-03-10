from pathlib import Path
from datetime import datetime

from ryu.base import app_manager
from ryu.controller import ofp_event
from ryu.controller.handler import MAIN_DISPATCHER, set_ev_cls
from ryu.topology import event


EVENT_LOG = Path(__file__).resolve().parents[1] / "docs" / "network_events.log"
STATE_LOG = Path(__file__).resolve().parents[1] / "docs" / "monitor_state.log"


def write_log(path: Path, message: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(path, "a", encoding="utf-8") as f:
        f.write(f"[{ts}] {message}\n")


class LinkMonitor(app_manager.RyuApp):
    def __init__(self, *args, **kwargs):
        super(LinkMonitor, self).__init__(*args, **kwargs)
        write_log(STATE_LOG, "LinkMonitor started")

    @set_ev_cls(ofp_event.EventOFPPortStatus, MAIN_DISPATCHER)
    def port_status_handler(self, ev):
        msg = ev.msg
        dp = msg.datapath
        port_no = msg.desc.port_no
        reason = msg.reason

        reason_map = {
            dp.ofproto.OFPPR_ADD: "ADD",
            dp.ofproto.OFPPR_DELETE: "DELETE",
            dp.ofproto.OFPPR_MODIFY: "MODIFY",
        }
        reason_text = reason_map.get(reason, f"UNKNOWN({reason})")

        line = f"Port status change on switch {dp.id}, port {port_no}, reason {reason_text}"
        self.logger.info(line)
        write_log(EVENT_LOG, line)

    @set_ev_cls(event.EventSwitchEnter)
    def switch_enter(self, ev):
        msg = f"Monitoring switch {ev.switch.dp.id}"
        self.logger.info(msg)
        write_log(STATE_LOG, msg)

    @set_ev_cls(event.EventSwitchLeave)
    def switch_leave(self, ev):
        msg = f"Switch left monitoring set: {ev.switch.dp.id}"
        self.logger.info(msg)
        write_log(STATE_LOG, msg)

    @set_ev_cls(event.EventLinkAdd)
    def link_add(self, ev):
        msg = (
            f"Observed link add: s{ev.link.src.dpid}:port{ev.link.src.port_no} "
            f"-> s{ev.link.dst.dpid}:port{ev.link.dst.port_no}"
        )
        self.logger.info(msg)
        write_log(EVENT_LOG, msg)

    @set_ev_cls(event.EventLinkDelete)
    def link_delete(self, ev):
        msg = (
            f"Observed link delete: s{ev.link.src.dpid}:port{ev.link.src.port_no} "
            f"-> s{ev.link.dst.dpid}:port{ev.link.dst.port_no}"
        )
        self.logger.info(msg)
        write_log(EVENT_LOG, msg)
