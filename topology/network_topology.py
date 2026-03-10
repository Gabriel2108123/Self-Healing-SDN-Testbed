from mininet.topo import Topo
from mininet.net import Mininet
from mininet.node import RemoteController, OVSSwitch
from mininet.cli import CLI
from mininet.log import setLogLevel


class ResilientTopo(Topo):
    def build(self):
        h1 = self.addHost("h1", ip="10.0.0.1/24")
        h2 = self.addHost("h2", ip="10.0.0.2/24")

        s1 = self.addSwitch("s1", protocols="OpenFlow13")
        s2 = self.addSwitch("s2", protocols="OpenFlow13")
        s3 = self.addSwitch("s3", protocols="OpenFlow13")

        self.addLink(h1, s1)   # s1 port 1
        self.addLink(h2, s2)   # s2 port 1

        self.addLink(s1, s2)   # s1 port 2 <-> s2 port 2
        self.addLink(s1, s3)   # s1 port 3 <-> s3 port 1
        self.addLink(s3, s2)   # s3 port 2 <-> s2 port 3


def run():
    topo = ResilientTopo()

    net = Mininet(
        topo=topo,
        switch=OVSSwitch,
        controller=lambda name: RemoteController(name, ip="127.0.0.1", port=6633),
        autoSetMacs=True,
    )

    net.start()

    for h in net.hosts:
        h.cmd("sysctl -w net.ipv6.conf.all.disable_ipv6=1 > /dev/null 2>&1")
        h.cmd("sysctl -w net.ipv6.conf.default.disable_ipv6=1 > /dev/null 2>&1")
        h.cmd("sysctl -w net.ipv6.conf.lo.disable_ipv6=1 > /dev/null 2>&1")

    CLI(net)
    net.stop()


if __name__ == "__main__":
    setLogLevel("info")
    run()
