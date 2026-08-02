# WAREOps — Complete Deployment Guide

> **Validated:** All 24 integration tests pass locally (`docker compose up`).
> This guide uses the exact environment variables confirmed working in local testing.

---

## Table of Contents

1. [Architecture](#1-architecture)
2. [Prerequisites](#2-prerequisites)
3. [Local Development (docker compose)](#3-local-development)
4. [Railway Cloud Deployment](#4-railway-cloud-deployment)
   - 4.1 Create the Railway project
   - 4.2 Add database plugins
   - 4.3 Deploy api-gateway (the only public service)
   - 4.4 Deploy the 7 backend services
   - 4.5 Deploy the robot-simulator worker
   - 4.6 Set environment variables — exact values per service
   - 4.7 Run the database seed job
   - 4.8 Verify all services healthy
5. [Raspberry Pi Scanner Setup](#5-raspberry-pi-scanner-setup)
   - 5.1 Install dependencies
   - 5.2 Environment variables
   - 5.3 Start remote_shell.py
   - 5.4 Start ssh_proxy.py
   - 5.5 Running scans
6. [Using the Dashboard](#6-using-the-dashboard)
7. [Complete Testing Checklist](#7-complete-testing-checklist)
8. [Environment Variables Reference](#8-environment-variables-reference)
9. [Troubleshooting](#9-troubleshooting)
10. [Security Before Go-Live](#10-security-before-go-live)

---

## 1. Architecture

```
┌─────────────────────────── RAILWAY (cloud) ────────────────────────────────┐
│                                                                              │
│  Browser ──HTTPS──► api-gateway (nginx + React SPA)  ← public Railway URL  │
│                              │                                               │
│       /api/v1/auth ──────────►  auth-service        :8000  (internal)       │
│       /api/v1/warehouses ───►  topology-service     :8001  (internal)       │
│       /api/v1/robots ────────►  mission-service     :8002  (internal)       │
│       /api/v1/missions ──────►  mission-service     :8002  (internal)       │
│       /api/v1/observations ─►  observation-service  :8003  (internal)       │
│       /api/v1/inventory ────►  reconciliation-svc   :8004  (internal)       │
│       /api/v1/analytics ────►  reconciliation-svc   :8004  (internal)       │
│       /api/v1/alerts ───────►  alerting-service     :8005  (internal)       │
│       /api/v1/twin ─────────►  digital-twin-sync    :8006  (internal)       │
│       /socket.io/ ──────────►  digital-twin-sync    :8006  (internal)       │
│       /warehouses/*/twin/* ─►  digital-twin-sync    :8006  (internal)       │
│                                                                              │
│       [Postgres plugin]  [Redis plugin]                                      │
│       [robot-simulator worker — no public port]                              │
└──────────────────────────────────────────────────────────────────────────────┘
                                    ▲  HTTPS
┌────────── LOCAL Pi Laptop ─────────────────────────┐
│  scan.py          (autonomous inventory scanner)    │
│  remote_shell.py  (command relay via Socket.IO)     │
│  ssh_proxy.py     (SSH session relay)               │
│  ROS2 pi_bot      (robot navigation)                │
└─────────────────────────────────────────────────────┘
```

**Service routing summary:**

| Gateway path                        | Backend service         | Internal port |
|-------------------------------------|-------------------------|---------------|
| `/api/v1/auth`, `/api/v1/admin`     | auth-service            | 8000          |
| `/api/v1/warehouses`, `/api/v1/products`, `/api/v1/bins` | topology-service | 8001 |
| `/api/v1/robots`, `/api/v1/missions` | mission-service         | 8002          |
| `/api/v1/observations`              | observation-service     | 8003          |
| `/api/v1/inventory`, `/api/v1/analytics`, `/api/v1/reconciliation` | reconciliation-service | 8004 |
| `/api/v1/alerts`                    | alerting-service        | 8005          |
| `/api/v1/twin`, `/socket.io/`, `/api/v1/warehouses/*/twin/*` | digital-twin-sync | 8006 |
| everything else                     | React SPA (nginx html)  | —             |

---

## 2. Prerequisites

### Local machine
| Tool | Version | How to check |
|------|---------|-------------|
| Docker Desktop | 4.x+ | `docker --version` |
| Node.js | 20+ | `node --version` |
| Python | 3.10+ | `python3 --version` |
| Git | any | `git --version` |
| Railway CLI | latest | `npm install -g @railway/cli` |

### Railway account
- Sign up at **https://railway.app** (free Hobby plan works)
- Connect your GitHub account in Railway Settings → Integrations

### GitHub repo
Push the project before deploying:
```bash
cd /path/to/WAREOps
git add .
git commit -m "Production ready"
git push origin main
```

---

## 3. Local Development

### Step 1 — Build the React SPA
```bash
cd apps/ops-dashboard
npm install
npm run build
cd ../..
```

> The `dist/` folder is mounted into the nginx container by `docker-compose.yml`.
> You must rebuild it whenever you change frontend code.

### Step 2 — Start the full stack
```bash
docker compose up -d
```

Expected startup time: ~60 seconds for all services to become healthy.

### Step 3 — Seed the database
```bash
pip3 install openpyxl psycopg2-binary

DATABASE_URL="postgresql://warehouse_admin:warehouse_secret@localhost:5432/warehouse_platform" \
  python3 scripts/seed_warehouse_data.py
```

Expected output:
```
✓ Warehouse verified/seeded: a1b2c3d4-e5f6-7890-abcd-ef1234567890
✓ Topology seeded: 2 aisles, 4 racks, 16 shelves, 48 bins
✓ Products seeded: 48 items
✓ Inventory records: 48 product-bin mappings
```

### Step 4 — Open the dashboard
Navigate to **http://localhost:8080**

Login: `admin@wareops.dev` / `Password123!`

### Step 5 — Verify health
```bash
curl http://localhost:8080/health
# → {"status":"ok","service":"api-gateway"}

for port in 8000 8001 8002 8003 8004 8005 8006; do
  echo -n "Port $port: "; curl -s http://localhost:$port/health | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])"
done
```

### Step 6 — Full restart from scratch
```bash
docker compose down -v
(cd apps/ops-dashboard && npm run build)
docker compose up -d
sleep 40
DATABASE_URL="postgresql://warehouse_admin:warehouse_secret@localhost:5432/warehouse_platform" \
  python3 scripts/seed_warehouse_data.py
```

---

## 4. Railway Cloud Deployment

### 4.1 Create the Railway Project

1. Go to **https://railway.app/new**
2. Click **Deploy from GitHub repo**
3. Authorize Railway and select your **WAREOps** repository
4. Railway will scan the repo — **do NOT click Deploy yet**
5. Name the project (e.g. `wareops-production`)

### 4.2 Add Database Plugins

In the Railway project dashboard:

**Add PostgreSQL:**
1. Click **+ New** → **Database** → **Add PostgreSQL**
2. Railway creates a managed Postgres 16 instance
3. Go to the plugin's **Connect** tab — copy the `DATABASE_URL` value
4. It looks like: `postgresql://postgres:PASSWORD@HOST.railway.app:PORT/railway`

> **IMPORTANT:** Our services use SQLAlchemy `asyncpg` driver. You must change the scheme:
> `postgresql://` → `postgresql+asyncpg://`
>
> Example:
> ```
> postgresql+asyncpg://postgres:abc123@monorail.proxy.rlwy.net:12345/railway
> ```

**Add Redis:**
1. Click **+ New** → **Database** → **Add Redis**
2. Railway creates a managed Redis 7 instance
3. Go to the plugin's **Connect** tab — copy the `REDIS_URL` value
4. It looks like: `redis://default:PASSWORD@HOST.railway.app:PORT`

Keep both URLs open — you'll paste them into service env vars below.

### 4.3 Deploy api-gateway (the only public-facing service)

The `api-gateway` is the **only service** that needs a public URL. All others are internal.

1. Click **+ New** → **GitHub Repo** → select your WAREOps repo
2. **Service name:** `api-gateway` (must match exactly)
3. Go to **Settings → Build**:
   - **Dockerfile Path:** `infrastructure/nginx/Dockerfile`
   - **Build Context / Root Directory:** `.` (dot = repo root)
4. Go to **Settings → Deploy**:
   - **Health Check Path:** `/health`
   - Enable **Restart on failure**
5. Go to **Settings → Networking**:
   - Click **Generate Domain** — this gives you the public URL
   - Copy this URL (e.g. `https://wareops-production.up.railway.app`)
6. Set **Build Arguments** (in Settings → Build → Build Arguments):
   ```
   VITE_API_BASE_URL=/api/v1
   VITE_TOPOLOGY_API_URL=/api/v1
   VITE_WS_URL=
   ```
7. Set **Runtime Environment Variables** (Settings → Variables):
   ```
   PORT=8080
   AUTH_SERVICE_HOST=auth-service.railway.internal:8000
   TOPOLOGY_SERVICE_HOST=topology-service.railway.internal:8001
   MISSION_SERVICE_HOST=mission-service.railway.internal:8002
   OBSERVATION_SERVICE_HOST=observation-service.railway.internal:8003
   RECONCILIATION_SERVICE_HOST=reconciliation-service.railway.internal:8004
   ALERTING_SERVICE_HOST=alerting-service.railway.internal:8005
   TWIN_SERVICE_HOST=digital-twin-sync.railway.internal:8006
   ```

> **Railway internal DNS:** Services talk to each other using
> `<service-name>.railway.internal:<port>`.
> The service name is whatever you name it in Railway — it must match exactly.

### 4.4 Deploy the 7 Backend Services

Repeat the following for each service. For each:
1. Click **+ New** → **GitHub Repo** → select WAREOps repo
2. **Set the exact service name** (column 1 below)
3. Set Dockerfile Path and Build Context (columns 2–3)
4. Set Health Check Path (column 4)
5. **Do NOT generate a public domain** for any of these (internal only)

| Service name | Dockerfile Path | Build Context | Health Check |
|---|---|---|---|
| `auth-service` | `services/auth-service/Dockerfile` | `services/auth-service` | `/health` |
| `topology-service` | `services/topology-service/Dockerfile` | `services/topology-service` | `/health` |
| `mission-service` | `services/mission-service/Dockerfile` | `services/mission-service` | `/health` |
| `observation-service` | `services/observation-service/Dockerfile` | `services/observation-service` | `/health` |
| `reconciliation-service` | `services/reconciliation-service/Dockerfile` | `services/reconciliation-service` | `/health` |
| `alerting-service` | `services/alerting-service/Dockerfile` | `services/alerting-service` | `/health` |
| `digital-twin-sync` | `services/digital-twin-sync/Dockerfile` | `services/digital-twin-sync` | `/health` |

### 4.5 Deploy the Robot Simulator

1. Click **+ New** → **GitHub Repo** → WAREOps repo
2. **Service name:** `robot-simulator`
3. **Dockerfile Path:** `apps/robot-simulator/Dockerfile`
4. **Build Context:** `apps/robot-simulator`
5. No health check, no public domain
6. Enable **Restart on failure** with max retries = 10

### 4.6 Set Environment Variables — Exact Values Per Service

Go to each service → **Variables** tab. Set these exact values.

---

#### `auth-service`
```
DATABASE_URL=postgresql+asyncpg://postgres:PASSWORD@HOST.railway.app:PORT/railway
REDIS_URL=redis://default:PASSWORD@HOST.railway.app:PORT
SECRET_KEY=<generate: openssl rand -hex 32>
SERVICE_NAME=auth-service
PORT=8000
LOG_LEVEL=INFO
ENVIRONMENT=production
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
FRONTEND_URL=https://YOUR_GATEWAY_DOMAIN.up.railway.app
```

> `SECRET_KEY` must be at least 32 chars. Never commit it to git.
> Generate with: `openssl rand -hex 32`

---

#### `topology-service`
```
DATABASE_URL=postgresql+asyncpg://postgres:PASSWORD@HOST.railway.app:PORT/railway
REDIS_URL=redis://default:PASSWORD@HOST.railway.app:PORT
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
SERVICE_NAME=topology-service
PORT=8001
LOG_LEVEL=INFO
ENVIRONMENT=production
```

---

#### `mission-service`
```
DATABASE_URL=postgresql+asyncpg://postgres:PASSWORD@HOST.railway.app:PORT/railway
REDIS_URL=redis://default:PASSWORD@HOST.railway.app:PORT
TOPOLOGY_SERVICE_URL=http://topology-service.railway.internal:8001
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
SERVICE_NAME=mission-service
PORT=8002
LOG_LEVEL=INFO
ENVIRONMENT=production
```

---

#### `observation-service`
```
DATABASE_URL=postgresql+asyncpg://postgres:PASSWORD@HOST.railway.app:PORT/railway
REDIS_URL=redis://default:PASSWORD@HOST.railway.app:PORT
TOPOLOGY_SERVICE_URL=http://topology-service.railway.internal:8001
ALERTING_SERVICE_URL=http://alerting-service.railway.internal:8005
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
SERVICE_NAME=observation-service
PORT=8003
LOG_LEVEL=INFO
ENVIRONMENT=production
```

---

#### `reconciliation-service`
```
DATABASE_URL=postgresql+asyncpg://postgres:PASSWORD@HOST.railway.app:PORT/railway
REDIS_URL=redis://default:PASSWORD@HOST.railway.app:PORT
TOPOLOGY_SERVICE_URL=http://topology-service.railway.internal:8001
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
SERVICE_NAME=reconciliation-service
PORT=8004
LOG_LEVEL=INFO
ENVIRONMENT=production
```

---

#### `alerting-service`
```
DATABASE_URL=postgresql+asyncpg://postgres:PASSWORD@HOST.railway.app:PORT/railway
REDIS_URL=redis://default:PASSWORD@HOST.railway.app:PORT
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
SERVICE_NAME=alerting-service
PORT=8005
LOG_LEVEL=INFO
ENVIRONMENT=production
```

---

#### `digital-twin-sync`
```
REDIS_URL=redis://default:PASSWORD@HOST.railway.app:PORT
TOPOLOGY_SERVICE_URL=http://topology-service.railway.internal:8001
SERVICE_NAME=digital-twin-sync
PORT=8006
LOG_LEVEL=INFO
ENVIRONMENT=production
```

> Note: `digital-twin-sync` does NOT need `DATABASE_URL` — it uses only Redis.

---

#### `robot-simulator`
```
OBSERVATION_SERVICE_URL=http://observation-service.railway.internal:8003
MISSION_SERVICE_URL=http://mission-service.railway.internal:8002
TOPOLOGY_SERVICE_URL=http://topology-service.railway.internal:8001
WAREHOUSE_ID=a1b2c3d4-e5f6-7890-abcd-ef1234567890
ROBOT_COUNT=3
LOG_LEVEL=INFO
```

> `WAREHOUSE_ID` must be exactly `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
> — this is the UUID seeded by the init.sql and seed_warehouse_data.py.

---

### 4.7 Run the Database Seed Job

The seed script reads `warehouse_database.xlsx` and populates the Postgres database with the real warehouse topology (2 aisles, 4 racks, 48 bins, 48 products).

**It must be run once after the Postgres plugin is healthy and before the services handle real traffic.**

#### Option A — Railway CLI (recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link CLI to your Railway project
cd /path/to/WAREOps
railway link

# Run the seed script inside Railway's environment
# (uses the Railway DATABASE_URL automatically)
railway run python3 scripts/seed_warehouse_data.py
```

#### Option B — Remote connection from your machine

Get the public-facing Postgres connection string from Railway:
- Go to your Postgres plugin → **Connect** tab → copy the **Public URL**

```bash
pip3 install openpyxl psycopg2-binary

# Use the plain postgresql:// URL (NOT asyncpg — psycopg2 is sync)
DATABASE_URL="postgresql://postgres:PASSWORD@HOST.railway.app:PORT/railway" \
  python3 scripts/seed_warehouse_data.py
```

Expected output:
```
✓ Warehouse verified/seeded: a1b2c3d4-e5f6-7890-abcd-ef1234567890
✓ Topology seeded: 2 aisles, 4 racks, 16 shelves, 48 bins
✓ Products seeded: 48 items
✓ Inventory records: 48 product-bin mappings
Database seeding complete!
```

> The seed script is idempotent — safe to run multiple times. It uses
> `ON CONFLICT DO NOTHING` / `DO UPDATE` so no duplicate rows.

### 4.8 Verify All Services Healthy

Replace `DOMAIN` with your Railway gateway public URL:

```bash
export DOMAIN=https://wareops-production.up.railway.app

# Gateway
curl $DOMAIN/health
# → {"status":"ok","service":"api-gateway"}

# Auth
curl $DOMAIN/api/v1/auth/health
# → {"status":"healthy","service":"auth-service","version":"1.0.0"}

# Login (confirms DB + seed are working)
curl -s -X POST $DOMAIN/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@wareops.dev","password":"Password123!"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('role:', d['user']['role'])"
# → role: ENTERPRISE_ADMIN

# Warehouses (confirms topology seed)
TOKEN=$(curl -s -X POST $DOMAIN/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@wareops.dev","password":"Password123!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

curl -s $DOMAIN/api/v1/warehouses -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json; ws=json.load(sys.stdin); print(len(ws),'warehouse(s)')"
# → 1 warehouse(s)

# Products (confirms seed)
curl -s "$DOMAIN/api/v1/products?pageSize=100" -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d),'products')"
# → 61 products

# Digital twin
curl -s "$DOMAIN/api/v1/warehouses/a1b2c3d4-e5f6-7890-abcd-ef1234567890/twin/snapshot" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('twin keys:', list(d.keys()))"
# → twin keys: ['warehouse_id', 'robots', 'bins', 'stats', 'snapshot_ts']
```

---

## 5. Raspberry Pi Scanner Setup

The scanner runs on your **Pi laptop** (not on Railway). It connects to the Railway backend over HTTPS and relays commands from the browser admin panel.

### 5.1 Install Dependencies

```bash
# On the Pi laptop
sudo apt-get update && sudo apt-get install -y python3-pip python3-venv git

python3 -m venv ~/wareops_env
source ~/wareops_env/bin/activate

pip install \
  "python-socketio[client]==5.11.1" \
  "paramiko==3.4.0" \
  "requests==2.31.0" \
  "rich==13.7.0" \
  "openpyxl==3.1.2"

# Optional: for real QR camera scanning
pip install "opencv-python-headless==4.9.0.80"
```

For ROS2 navigation (slam_map / navigation.launch.py), follow the official
[ROS2 Humble install guide](https://docs.ros.org/en/humble/Installation.html).

### 5.2 Environment Variables

Create `~/wareops_scanner/.env.pi`:
```bash
# Cloud backend
export WAREOPS_API_URL=https://wareops-production.up.railway.app
export WAREOPS_API_TOKEN=your_token_here
export WAREOPS_WAREHOUSE_ID=a1b2c3d4-e5f6-7890-abcd-ef1234567890
export WAREOPS_SCANNER_ROBOT_ID=sc000000-0000-0000-0000-000000000001

# Optional
export SCAN_LOG_DIR=~/scan_logs
export SCAN_HEARTBEAT_INTERVAL=5
export ESP32_CAM_URL=http://192.168.43.100:81/stream
```

Load before every session:
```bash
source ~/wareops_scanner/.env.pi
```

Get `WAREOPS_API_TOKEN` by logging into the dashboard as admin:
Settings → API Tokens → Generate Token (or use a JWT from `/api/v1/auth/login`).

For quick testing, generate a token via CLI:
```bash
TOKEN=$(curl -s -X POST $WAREOPS_API_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@wareops.dev","password":"Password123!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
echo "WAREOPS_API_TOKEN=$TOKEN"
```

### 5.3 Start the Remote Shell Relay

The remote shell lets the browser Admin panel send commands to the Pi.

```bash
source ~/wareops_scanner/.env.pi
cd ~/wareops_scanner
python3 -m active_vision_scanner.remote_shell
```

You should see:
```
Connected to warehouse a1b2c3d4-e5f6-7890-abcd-ef1234567890
WAREOps Remote Shell listening for commands...
```

**Run as a background service (optional):**
```bash
sudo tee /etc/systemd/system/wareops-shell.service > /dev/null <<EOF
[Unit]
Description=WAREOps Remote Shell
After=network.target

[Service]
User=abhinav
WorkingDirectory=/home/abhinav/wareops_scanner
EnvironmentFile=/home/abhinav/wareops_scanner/.env.pi
ExecStart=/home/abhinav/wareops_env/bin/python3 -m active_vision_scanner.remote_shell
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl enable wareops-shell
sudo systemctl start wareops-shell
```

### 5.4 Start the SSH Proxy

The SSH proxy lets the browser SSH terminal connect to the Raspberry Pi robot.

```bash
source ~/wareops_scanner/.env.pi
cd ~/wareops_scanner
python3 -m active_vision_scanner.ssh_proxy
```

You should see:
```
WAREOps SSH Proxy starting...
  API URL: https://wareops-production.up.railway.app
  Warehouse ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
ssh_proxy connected to https://...
```

Run both `remote_shell` and `ssh_proxy` simultaneously (two terminal tabs, or two systemd services).

### 5.5 Running Scans

```bash
source ~/wareops_scanner/.env.pi
cd ~/wareops_scanner

# Scan entire warehouse
python3 -m active_vision_scanner.scan --scope full

# Scan one rack
python3 -m active_vision_scanner.scan --scope rack --target A1-RK1
python3 -m active_vision_scanner.scan --scope rack --target A2-RK2

# Scan one bin
python3 -m active_vision_scanner.scan --scope bin --target A1-RK1-S2-B3

# Dry run (no robot movement, no API calls)
python3 -m active_vision_scanner.scan --scope full --dry-run

# Custom log directory
python3 -m active_vision_scanner.scan --scope rack --target A1-RK1 --log-dir /var/log/wareops
```

Results are submitted to Railway in real time. Mismatches appear as alerts in the dashboard within 1–2 seconds.

---

## 6. Using the Dashboard

Open your Railway gateway URL in a browser. The React SPA loads instantly — it calls the same gateway `/api/v1/*` routes.

### 6.1 Demo Login Accounts

All use password: **`Password123!`**

| Email | Role | Landing page | Access |
|---|---|---|---|
| `admin@wareops.dev` | ENTERPRISE_ADMIN | `/admin/overview` | Everything + Pi Remote Control |
| `manager@wareops.dev` | WAREHOUSE_MANAGER | `/manager/executive` | Reports, analytics, mission oversight |
| `supervisor@wareops.dev` | WAREHOUSE_SUPERVISOR | `/supervisor/dashboard` | Mission control, alerts, reconciliation |
| `operator@wareops.dev` | WAREHOUSE_OPERATOR | `/operator/twin` | Digital twin, verification queue |

### 6.2 Admin Pi Remote Control Panel

Login as `admin@wareops.dev` → **Admin Overview** → scroll to **Raspberry Pi Remote Control**.

**Section 1 — SSH Terminal:**
1. IP: `10.225.34.209` (or your Pi's IP)
2. Username: `abhinav`
3. Password: your Pi user password
4. Click **Connect SSH**
5. Terminal shows: `[ssh_proxy] Connecting to abhinav@10.225.34.209:22...`
6. Type any command and press Enter — output appears live

**Section 2 — Quick Launch Buttons:**
- **Launch SLAM Mapping** → runs `ros2 launch pi_bot slam_map.launch.py`
- **Start Autonomous Nav** → runs `ros2 launch pi_bot navigation.launch.py`
- **Full Inventory Scan** → runs `python3 -m active_vision_scanner.scan --scope full`
- **Scan Specific Rack** → enter rack ID (e.g. `A1-RK1`) → click button
- **Scan Specific Bin** → enter bin code (e.g. `A1-RK1-S2-B3`) → click button

> The panel shows **"RELAY OFFLINE"** if `remote_shell.py` is not running on the Pi.

### 6.3 Digital Twin

Login as any role → **Digital Twin** page.

- Shows all 48 bin slots in real time (VERIFIED / MISMATCH / MISSING / UNSCANNED)
- Robot positions update live via WebSocket as heartbeats arrive
- Click any bin → see expected vs observed SKU + QR code
- Click **Request Priority Rescan** → creates a targeted SCHEDULED mission

### 6.4 Mission Control

Login as Supervisor → **Mission Control**

- Create mission with scope: FULL / RACK / AISLE / BIN
- Robot simulator picks it up within ~10 seconds (`GET /robots/{id}/next-task`)
- Progress updates in real time via WebSocket

### 6.5 Analytics

Login as Manager → **Executive Dashboard**

- Health score, inventory accuracy, mission success rate, robot uptime — all from real DB
- KPI values start at 0 and populate as observations flow in
- Export all data to CSV

---

## 7. Complete Testing Checklist

Run these tests in order after deploying to Railway.

```bash
export DOMAIN=https://wareops-production.up.railway.app

# Get admin token
TOKEN=$(curl -s -X POST $DOMAIN/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@wareops.dev","password":"Password123!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
```

### Test 1 — Gateway health
```bash
curl $DOMAIN/health
# → {"status":"ok","service":"api-gateway"}
```

### Test 2 — All 4 role logins
```bash
for email in admin manager supervisor operator; do
  R=$(curl -s -X POST $DOMAIN/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email@wareops.dev\",\"password\":\"Password123!\"}")
  echo "$email: role=$(echo $R | python3 -c "import sys,json; print(json.load(sys.stdin)['user']['role'])")"
done
# → admin: role=ENTERPRISE_ADMIN
# → manager: role=WAREHOUSE_MANAGER
# → supervisor: role=WAREHOUSE_SUPERVISOR
# → operator: role=WAREHOUSE_OPERATOR
```

### Test 3 — Warehouse data (seed verification)
```bash
curl -s $DOMAIN/api/v1/warehouses -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json; ws=json.load(sys.stdin); print(len(ws),'warehouse,', ws[0]['name'] if ws else 'NONE')"
# → 1 warehouse, Primary Distribution Center

curl -s "$DOMAIN/api/v1/products?pageSize=100" -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d),'products')"
# → 61 products (48 seeded + some from simulator registration)

curl -s "$DOMAIN/api/v1/inventory?warehouse_id=a1b2c3d4-e5f6-7890-abcd-ef1234567890" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d),'inventory records')"
# → 48 inventory records
```

### Test 4 — Live pipeline (observation → reconciliation → alert)
```bash
# Submit a matching observation
curl -s -X POST $DOMAIN/api/v1/observations/batch \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "robot_id": "a1110000-1111-1111-1111-111111111111",
    "warehouse_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "observations": [{
      "robot_id": "a1110000-1111-1111-1111-111111111111",
      "warehouse_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "bin_code": "A1-RK1-S1-B1",
      "decoded_qr": "WH-A1-R1-RK1-S1-P1",
      "detection_confidence": 0.97,
      "observed_at": "2024-01-01T12:00:00Z"
    }]
  }' | python3 -c "import sys,json; d=json.load(sys.stdin); print('created:', d)"

# Submit a mismatch observation (should create an alert)
curl -s -X POST $DOMAIN/api/v1/observations/batch \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "robot_id": "a1110000-1111-1111-1111-111111111111",
    "warehouse_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "observations": [{
      "robot_id": "a1110000-1111-1111-1111-111111111111",
      "warehouse_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "bin_code": "A1-RK1-S1-B2",
      "decoded_qr": "WRONG-SKU-999",
      "detection_confidence": 0.81,
      "observed_at": "2024-01-01T12:01:00Z"
    }]
  }'

# Wait 2 seconds then check alerts
sleep 2
curl -s $DOMAIN/api/v1/alerts -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json; a=json.load(sys.stdin); print(len(a),'open alert(s)')"
# → 1+ open alert(s)
```

### Test 5 — Mission creation
```bash
# Basic mission
curl -s -X POST $DOMAIN/api/v1/missions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Audit","warehouse_id":"a1b2c3d4-e5f6-7890-abcd-ef1234567890","priority":5}' \
  | python3 -c "import sys,json; m=json.load(sys.stdin); print('mission:', m.get('id'), 'status:', m.get('status'))"
# → mission: <uuid> status: SCHEDULED

# Rack-scoped mission
curl -s -X POST $DOMAIN/api/v1/missions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Rack Audit","warehouse_id":"a1b2c3d4-e5f6-7890-abcd-ef1234567890","audit_scope":"RACK","target_scope_id":"A1-RK1","priority":3}' \
  | python3 -c "import sys,json; m=json.load(sys.stdin); print('mission:', m.get('id'), 'scope:', m.get('audit_scope'))"
```

### Test 6 — Analytics
```bash
curl -s "$DOMAIN/api/v1/analytics/kpis?warehouse_id=a1b2c3d4-e5f6-7890-abcd-ef1234567890" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json; k=json.load(sys.stdin); print('KPIs:', {key: round(k[key],1) for key in ['health_score','inventory_accuracy','mission_success_rate','robot_uptime']})"
```

### Test 7 — Digital twin WebSocket (browser)
1. Open `$DOMAIN` in Chrome
2. Login as admin
3. Navigate to **Digital Twin** page
4. Open DevTools → Network → WS tab
5. Verify a WebSocket connection exists to `wss://your-domain/socket.io/`
6. Run a mismatch observation (Test 4)
7. The affected bin on the floor map should turn **red** within 2 seconds

### Test 8 — Pi Remote Shell (if Pi is running)
1. Login as admin → Admin Overview
2. Verify **"RELAY LIVE"** badge is green
3. Click **Full Inventory Scan** button
4. Terminal shows `$ cd ~/wareops_scanner && python3 -m active_vision_scanner.scan --scope full`

### Test 9 — SSH Terminal (if Pi is running)
1. Enter IP `10.225.34.209`, username `abhinav`, password
2. Click **Connect SSH**
3. Type `pwd` → output shows `/home/abhinav`
4. Type `ros2 --version` → shows ROS2 version

---

## 8. Environment Variables Reference

Complete table of every variable required per service. Use this as a checklist when setting Railway Variables.

### Shared values (set on every service that needs them)

| Variable | Value | Note |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://postgres:PASS@HOST:PORT/railway` | From Railway Postgres plugin — change `postgresql://` to `postgresql+asyncpg://` |
| `REDIS_URL` | `redis://default:PASS@HOST:PORT` | From Railway Redis plugin — use as-is |
| `KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` | Kafka is not used — this value disables Kafka without errors |
| `LOG_LEVEL` | `INFO` | All services |
| `ENVIRONMENT` | `production` | All services |

### Per-service variables

#### `auth-service` (port 8000)

| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://...` |
| `REDIS_URL` | `redis://...` |
| `SECRET_KEY` | `<openssl rand -hex 32>` — must be ≥32 chars, keep secret |
| `KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` |
| `SERVICE_NAME` | `auth-service` |
| `PORT` | `8000` |
| `LOG_LEVEL` | `INFO` |
| `ENVIRONMENT` | `production` |
| `FRONTEND_URL` | `https://YOUR_DOMAIN.up.railway.app` |

#### `topology-service` (port 8001)

| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://...` |
| `REDIS_URL` | `redis://...` |
| `KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` |
| `SERVICE_NAME` | `topology-service` |
| `PORT` | `8001` |

#### `mission-service` (port 8002)

| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://...` |
| `REDIS_URL` | `redis://...` |
| `TOPOLOGY_SERVICE_URL` | `http://topology-service.railway.internal:8001` |
| `KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` |
| `SERVICE_NAME` | `mission-service` |
| `PORT` | `8002` |

#### `observation-service` (port 8003)

| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://...` |
| `REDIS_URL` | `redis://...` |
| `TOPOLOGY_SERVICE_URL` | `http://topology-service.railway.internal:8001` |
| `ALERTING_SERVICE_URL` | `http://alerting-service.railway.internal:8005` |
| `KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` |
| `SERVICE_NAME` | `observation-service` |
| `PORT` | `8003` |

#### `reconciliation-service` (port 8004)

| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://...` |
| `REDIS_URL` | `redis://...` |
| `TOPOLOGY_SERVICE_URL` | `http://topology-service.railway.internal:8001` |
| `KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` |
| `SERVICE_NAME` | `reconciliation-service` |
| `PORT` | `8004` |

#### `alerting-service` (port 8005)

| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://...` |
| `REDIS_URL` | `redis://...` |
| `KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` |
| `SERVICE_NAME` | `alerting-service` |
| `PORT` | `8005` |

#### `digital-twin-sync` (port 8006)

| Variable | Value |
|---|---|
| `REDIS_URL` | `redis://...` |
| `TOPOLOGY_SERVICE_URL` | `http://topology-service.railway.internal:8001` |
| `SERVICE_NAME` | `digital-twin-sync` |
| `PORT` | `8006` |

#### `api-gateway` (port 8080, public)

**Runtime variables:**

| Variable | Value |
|---|---|
| `PORT` | `8080` |
| `AUTH_SERVICE_HOST` | `auth-service.railway.internal:8000` |
| `TOPOLOGY_SERVICE_HOST` | `topology-service.railway.internal:8001` |
| `MISSION_SERVICE_HOST` | `mission-service.railway.internal:8002` |
| `OBSERVATION_SERVICE_HOST` | `observation-service.railway.internal:8003` |
| `RECONCILIATION_SERVICE_HOST` | `reconciliation-service.railway.internal:8004` |
| `ALERTING_SERVICE_HOST` | `alerting-service.railway.internal:8005` |
| `TWIN_SERVICE_HOST` | `digital-twin-sync.railway.internal:8006` |

**Build arguments** (set in Settings → Build → Build Arguments):

| Arg | Value |
|---|---|
| `VITE_API_BASE_URL` | `/api/v1` |
| `VITE_TOPOLOGY_API_URL` | `/api/v1` |
| `VITE_WS_URL` | *(leave empty)* |

#### `robot-simulator` (no port)

| Variable | Value |
|---|---|
| `OBSERVATION_SERVICE_URL` | `http://observation-service.railway.internal:8003` |
| `MISSION_SERVICE_URL` | `http://mission-service.railway.internal:8002` |
| `TOPOLOGY_SERVICE_URL` | `http://topology-service.railway.internal:8001` |
| `WAREHOUSE_ID` | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| `ROBOT_COUNT` | `3` |
| `LOG_LEVEL` | `INFO` |

#### Pi Scanner (local `.env.pi`)

| Variable | Required | Value |
|---|---|---|
| `WAREOPS_API_URL` | Yes | `https://your-domain.up.railway.app` |
| `WAREOPS_API_TOKEN` | Yes | JWT from admin login |
| `WAREOPS_WAREHOUSE_ID` | Yes | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| `WAREOPS_SCANNER_ROBOT_ID` | Yes | `sc000000-0000-0000-0000-000000000001` |
| `SCAN_LOG_DIR` | No | `~/scan_logs` |
| `SCAN_HEARTBEAT_INTERVAL` | No | `5` |
| `ESP32_CAM_URL` | No | `http://192.168.43.100:81/stream` |

---

## 9. Troubleshooting

### Gateway returns 502 Bad Gateway

The upstream service is down or unreachable.

1. Check Railway service logs for the failing service
2. Verify the service name in Railway matches exactly what's in the gateway env vars
3. Example: if you named a service `auth_service` instead of `auth-service`, the
   hostname `auth-service.railway.internal` won't resolve
4. Check `DATABASE_URL` uses `postgresql+asyncpg://` — plain `postgresql://` will cause the service to crash on startup

### Login fails with 500 Internal Server Error

Auth-service started before Postgres was ready. The auth-service tables (`users`, `roles`, `permissions`, etc.) are created by SQLAlchemy on first startup — if Postgres wasn't ready, they weren't created.

**Fix:**
```bash
# Restart auth-service in Railway
# Go to auth-service → Settings → Restart Service
```

Or via CLI:
```bash
railway redeploy -s auth-service
```

### "Warehouses: 0 items" after login

Seed hasn't been run yet.

```bash
railway run python3 scripts/seed_warehouse_data.py
```

### Digital Twin shows "No twin data available"

Twin data populates from observations. Submit a test observation first (see Test 4 in Section 7), then reload the page.

### WebSocket not connecting (WS status: RECONNECTING)

1. Browser DevTools → Network → WS — check if the upgrade request is going to `wss://your-domain/socket.io/`
2. Check that `digital-twin-sync` is healthy in Railway
3. Nginx must proxy `/socket.io/` — verify the api-gateway was deployed with the latest `nginx.conf.template`

### "RELAY OFFLINE" in Admin panel

`remote_shell.py` is not running on the Pi laptop. Start it:
```bash
source ~/wareops_scanner/.env.pi
python3 -m active_vision_scanner.remote_shell
```

### SSH terminal fails to connect

- Verify `ssh_proxy.py` is running on the Pi (separate terminal from `remote_shell.py`)
- Verify SSH is enabled on the Pi: `sudo systemctl status ssh`
- Try manually: `ssh abhinav@10.225.34.209` — if this works, the proxy should too

### scan.py — "WAREOPS_API_URL not set"

```bash
source ~/wareops_scanner/.env.pi
```
The env file must be sourced in the same terminal as the scan command.

### Robots not picking up missions

The robot-simulator uses short IDs like `robot-001` until it registers with the backend. After it registers, it uses proper UUIDs. Check:
```bash
# Does the mission-service see heartbeats?
# In Railway: mission-service → Logs → look for POST /api/v1/robots/register
```

### Analytics returns "Internal server error"

The reconciliation tables have custom Postgres ENUM types (`mismatch_type`, `mission_status`, etc.). If a service queries these before they exist, it fails. Fix: restart reconciliation-service after all init.sql tables are created.

### init.sql — tables already exist on redeploy

Railway's Postgres plugin only runs `init.sql` on first startup (when the data directory is empty). On subsequent deploys the schema already exists. If you change `init.sql` after first deploy, run the migration manually:

```bash
# Connect to Railway Postgres via CLI
railway run psql $DATABASE_URL

-- Example: add a new column if it doesn't exist
ALTER TABLE missions ADD COLUMN IF NOT EXISTS audit_scope VARCHAR(50);
ALTER TABLE missions ADD COLUMN IF NOT EXISTS target_scope_id VARCHAR(255);
```

---

## 10. Security Before Go-Live

### Change demo passwords

The 4 demo accounts use `Password123!`. Change them via the admin UI or database:

```bash
# Via the admin dashboard: Admin → Users → Change Password
# Or via Railway psql:
railway run psql $DATABASE_URL
# Then update the password_hash column using bcrypt
```

### Rotate SECRET_KEY

The JWT signing secret must never be committed to git. Set a random value in Railway:

```bash
openssl rand -hex 32
# Copy output → auth-service → Variables → SECRET_KEY
```

Rotate it in Railway Variables whenever you suspect it was exposed.

### Remove or lock demo accounts

After onboarding real users, disable the demo accounts:
- Admin → Users → Deactivate `admin@wareops.dev`, `manager@wareops.dev`, etc.

### Restrict CORS origins

Each FastAPI service has `allow_origins=["*"]` for development. For production, set:
```python
allow_origins=["https://YOUR_DOMAIN.up.railway.app"]
```
This requires a code change and redeploy.

### Disable robot-simulator in production

Once real scanners are operational, remove the `robot-simulator` service in Railway (or set `ROBOT_COUNT=0`). The simulator still runs scheduled missions which consume resources and create noise in your data.

### Enable Railway environment protection

In Railway Settings → Environments, set the `production` environment to require manual approval for deployments.

---

## Quick Reference

| Task | Command |
|---|---|
| Start local stack | `docker compose up -d` |
| Rebuild SPA | `cd apps/ops-dashboard && npm run build` |
| Seed database (local) | `DATABASE_URL="postgresql://warehouse_admin:warehouse_secret@localhost:5432/warehouse_platform" python3 scripts/seed_warehouse_data.py` |
| Seed database (Railway) | `railway run python3 scripts/seed_warehouse_data.py` |
| Full local reset | `docker compose down -v && (cd apps/ops-dashboard && npm run build) && docker compose up -d` |
| Get Railway logs | `railway logs -s <service-name>` |
| Redeploy a service | `railway redeploy -s <service-name>` |
| Admin login | `admin@wareops.dev` / `Password123!` |
| Warehouse UUID | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| Pi SSH | `ssh abhinav@10.225.34.209` |
| Start SLAM mapping | `ros2 launch pi_bot slam_map.launch.py` |
| Start autonomous nav | `ros2 launch pi_bot navigation.launch.py` |
| Full scan (Pi) | `python3 -m active_vision_scanner.scan --scope full` |
| Rack scan (Pi) | `python3 -m active_vision_scanner.scan --scope rack --target A1-RK1` |

---

*Last validated: All 24 integration tests pass (`docker compose up` + full test suite)*
