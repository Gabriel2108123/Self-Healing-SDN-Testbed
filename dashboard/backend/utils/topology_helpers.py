def estimate_link_count(topology_type: str, switch_count: int) -> int:
    """
    Estimate the number of active links in the topology for Phase 1 dashboard display.
    """
    if topology_type == "ring":
        return switch_count
    elif topology_type == "mesh":
        # Full mesh: n*(n-1)/2
        return (switch_count * (switch_count - 1)) // 2
    return 0
