import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class ExplanationService:
    def __init__(self):
        self.latest_explanation = {
            "title": "System ready",
            "summary": "No explanation available yet.",
            "details": [],
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "severity": "info"
        }

    def set_explanation(self, title, summary, details=None, severity="info"):
        self.latest_explanation = {
            "title": title,
            "summary": summary,
            "details": details or [],
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "severity": severity
        }
        logger.info("Updated latest explanation: %s", title)

    def add_explanation(self, title, summary, details=None, severity="info"):
        """
        Alias helper in case other parts of the app call add_explanation().
        """
        self.set_explanation(title, summary, details, severity)

    def clear_explanation(self):
        self.latest_explanation = {
            "title": "System ready",
            "summary": "No explanation available yet.",
            "details": [],
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "severity": "info"
        }

    def get_latest_explanation(self):
        return self.latest_explanation.copy()
