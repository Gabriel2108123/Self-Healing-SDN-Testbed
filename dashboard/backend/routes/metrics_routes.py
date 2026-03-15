from flask import Blueprint, jsonify
from services import metrics_service

metrics_bp = Blueprint('metrics', __name__)

@metrics_bp.route('/api/metrics', methods=['GET'])
def get_metrics():
    return jsonify(metrics_service.get_metrics())
