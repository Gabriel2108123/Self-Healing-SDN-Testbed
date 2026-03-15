def validate_topology_config(config):
    """
    Validates a topology configuration dictionary coming from the UI.
    Returns (is_valid: bool, error_message: str)
    """
    if not isinstance(config, dict):
        return False, "Configuration must be a JSON object."

    topo_type = config.get("topologyType")
    if topo_type not in ["ring", "mesh"]:
        return False, "Topology type must be 'ring' or 'mesh'."

    switch_count = config.get("switchCount")
    if not isinstance(switch_count, int) or not (3 <= switch_count <= 10):
        return False, "Switch count must be an integer between 3 and 10."

    hosts = config.get("hostsPerSwitch", 1)  # Default
    if not isinstance(hosts, int) or not (1 <= hosts <= 5):
        return False, "Hosts per switch must be an integer between 1 and 5."
        
    return True, ""
