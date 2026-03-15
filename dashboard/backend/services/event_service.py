import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class EventService:
    def __init__(self):
        self._events = []
        self._next_id = 1
        
    def add_event(self, event_type: str, severity: str, message: str, metadata: dict = None):
        """
        Record a new dashboard event.
        severity: info, success, warning, error
        """
        event = {
            "id": f"evt_{self._next_id}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "type": event_type,
            "severity": severity,
            "message": message,
            "metadata": metadata or {}
        }
        self._events.insert(0, event)
        self._next_id += 1
        
        # Keep list bounded to last 100 events
        if len(self._events) > 100:
            self._events = self._events[:100]
            
        logger.info(f"Event [{severity.upper()}] - {message}")
        return event

    def get_recent_events(self, limit=50):
        """Return the most recent events up to the specified limit."""
        return self._events[:limit]
        
    def clear_events_if_needed(self):
        """Optional: clear events during a full system mock reset."""
        self._events = []
        logger.info("Events cleared.")
