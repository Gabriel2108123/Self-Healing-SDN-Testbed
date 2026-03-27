import os
import sys

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.join(PROJECT_ROOT, "dashboard_backend")

if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

os.chdir(BACKEND_ROOT)

from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
