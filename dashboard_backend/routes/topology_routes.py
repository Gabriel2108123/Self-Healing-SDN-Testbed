from flask import Blueprint, request, jsonify
from services import topology_service, dashboard_state_service
from models.response_models import success_response, error_response

topology_bp = Blueprint('topology', __name__)

@topology_bp.route('/api/topology/create', methods=['POST'])
def create_topology():
    config = request.get_json() or {}
    success, msg = topology_service.create_topology(config)
    if success:
        return jsonify(success_response(msg, topology_service.get_current_topology()))
    else:
        return error_response(msg)

@topology_bp.route('/api/topology/reset', methods=['POST'])
def reset_topology():
    success, msg = topology_service.reset_topology()
    if success:
        return jsonify(success_response(msg, topology_service.get_current_topology()))
    else:
        return error_response(msg)

@topology_bp.route('/api/topology/stop', methods=['POST'])
def stop_topology():
    success, msg = topology_service.stop_topology()
    if success:
        return jsonify(success_response(msg))
    else:
        return error_response(msg)

@topology_bp.route('/api/topology/current', methods=['GET'])
def get_current_topology():
    return jsonify(success_response("Current topology retrieved successfully.", topology_service.get_current_topology()))

@topology_bp.route('/api/topology/simulate-failure', methods=['POST'])
def simulate_failure():
    payload = request.get_json() or {}
    success, msg = topology_service.simulate_failure(payload)
    if success:
        return jsonify(success_response(msg))
    else:
        return error_response(msg)

@topology_bp.route('/api/topology/simulate-random-failure', methods=['POST'])
def simulate_random_failure():
    success, result = topology_service.simulate_random_link_failure()
    if success:
        return jsonify(success_response("Random link failure simulated successfully.", result))
    else:
        return error_response(result)

@topology_bp.route('/api/topology/recover-link', methods=['POST'])
def recover_link():
    success, result = topology_service.recover_one_failed_link()
    if success:
        return jsonify(success_response("Link recovered successfully.", result))
    else:
        return error_response(result)

@topology_bp.route('/api/features/load-balancing', methods=['POST'])
def toggle_load_balancing():
    payload = request.get_json() or {}
    enabled = bool(payload.get("enabled", False))

    dashboard_state_service.set_feature_flags(lb_enabled=enabled)
    dashboard_state_service.set_active_path_strategy(
        "adaptive-load-distribution" if enabled else "single-path"
    )

    from services import metrics_service
    metrics_service.set_path_strategy(
        "adaptive-load-distribution" if enabled else "single-path"
    )

    return jsonify(success_response(
        f"Load balancing {'enabled' if enabled else 'disabled'}.",
        {
            "loadBalancingEnabled": enabled,
            "activePathStrategy": "adaptive-load-distribution" if enabled else "single-path"
        }
    ))

@topology_bp.route('/api/features/predictive-analytics', methods=['POST'])
def toggle_predictive_analytics():
    payload = request.get_json() or {}
    enabled = bool(payload.get("enabled", False))
    dashboard_state_service.set_feature_flags(pr_enabled=enabled)
    return jsonify(success_response(
        f"Predictive analytics {'enabled' if enabled else 'disabled'}.",
        {"predictiveRecoveryEnabled": enabled}
    ))

@topology_bp.route('/api/features/auto-failure-mode', methods=['POST'])
def toggle_auto_failure_mode():
    payload = request.get_json() or {}
    enabled = bool(payload.get("enabled", False))

    dashboard_state_service.set_auto_failure_mode(enabled)

    if enabled:
        topology_service.start_auto_failure_loop()
    else:
        topology_service.stop_auto_failure_loop()

    return jsonify(success_response(
        f"Auto-failure mode {'enabled' if enabled else 'disabled'}.",
        {"autoFailureEnabled": enabled}
    ))
