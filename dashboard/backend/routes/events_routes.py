from flask import Blueprint, jsonify
from services import event_service

events_bp = Blueprint('events', __name__)

@events_bp.route('/api/events', methods=['GET'])
def get_events():
    return jsonify(event_service.get_recent_events())
