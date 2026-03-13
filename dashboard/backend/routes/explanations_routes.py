from flask import Blueprint, jsonify
from services import explanation_service

explanations_bp = Blueprint('explanations', __name__)

@explanations_bp.route('/api/explanations/latest', methods=['GET'])
def get_latest_explanation():
    return jsonify(explanation_service.get_latest_explanation())
