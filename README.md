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

---

## CI/CD — Automated Frontend Deployment

A GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically builds the React frontend and deploys it to the `gh-pages` branch whenever you push changes to `dashboard/frontend/` on `main`.

### Setting up the required Personal Access Token

The deployment step needs write access to push to the `gh-pages` branch. This is done through a **Personal Access Token (PAT)** stored as a repository secret.

#### Step 1 — Create a PAT on GitHub

Choose one of the two token types:

| Token type | Where to create |
|---|---|
| **Classic token** | [github.com/settings/tokens](https://github.com/settings/tokens) → *Generate new token (classic)* |
| **Fine-grained token** | [github.com/settings/tokens](https://github.com/settings/tokens) → *Generate new token (fine-grained)* |

**Classic token** — select at minimum the `repo` scope (grants full read/write access to all repositories).

**Fine-grained token** — select this repository, then under *Repository permissions* set **Contents** to **Read and write**.

Copy the generated token — you will only see it once.

#### Step 2 — Add the token as a repository secret

1. Navigate to your repository on GitHub.
2. Go to **Settings → Secrets and variables → Actions**.
3. Click **New repository secret**.
4. Name it exactly `PAT_TOKEN` and paste the token value.
5. Click **Add secret**.

The workflow references this secret as `${{ secrets.PAT_TOKEN }}` and will now have the write access it needs to publish the built frontend.
