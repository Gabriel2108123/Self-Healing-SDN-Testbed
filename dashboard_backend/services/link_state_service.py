from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Dict, List, Optional, Tuple


def _normalize_link_key(source: str, target: str) -> Tuple[str, str]:
    return tuple(sorted((source, target)))


@dataclass
class LinkState:
    source: str
    target: str
    status: str = "active"          # active | failed | degraded
    failure_count: int = 0
    last_failure_time: Optional[str] = None
    last_recovery_time: Optional[str] = None
    active_path: bool = False
    utilization: float = 0.0
    latency_ms: float = 0.0
    packet_loss: float = 0.0
    risk_score: float = 0.0

    def to_dict(self) -> dict:
        return asdict(self)


class LinkStateService:
    def __init__(self) -> None:
        self._links: Dict[Tuple[str, str], LinkState] = {}

    def reset(self) -> None:
        self._links.clear()

    def register_link(self, source: str, target: str) -> None:
        key = _normalize_link_key(source, target)
        if key not in self._links:
            self._links[key] = LinkState(source=key[0], target=key[1])

    def register_links_from_pairs(self, links: List[Tuple[str, str]]) -> None:
        for source, target in links:
            self.register_link(source, target)

    def get_link(self, source: str, target: str) -> Optional[LinkState]:
        key = _normalize_link_key(source, target)
        return self._links.get(key)

    def get_all_links(self) -> List[dict]:
        return [link.to_dict() for link in self._links.values()]

    def mark_failed(self, source: str, target: str) -> bool:
        link = self.get_link(source, target)
        if not link:
            return False

        link.status = "failed"
        link.failure_count += 1
        link.last_failure_time = datetime.utcnow().isoformat()
        link.active_path = False
        link.risk_score = min(100.0, link.risk_score + 25.0)
        return True

    def mark_recovered(self, source: str, target: str) -> bool:
        link = self.get_link(source, target)
        if not link:
            return False

        link.status = "active"
        link.last_recovery_time = datetime.utcnow().isoformat()
        link.risk_score = max(link.risk_score, 25.0 if link.failure_count > 0 else 0.0)
        return True

    def mark_degraded(self, source: str, target: str) -> bool:
        link = self.get_link(source, target)
        if not link:
            return False

        link.status = "degraded"
        return True

    def set_active_path(self, path_links: List[Tuple[str, str]]) -> None:
        active_keys = {_normalize_link_key(s, t) for s, t in path_links}

        for key, link in self._links.items():
            link.active_path = key in active_keys

    def set_metrics(
        self,
        source: str,
        target: str,
        utilization: Optional[float] = None,
        latency_ms: Optional[float] = None,
        packet_loss: Optional[float] = None,
        risk_score: Optional[float] = None,
    ) -> bool:
        link = self.get_link(source, target)
        if not link:
            return False

        if utilization is not None:
            link.utilization = utilization
        if latency_ms is not None:
            link.latency_ms = latency_ms
        if packet_loss is not None:
            link.packet_loss = packet_loss
        if risk_score is not None:
            link.risk_score = risk_score

        return True

    def get_healthy_links(self) -> List[dict]:
        return [
            link.to_dict()
            for link in self._links.values()
            if link.status == "active"
        ]

    def get_risky_links(self, minimum_score: float = 25.0) -> List[dict]:
        return [
            link.to_dict()
            for link in self._links.values()
            if link.risk_score >= minimum_score
        ]

    def get_failed_links(self) -> List[dict]:
        return [
            link.to_dict()
            for link in self._links.values()
            if link.status == "failed"
        ]
