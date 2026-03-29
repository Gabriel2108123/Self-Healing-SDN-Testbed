from .controller_service import ControllerService
from .metrics_service import MetricsService
from .event_service import EventService
from .explanation_service import ExplanationService
from .dashboard_state_service import DashboardStateService
from .mininet_service import MininetService
from .topology_service import TopologyService
from .link_state_service import LinkStateService

controller_service = ControllerService()
metrics_service = MetricsService()
event_service = EventService()
explanation_service = ExplanationService()
mininet_service = MininetService()
link_state_service = LinkStateService()

dashboard_state_service = DashboardStateService(
    metrics_service=metrics_service,
    event_service=event_service,
    explanation_service=explanation_service,
    controller_service=controller_service,
    link_state_service=link_state_service
)

topology_service = TopologyService(
    mininet_service=mininet_service,
    metrics_service=metrics_service,
    event_service=event_service,
    explanation_service=explanation_service,
    dashboard_service=dashboard_state_service,
    link_state_service=link_state_service
)

