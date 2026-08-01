# WAREOps — Full Real-Data Deployment Plan (Railway + Local Scanner + Simulator)

## Architecture (confirmed by you)
```
[Robot+ESP32-CAM] --WiFi--> [Laptop: ROS2 active_vision_scanner]
                                       |
                                  HTTPS POST (observations/alerts/heartbeat)
                                       v
        ┌─────────────────── RAILWAY (cloud) ───────────────────────────┐
        │  Postgres  Redis                                               │
        │   ^  ^                                                        │
        │   |  |  Redis Pub/Sub                                         │
        │  auth-service  topology-service  mission-service               │
        │  observation-service  reconciliation-service  alerting-service │
        │  digital-twin-sync (twin state + Socket.IO)                    │
        │  api-gateway (nginx)                                           │
        │  ops-dashboard (React SPA, served via gateway)                 │
        │  robot-simulator (always-on, feeds live pipeline)              │
        └────────────────────────────────────────────────────────────────┘
                  ^
                  | same gateway HTTPS
        [Browser: supervisor/operator/manager/admin dashboards]
```
- Scanner = local (ROS2 + hardware), pushes to cloud over HTTPS via `scanner_api_bridge.py`.
- Simulator = always-on Railway service feeding the live pipeline so the twin/alerts/analytics are never empty.
- Web = monitor + create/start/stop missions + request rescans.

This plan is grouped into **10 workstreams**. Each lists exact files + what changes.

---

## WORKSTREAM A — Fix the broken frontend `client.ts` & remove ALL mock data

**Why first:** `apps/ops-dashboard/src/api/client.ts` currently does NOT compile (orphaned `MOCK_*` refs, stray `` ` ``/`;;` fragments, unimported `InventoryItem`). This blocks `npm run build` and the Docker image build. Several pages still render hardcoded/mock data.

### A1. Rewrite `apps/ops-dashboard/src/api/client.ts` cleanly
- Remove every leftover mock fragment (lines 93, 112, 131-132, 137-138, 143-144, 149-150, 155-171, 184-200, 205-224, 267-268, 278-284, 298-301, 321-332, 337, 343-347).
- Move `InventoryItem` + `PendingObservation` types out of `mockData.ts` into `src/types/index.ts` (keep the field shapes the consuming pages expect). Update imports in `ProductFinder.tsx`, `VerificationQueue.tsx`, `client.ts`.
- Re-import the type properly so `productsApi` typechecks.
- Remove the now-dead `mockData.ts` file **after** all its type imports are relocated. Also delete the 3 dead secondary modules (`api/topology.ts`, `api/missions.ts`, `api/alerts.ts`) — confirmed zero importers. Keep `api/observations.ts` and `api/reconciliation.ts` (they have real importers) but **fix their path-doubling bug** (strip the leading `/api/v1` from every call since `apiClient.baseURL` already ends in `/api/v1`).
- Add a global **401 → token refresh → retry** response interceptor on `apiClient` (currently `refreshToken` exists but is never called on expiry). On refresh failure, clear auth store and redirect to `/login`.

### A2. Replace mock/hardcoded data in pages (drive everything from real APIs)
- `manager/ReportsPage.tsx` — replace `MOCK_INVENTORY_ITEMS`/`MOCK_ALERTS`/`MOCK_MISSIONS` with `inventoryApi.searchInventory`, `alertsApi.getAlerts`, `missionsApi.getMissions`. CSV export already maps over the arrays; just swap the source.
- `admin/AdminOverview.tsx` — replace the hardcoded `INITIAL_WAREHOUSES` (6 fake warehouses) with `GET /warehouses` from topology (via a new `warehousesApi` in client.ts). Only show warehouses that actually exist in the DB.
- `supervisor/SupervisorDashboard.tsx` & `supervisor/TeamMonitor.tsx` — drop `MOCK_TEAM`; use `adminApi.getUsers` (already imported) for the team panel.
- `manager/ExecutiveDashboard.tsx` — remove `Math.random()` `alertTrendData`; use `analyticsApi.getAlertFrequency`. Replace hardcoded `"99.2%"`/etc KPI strings with `analyticsApi.getWarehouseKPIs` values (computed server-side in Workstream G).
- `operator/DigitalTwin.tsx` — stop rendering the locally-built 96-bin topology. Instead render the real twin snapshot from `GET /warehouses/{id}/twin/snapshot` + `GET /warehouses/{id}/twin/robots`, and wire the existing-but-dead `useWebSocket` hook so live robot/bin updates push in via Socket.IO (replacing the `setInterval` waypoint animation).
- `observations.ts` — remove the `MOCK_OBSERVATIONS` fallbacks in `getPendingQueue`/`resolveObservation`.

### A3. Frontend env/config for Railway
- `.env.production`: set `VITE_API_BASE_URL=/api/v1`, `VITE_TOPOLOGY_API_URL=/api/v1` (same origin — gateway routes everything), `VITE_WS_URL=` (empty → use same-origin `/socket.io/`).
- `useWebSocket.ts`: default `VITE_WS_URL` to same-origin (not `localhost:8001`).
- Verify `apps/ops-dashboard/Dockerfile` build args match; verify `nginx.conf` SPA fallback. (Both are untracked/new — fine as-is once A1/A2 make `tsc` pass.)

---

## WORKSTREAM B — Auth RBAC: roles, permissions, login & /me responses

**Why:** The `User` model has no `role`; login returns no role/permissions/warehouse_ids. The frontend's role-based routing can't work. You chose **full RBAC tables**. The good news: `Role`, `Permission`, `RolePermission`, `UserRole` tables **already exist** in the model — they're just never seeded or queried.

### B1. Seed roles + permissions + user-role links (`services/auth-service/app/seed.py`)
- On startup, idempotently create 4 system roles in the default org: `ENTERPRISE_ADMIN`, `MANAGER`, `SUPERVISOR`, `OPERATOR` (names match frontend `UserRole`).
- Create a base permission set (resource+action pairs, e.g. `mission:create`, `alert:resolve`, `inventory:rescan`, `user:invite`, `twin:view`) and link them to roles (admin gets all; manager most; supervisor ops+alerts; operator limited).
- Assign each of the 4 demo users their corresponding role via `UserRole`.

### B2. Return role + warehouse_ids + permissions in auth responses
- Add a helper `build_user_profile(session, user)` that joins `UserRole→Role→RolePermission→Permission` and the `UserRole.warehouse_id` values into `{ role: <role_name>, warehouse_ids: [...], permissions: ["<resource>:<action>", ...] }`.
- Extend `UserResponse` schema + the `/auth/login` and `GET /auth/me` payloads to include `role`, `warehouse_ids`, `permissions`. (These are the fields the frontend's `normalizeUser` in `client.ts` already expects.)
- Embed `role` + `warehouse_ids` into JWT claims too (for future backend-side authz).

### B3. Keep the 4 demo logins (your choice), seeded on startup, password `Password123!`, clearly marked as seed accounts. Document them in the post-deploy guide.

---

## WORKSTREAM C — Backend data pipeline: make data actually flow

**Why:** Today: simulator endpoints are missing → simulator stays IDLE; observations persist but never publish → twin/alerts/analytics never populate. This is the core of "everything actually working."

### C1. Add the endpoints the robot-simulator needs
In `mission-service` (`mission_router.py`):
- `POST /api/v1/robots` — register/upsert a robot by `serial_number` (idempotent; returns the Robot row). (Robot model already exists.)
- `POST /api/v1/robots/{id}/heartbeat` — accepts `{x,y,z,yaw,battery_pct,status,mission_id?}`; updates `current_coord_*`, `battery_pct`, `last_heartbeat`, `status`, `active_mission_id`. Also publishes a heartbeat to Redis channel `robot.telemetry.heartbeat` (mission-service Redis db) so the twin can pick it up — **or** better, publish directly to the shared Redis the twin reads (see C4).
- `GET /api/v1/robots/{id}/next-task` — picks the next `SCHEDULED` mission assigned to (or available for) this robot in its warehouse, sets it `IN_PROGRESS`, assigns `active_mission_id`, returns `{mission_id, warehouse_id, bins:[...]}`. If none, return 204.

In `observation-service` (`observation_router.py`):
- `POST /api/v1/observations/batch` — accept `ObservationBatch` (already defined in schema), create each observation, publish events (C2). (Simulator calls this.)

### C2. observation-service: persist AND publish
- Instantiate a Redis client in `main.py` (reuse `REDIS_URL`, db 2).
- After `create_observation`, publish an `observation.raw` event to Redis channel `observation.raw` with the fields the twin consumer expects (`warehouse_id, bin_id, bin_code, sku/decoded_qr, confidence, ...`). This is the trigger that makes the twin + reconciliation fire.
- Use a transactional-outbox-style safety: publish-after-commit (listener pattern on the SQLAlchemy session) so we don't publish a partial row.

### C3. Reconciliation: actually run + emit mismatch/verified + create alerts
You chose full pipeline. Two viable designs; I'll implement the **synchronous hook** (simplest, robust on Railway, no extra consumer process):
- In observation-service, after creating an observation, call a lightweight reconciliation step: compare `decoded_qr` against the expected SKU for that bin (from the `inventory` table via topology-service or a direct DB read). On mismatch → publish `inventory.reconciliation.mismatch`; on match → publish `inventory.reconciliation.verified`. Also create an `alert` row (via alerting-service API or direct DB insert into the shared Postgres `alerts` table) for mismatches.
- This activates the twin's `_handle_mismatch`/`_handle_verified` handlers (already written in `consumer.py`), which mark bins MISMATCH/VERIFIED and fan out via Socket.IO.
- Fix `reconciliation_router.py:25` `DEFAULT_WAREHOUSE_ID` (the all-ones UUID) → use the real warehouse id from request context/query (so inventory/alerts endpoints actually return the seeded warehouse's data).

### C4. Single shared Redis for Pub/Sub
The twin consumer subscribes to channels; the producers must publish to the **same Redis instance**. Compose currently gives each service a different Redis db (0-5) — that's fine for Pub/Sub **only if** they're the same Redis server (db number doesn't isolate Pub/Sub channels). Confirm/implement: all services connect to the same Redis host; twin reads `twin:updates:*` and the 4 event channels regardless of db. (Redis Pub/Sub is global across dbs, so this works. I'll verify the consumer subscribes correctly — it does.)

### C5. Mission lifecycle → twin
When a mission is started/completed from the web (Workstream E), the simulator picks it up via `next-task`, runs scans, and observations flow through C2/C3. No extra wiring needed.

---

## WORKSTREAM D — Analytics & KPIs endpoints (real computation)

**Why:** `analyticsApi` (kpis, accuracy-trend, alert-frequency, mission-stats) is called by the frontend but has no real backend (no analytics-service exists; nginx routes `/analytics` to reconciliation-service which has no such endpoints).

- Add to **reconciliation-service** (it already owns alerts + inventory): `GET /api/v1/analytics/kpis?warehouse_id=`, `accuracy-trend?warehouse_id=&days=`, `alert-frequency?warehouse_id=`, `mission-stats?warehouse_id=`. Compute from real `observations`, `reconciliation_results`, `alerts`, `missions` tables in Postgres (count/success-rate/accuracy = verified/(verified+mismatch), time-series `GROUP BY date`). Return shapes matching the frontend types (`WarehouseKPIs`, `AccuracyDataPoint[]`, `AlertFrequencyPoint[]`).
- These replace the hardcoded values removed in A2.

---

## WORKSTREAM E — Mission/Robot remote control from the web

**Why:** You want "monitor + trigger missions." Frontend `missionsApi` already calls the right endpoints; they exist in mission-service. What's missing:
- Verify `MissionCreate` schema accepts the frontend payload (`name, warehouse_id, robot_id?, priority, audit_scope, target_scope_id, bins_total`).
- Ensure a created mission (status SCHEDULED) is picked by `next-task` (C1) and assignable to a robot.
- Rescan flow: `inventoryApi.requestRescan` → `/inventory/bins/{id}/rescan`. Add this endpoint to reconciliation-service (or mission-service) that creates a targeted SCHEDULED mission for one bin, so the simulator/scanner re-scans it.
- Frontend `DigitalTwin.tsx` "start mission" / MissionControl start/pause/complete already call existing endpoints — just verify they work post-C1.

---

## WORKSTREAM F — Active Vision Scanner integration (local → cloud)

**Why:** Scanner currently writes only CSVs. You want it to push real scans to the cloud backend.

### F1. Fix `scanner_api_bridge.py` schema mismatches
- `submit_observation`: send fields matching `ObservationIngest` — add required `robot_id` (a dedicated scanner robot UUID, configurable via `WAREOPS_SCANNER_ROBOT_ID`), `observed_at` (UTC now), rename `robot_x/y/z`→`robot_coord_x/y/z`, map `detected_sku`→`decoded_qr` (the QR is what's decoded), `confidence`→`detection_confidence`. Keep `image_url` out (or base64 into `image_b64`).
- `submit_mismatch_alert`: send `expected_value`/`observed_value` (free text) + `bin_id` (UUID) instead of `expected_sku`/`observed_sku`/`bin_code`. Resolve bin_id by bin_code lookup first (via topology).
- `_load_local_products` + `get_product_database`: fix xlsx header reads to the real headers (`QR_Code`, `Product_Code`, `Product_Serial_Number`, `Category_Number`) instead of `SKU Number`/`Product Name`.
- `send_robot_heartbeat`: the target `/api/v1/twin/robot-heartbeat` doesn't exist. Add it (Workstream G) so the scanner's position shows on the live twin.

### F2. Add `POST /api/v1/twin/robot-heartbeat` to digital-twin-sync
- Accepts `{warehouse_id, robot_id, x, y, z, yaw, battery_pct, status}`, calls `twin_state.update_robot_position(...)` and publishes the same `robot.telemetry.heartbeat` delta the consumer emits, so connected web clients see the scanner robot move in real time.

### F3. Wire the bridge into `rack_scanner_node.py`
- In `process_scan_results`: for each scanned bin, call `bridge.submit_observation(...)` (correct scans) and `bridge.submit_mismatch_alert(...)` (mismatches/unknowns). Keep the CSV logging as a local backup, but the cloud API becomes the source of truth.
- Replace the hardcoded `/home/abhinav/...` paths (lines 121-123, 828) with parameters/env-relative paths.

### F4. Scanner env config (local run)
- Document `WAREOPS_API_URL` (Railway gateway public URL), `WAREOPS_API_TOKEN`, `WAREOPS_WAREHOUSE_ID`, `WAREOPS_SCANNER_ROBOT_ID` for the scanner laptop.

---

## WORKSTREAM G — Real data seeding from `warehouse_database.xlsx`

**Why:** The xlsx is your real structural dataset (48 products, 2 aisles, 2 racks, 4 shelves). The seeder exists but its column lookups don't match the real headers → it seeds nothing.

### G1. Fix `scripts/seed_warehouse_data.py` header lookups
- Map to real headers: `Product_Code`→(aisle/row/rack/shelf/position parse, already works via regex on `WH-A1-R1-RK1-S1-P1`), `Product_Serial_Number`→serial/barcode, `Category_Number`→category, `QR_Code`→store as `bins.qr_code` (the scanner decodes these exact QR strings, so the expected-vs-observed match works end-to-end).
- Synthesize product `name` (e.g. `Product <serial>`) and `sku` (use `Product_Code` as SKU since the xlsx has no separate SKU column; document this choice).
- Set `expected_qty` = 1 per bin (one product per position in your dataset).
- Also seed the demo warehouse's `warehouses` row idempotently if missing, and assign `bins.qr_code` = the xlsx QR (critical — this is what reconciliation compares against).
- Add a `requirements` note: `openpyxl`, `psycopg2-binary`.

### G2. Make seeding reproducible on Railway
- Provide a one-off Railway **job** (or document the `railway run` command) that executes `seed_warehouse_data.py` with `DATABASE_URL` pointing to Railway Postgres, after the DB service is up. Idempotent (`ON CONFLICT DO NOTHING/UPDATE`), safe to re-run.

---

## WORKSTREAM H — Railway deployment configuration

**Why:** Host the whole stack on Railway from GitHub.

### H1. Per-service Railway config
- Root `railway.toml` currently points only at the gateway. Add/configure **each service** in Railway (Railway monorepo: each service = one service with its own build context + Dockerfile + env + healthcheck):
  - Postgres (Railway managed plugin) → expose `DATABASE_URL`.
  - Redis (Railway managed plugin) → expose `REDIS_URL`.
  - 7 FastAPI services: build from each `services/*/Dockerfile`; healthcheck `/health`; inject envs (`DATABASE_URL`, `REDIS_URL` = Railway plugin vars, plus `SECRET_KEY`, service URLs = Railway **internal** hostnames, `PORT`).
  - api-gateway (nginx): build from `infrastructure/nginx/Dockerfile`; nginx `map` upstreams resolved via Railway internal DNS (the uncommitted nginx.conf diff already does this with `resolver 127.0.0.11` — adapt to Railway's internal DNS).
  - ops-dashboard: build from `apps/ops-dashboard/Dockerfile` with prod env build args; serve behind the gateway (or as its own Railway service proxied by the gateway).
  - robot-simulator: build from `apps/robot-simulator/Dockerfile`; `restart: always`; envs pointing at Railway internal service URLs.

### H2. Env wiring & cross-service URLs
- Create a canonical env-var map (documented in the post-deploy guide): internal service hostnames are `<service>.<project>.railway.internal`, ports via Railway's `PORT`-injection. Update each service's config defaults to read these from env (most already do).
- Set MinIO alternatives: since Railway MinIO is awkward, allow `observation-service` to run **without** MinIO (image upload optional — `image_b64`/`image_url` nullable). Already nullable in schema, so no code change, just skip MinIO in Railway (drop the minio envs; frames simply won't be stored).

### H3. Nginx gateway for Railway
- Adapt `infrastructure/nginx/nginx.conf` so all upstreams resolve at runtime via Railway internal DNS; keep `/health`, CORS, `/socket.io/` upgrade. Confirm SPA + API same-origin routing works for the frontend.

---

## WORKSTREAM I — Verification & testing (I will run during implementation)
- `cd apps/ops-dashboard && npm install && npm run build` → must pass `tsc && vite build` (proves client.ts + all pages compile).
- `python -m py_compile` on every changed Python file.
- Spin the full stack locally via `docker-compose up` and: register a mission → simulator picks it up → observations publish → twin updates → alert created on a simulated mismatch → dashboard (browser) shows it. Confirm Socket.IO live updates.
- Run the seeder against the xlsx and confirm 48 products + 48 bins + 48 inventory rows appear.
- Verify login as each of the 4 roles lands on the correct role-home route.

---

## WORKSTREAM J — Post-deploy guide (delivered to you at the end)
A written runbook with the exact manual steps you do after I finish:
1. Railway project creation + Postgres/Redis plugins + env vars (full table).
2. Adding each service (build context/Dockerfile/healthcheck) + monorepo root config.
3. Setting GitHub auto-deploy.
4. Running the one-off DB seed job.
5. Creating a scanner API token + robot id for the laptop.
6. Local scanner run commands (ROS2 build + launch + env vars) connecting to Railway.
7. First login (the 4 demo accounts) + sanity checks per role.
8. How to disable demo accounts / simulator later.
9. Troubleshooting (gateway 502, CORS, Socket.IO, empty twin).

---

## Out of scope (not doing)
- MFA/TOTP enforcement (UI exists; backend wiring stays as-is).
- MinIO on Railway (image storage optional; observations work without it).
- Full automated test suite (manual + smoke verification only).
- Kafka (staying with Redis Pub/Sub migration that's already in progress).

## Order of execution
A (frontend compiles) → B (auth roles so you can log in) → G (seed real data) → C (pipeline flows) → D (analytics) → E (mission control) → F (scanner) → H (Railway config) → I (verify) → J (guide). I'll commit per workstream with clear messages and keep the working tree buildable at each step.