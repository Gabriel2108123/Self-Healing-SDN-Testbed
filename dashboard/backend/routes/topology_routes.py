from flask import Blueprint, request, jsonify
from services import topology_service
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
