# Self-Healing SDN Testbed — Dashboard

## Project Structure

```
sdn-self-healing-project/
├── docs/                        ← Log files (Ubuntu only)
│   ├── network_events.log
│   └── monitor_state.log
├── dashboard/
│   ├── backend/                 ← Flask API (runs on Ubuntu)
│   │   ├── app.py
│   │   ├── log_parser.py
│   │   └── requirements.txt
│   └── frontend/                ← React dashboard (built on Windows)
│       ├── src/
│       │   ├── config.js        ← ← EDIT THIS to switch mock/live mode
│       │   ├── components/
│       │   └── pages/
│       └── package.json
└── README.md
```

---

## Quick Start

### 1. Run the frontend (Windows — mock mode, no Ubuntu needed)

```powershell
cd dashboard/frontend
npm install
npm run dev
# Open http://localhost:5173
```

Mock data is enabled by default — the dashboard works immediately.

---

### 2. Connect to the real Ubuntu backend

**Step 1 — find Ubuntu IP:**
```bash
hostname -I   # e.g. 192.168.1.50
```

**Step 2 — install and run Flask on Ubuntu:**
```bash
cd ~/projects/sdn-self-healing-project/dashboard/backend
pip install -r requirements.txt
python app.py
```

**Step 3 — edit `src/config.js` on Windows:**
```js
export const MOCK_MODE = false;
export const API_BASE  = "http://192.168.1.50:5000/api";
```

**Step 4 — allow Ubuntu firewall (if needed):**
```bash
sudo ufw allow 5000
```

---

## API Endpoints

| Endpoint            | Description                         |
|---------------------|-------------------------------------|
| `GET /api/health`   | Liveness check                      |
| `GET /api/events`   | Parsed `network_events.log`         |
| `GET /api/monitor`  | Parsed `monitor_state.log`          |
| `GET /api/status`   | Controller status + active path     |
| `GET /api/topology` | Static topology descriptor          |
| `GET /api/dashboard`| Aggregated summary (main endpoint)  |

---

## Dashboard Panels

| Panel               | Data source                        |
|---------------------|------------------------------------|
| Controller Status   | `/api/dashboard` → `controller_status` |
| Connectivity        | `/api/dashboard` → `connectivity`      |
| Active Path         | `/api/dashboard` → `path_label`        |
| Link Failures       | `/api/dashboard` → `failures`          |
| Recoveries          | `/api/dashboard` → `recoveries`        |
| Topology Map        | `/api/topology` + `/api/dashboard`     |
| Link State Table    | `/api/dashboard` → `link_states`       |
| Event Log           | `/api/dashboard` → `recent_events`     |

---

## Git Workflow

```bash
# Windows — after editing
git add .
git commit -m "Update dashboard"
git push

# Ubuntu — pull latest and restart Flask
git pull
python dashboard/backend/app.py
```
