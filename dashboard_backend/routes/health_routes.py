from flask import Blueprint, jsonify
from datetime import datetime, timezone

health_bp = Blueprint('health', __name__)

@health_bp.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "mode": "live",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
