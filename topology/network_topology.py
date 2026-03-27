from mininet.net import Mininet
from mininet.node import RemoteController, OVSSwitch
from mininet.log import setLogLevel, info
from topology.topology_generator import get_topology
import sys
import time


def run(topology_type="ring", switch_count=3, hosts_per_switch=1):
    topo = get_topology(
        topology_type=topology_type,
        switch_count=switch_count,
        hosts_per_switch=hosts_per_switch,
    )

    net = Mininet(
        topo=topo,
        switch=OVSSwitch,
        controller=lambda name: RemoteController(name, ip="127.0.0.1", port=6633),
        autoSetMacs=True,
    )

    try:
        info(f"*** Starting {topology_type} topology with {switch_count} switches and {hosts_per_switch} hosts per switch\n")
        net.start()

        # Disable IPv6 to simplify connectivity testing
        for h in net.hosts:
            h.cmd("sysctl -w net.ipv6.conf.all.disable_ipv6=1 > /dev/null 2>&1")
            h.cmd("sysctl -w net.ipv6.conf.default.disable_ipv6=1 > /dev/null 2>&1")
            h.cmd("sysctl -w net.ipv6.conf.lo.disable_ipv6=1 > /dev/null 2>&1")

        info("*** Topology started successfully and running in backend-managed mode\n")

        # Keep process alive for backend control
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        info("*** Shutdown signal received\n")
    finally:
        info("*** Stopping topology\n")
        net.stop()


if __name__ == "__main__":
    setLogLevel("info")

    topology_type = "ring"
    switch_count = 3
    hosts_per_switch = 1

    try:
        if len(sys.argv) > 1:
            topology_type = sys.argv[1]

        if len(sys.argv) > 2:
            switch_count = int(sys.argv[2])

        if len(sys.argv) > 3:
            hosts_per_switch = int(sys.argv[3])

        run(topology_type, switch_count, hosts_per_switch)

    except ValueError as e:
        print(f"Configuration error: {e}")
        sys.exit(1)
