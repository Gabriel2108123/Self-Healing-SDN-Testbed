from flask import Blueprint, jsonify
from services import dashboard_state_service

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    return jsonify(dashboard_state_service.get_dashboard_summary())
