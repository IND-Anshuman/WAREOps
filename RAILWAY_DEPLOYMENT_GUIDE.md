# WAREOps Full Production Railway Deployment Guide

This guide covers the manual steps required to deploy the full WAREOps monorepo to Railway using Railway's Monorepo support, ensuring all services communicate over private networking and use the real data pipelines.

## 1. Create the Railway Project
1. Go to the [Railway Dashboard](https://railway.app/dashboard).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select your `WAREOps` repository.

## 2. Add Managed Databases
1. In your Railway project, click **New** → **Database** → **Add PostgreSQL**.
2. Click **New** → **Database** → **Add Redis**.
*(Railway will automatically inject `DATABASE_URL` and `REDIS_URL` into your services once they are linked).*

## 3. Deploy the Microservices
For **each** of the 7 backend services (`auth-service`, `topology-service`, `mission-service`, `observation-service`, `reconciliation-service`, `alerting-service`, `digital-twin-sync`), do the following:

1. Click **New** → **GitHub Repo** (Select `WAREOps`).
2. Once the service appears, go to **Settings** → **Build**.
3. Change **Root Directory** to `services/<service-name>` (e.g., `services/auth-service`).
4. Ensure **Builder** is set to Dockerfile.
5. Go to **Variables** and link the PostgreSQL and Redis databases so they receive `DATABASE_URL` and `REDIS_URL`.
6. For `digital-twin-sync`, it requires `REDIS_URL`. It no longer uses Kafka.
7. Under **Settings** → **Networking**, ensure the internal domain is `<service-name>.railway.internal`. If the auto-generated name is different, rename the service in Railway to exactly match the service name (e.g., `auth-service`, `topology-service`, etc.). This is critical for the Nginx gateway to route correctly.

## 4. Deploy the API Gateway (Nginx)
1. Click **New** → **GitHub Repo** (Select `WAREOps`).
2. Go to **Settings** → **Build** and set **Root Directory** to `infrastructure/nginx`.
3. Rename the service to `api-gateway`.
4. Go to **Settings** → **Networking** and click **Generate Domain**. This will be your public gateway URL (e.g., `api-gateway-production.up.railway.app`).

## 5. Deploy the Ops Dashboard (Frontend)
1. Click **New** → **GitHub Repo** (Select `WAREOps`).
2. Go to **Settings** → **Build** and set **Root Directory** to `apps/ops-dashboard`.
3. Under **Variables**, add the following Build-time arguments:
   - `VITE_API_BASE_URL`: `/api/v1`
   - `VITE_TOPOLOGY_API_URL`: `/api/v1`
   - `VITE_WS_URL`: (leave blank)
4. Go to **Settings** → **Networking** and generate a public domain for the frontend. (Alternatively, you can configure the API gateway to serve the frontend, but Railway handles static sites efficiently this way).

## 6. Deploy the Robot Simulator
1. Click **New** → **GitHub Repo** (Select `WAREOps`).
2. Go to **Settings** → **Build** and set **Root Directory** to `apps/robot-simulator`.
3. Under **Variables**, add:
   - `API_BASE_URL`: `http://api-gateway.railway.internal:8080/api/v1`
   - `WS_URL`: `http://api-gateway.railway.internal:8080`
   - `WAREHOUSE_ID`: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

## 7. Connecting the Physical Robot Scanner
For your local `ROS2 active_vision_scanner`, update your environment variables or local `.env` to point to the public Railway API Gateway URL instead of `localhost`:

```bash
export WAREOPS_BACKEND_URL="https://api-gateway-production.up.railway.app/api/v1"
```

The `ScannerAPIBridge` we configured will automatically route observations, alerts, and robot heartbeats to this public endpoint.
