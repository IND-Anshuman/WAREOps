// ─── Role & Status Enums ────────────────────────────────────────────────────
export type UserRole =
  | 'WAREHOUSE_OPERATOR'
  | 'WAREHOUSE_SUPERVISOR'
  | 'WAREHOUSE_MANAGER'
  | 'ENTERPRISE_ADMIN';

export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
export type MissionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
export type RobotStatus = 'ONLINE' | 'OFFLINE' | 'CHARGING' | 'ERROR';
export type BinState = 'VERIFIED' | 'MISMATCH' | 'MISSING' | 'UNKNOWN' | 'UNSCANNED';

// ─── Core Entities ──────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  role: UserRole;
  org_id: string;
  warehouse_ids: string[];
  permissions: string[];
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  mfa_enabled: boolean;
  last_login_at?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  mfa_policy: 'OPTIONAL' | 'REQUIRED';
  sso_enabled: boolean;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  org_id: string;
  address?: string;
  timezone: string;
  total_bins: number;
  active_robots: number;
}

export interface Alert {
  id: string;
  type: 'MISPLACED' | 'MISSING' | 'EXTRA' | 'DAMAGED' | 'ROBOT_OFFLINE' | 'MANUAL';
  severity: AlertSeverity;
  status: AlertStatus;
  warehouse_id: string;
  zone_id?: string;
  bin_id?: string;
  bin_code?: string;
  expected_sku?: string;
  observed_sku?: string;
  title: string;
  description?: string;
  assigned_to?: string;
  created_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  resolution_notes?: string;
}

export interface Mission {
  id: string;
  name: string;
  warehouse_id: string;
  robot_id?: string;
  robot_name?: string;
  status: MissionStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  progress_percent: number;
  bins_scanned: number;
  bins_total: number;
  started_at?: string;
  completed_at?: string;
  eta_minutes?: number;
  created_at: string;
}

export interface Robot {
  id: string;
  name: string;
  serial_number: string;
  warehouse_id: string;
  status: RobotStatus;
  battery_percent: number;
  coord_x: number;
  coord_y: number;
  current_mission_id?: string;
  last_heartbeat_at: string;
}

export interface Bin {
  id: string;
  code: string;
  zone_id: string;
  aisle_id: string;
  rack_id: string;
  shelf_id: string;
  state: BinState;
  expected_sku?: string;
  observed_sku?: string;
  last_scanned_at?: string;
  confidence?: number;
  coord_x: number;
  coord_y: number;
}

export interface Notification {
  id: string;
  category: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  link?: string;
}

// ─── Analytics ──────────────────────────────────────────────────────────────
export interface WarehouseKPIs {
  health_score: number;
  inventory_accuracy: number;
  mission_success_rate: number;
  robot_uptime: number;
  open_alerts: number;
  active_missions: number;
}
export type DashboardStats = WarehouseKPIs;

export interface AccuracyDataPoint {
  date: string;
  accuracy: number;
  alerts: number;
}

export interface AlertFrequencyPoint {
  date: string;
  CRITICAL: number;
  HIGH: number;
  MEDIUM: number;
  LOW: number;
}

// ─── API Payloads ────────────────────────────────────────────────────────────
export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
  mfa_required?: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

export interface AlertsFilter {
  severity?: AlertSeverity[];
  status?: AlertStatus[];
  zone_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

export interface TeamMember {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  role: UserRole;
  status: 'ONLINE' | 'OFFLINE' | 'AWAY';
  last_action?: string;
  last_action_at?: string;
  pending_tasks: number;
  avg_response_time_min: number;
}

// ─── WebSocket & Twin Types ──────────────────────────────────────────────────
export interface WsEvent {
  type: 'robot_position_update' | 'bin_state_update' | 'scan_event' | 'alert_created' | 'stats_update';
  payload: any;
}

export interface TwinRobotPosition {
  robotId: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  battery: number;
  status: string;
}

export interface TwinBinState {
  binId: string;
  code: string;
  state: BinState;
  expectedSku?: string;
  observedSku?: string;
  confidence?: number;
}

export interface ScanEvent {
  id: string;
  robotId: string;
  binCode: string;
  skuMatched: boolean;
  timestamp: string;
}

export interface WarehouseTwinSnapshot {
  robots: TwinRobotPosition[];
  bins: TwinBinState[];
  recentScans?: ScanEvent[];
}

export interface Observation {
  id: string;
  robot_id: string;
  mission_id: string;
  warehouse_id: string;
  bin_id: string;
  bin_code: string;
  decoded_qr?: string;
  detection_confidence: number;
  frame_blur_score: number;
  robot_coord_x: number;
  robot_coord_y: number;
  robot_coord_z: number;
  image_url?: string;
  observed_at: string;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
}

export interface Inventory {
  id: string;
  warehouse_id: string;
  zone_id: string;
  bin_id: string;
  bin_code: string;
  sku: string;
  product_name: string;
  expected_qty: number;
  observed_qty?: number;
  last_audited_at?: string;
  status: 'ACCURATE' | 'DISCREPANT' | 'UNVERIFIED';
}
