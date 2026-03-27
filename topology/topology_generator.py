from mininet.topo import Topo

class RingTopology(Topo):

    def build(self, switch_count=3, hosts_per_switch=1):

        switches = []
        host_id = 1

        # Create switches
        for i in range(1, switch_count + 1):
            sw = self.addSwitch(f"s{i}", protocols="OpenFlow13")
            switches.append(sw)

            # Attach hosts to each switch
            for _ in range(hosts_per_switch):
                host = self.addHost(f"h{host_id}")
                self.addLink(host, sw)
                host_id += 1

        # Connect switches in ring
        for i in range(switch_count):
            self.addLink(switches[i], switches[(i + 1) % switch_count])


class MeshTopology(Topo):

    def build(self, switch_count=3, hosts_per_switch=1):

        switches = []
        host_id = 1

        # Create switches
        for i in range(1, switch_count + 1):
            sw = self.addSwitch(f"s{i}", protocols="OpenFlow13")
            switches.append(sw)

            # Attach hosts to each switch
            for _ in range(hosts_per_switch):
                host = self.addHost(f"h{host_id}")
                self.addLink(host, sw)
                host_id += 1

        # Connect every switch to every other switch
        for i in range(switch_count):
            for j in range(i + 1, switch_count):
                self.addLink(switches[i], switches[j])


def validate_topology_config(topology_type, switch_count, hosts_per_switch):
    topology_type = topology_type.lower()

    if topology_type not in ["ring", "mesh"]:
        raise ValueError(f"Unsupported topology type: {topology_type}")

    if not isinstance(switch_count, int) or switch_count < 3 or switch_count > 10:
        raise ValueError("Switch count must be an integer between 3 and 10.")

    if not isinstance(hosts_per_switch, int) or hosts_per_switch < 1:
        raise ValueError("Hosts per switch must be an integer greater than or equal to 1.")


def get_topology(topology_type, switch_count=3, hosts_per_switch=1):
    validate_topology_config(topology_type, switch_count, hosts_per_switch)
    topology_type = topology_type.lower()

    if topology_type == "ring":
        return RingTopology(switch_count=switch_count, hosts_per_switch=hosts_per_switch)

    if topology_type == "mesh":
        return MeshTopology(switch_count=switch_count, hosts_per_switch=hosts_per_switch)

    raise ValueError(f"Unsupported topology type: {topology_type}")
