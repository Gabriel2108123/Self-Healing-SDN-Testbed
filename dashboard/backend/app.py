import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS

from routes.health_routes import health_bp
from routes.dashboard_routes import dashboard_bp
from routes.topology_routes import topology_bp
from routes.metrics_routes import metrics_bp
from routes.events_routes import events_bp
from routes.explanations_routes import explanations_bp
from models.response_models import error_response

def create_app():
    # Configure logging
    log_dir = os.path.join(os.path.dirname(__file__), "logs")
    os.makedirs(log_dir, exist_ok=True)
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(os.path.join(log_dir, 'api.log')),
            logging.StreamHandler()
        ]
    )
    
    logger = logging.getLogger(__name__)
    logger.info("Starting Self-Healing SDN Testbed Backend - Phase 1 Foundation")

    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'sdn-dashboard-secret-phase1'
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(topology_bp)
    app.register_blueprint(metrics_bp)
    app.register_blueprint(events_bp)
    app.register_blueprint(explanations_bp)

    @app.errorhandler(400)
    def bad_request(e):
        logger.warning(f"400 Bad Request: {e}")
        return error_response("Bad Request", status_code=400)

    @app.errorhandler(404)
    def not_found(e):
        return error_response("Endpoint not found", status_code=404)

    @app.errorhandler(500)
    def internal_error(e):
        logger.error(f"500 Internal Error: {e}", exc_info=True)
        return error_response("Internal Server Error", status_code=500)

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=False)
