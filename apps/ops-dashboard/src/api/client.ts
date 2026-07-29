import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import type {
  LoginPayload,
  LoginResponse,
  User,
  UserRole,
  Alert,
  AlertsFilter,
  Mission,
  Robot,
  Bin,
  Notification,
  WarehouseKPIs,
  AccuracyDataPoint,
  AlertFrequencyPoint,
} from '../types';
import { 
  MOCK_USERS, 
  MOCK_ALERTS, 
  MOCK_MISSIONS, 
  MOCK_ROBOTS, 
  MOCK_BINS, 
  MOCK_KPIS, 
  MOCK_ACCURACY_TREND,
  MOCK_INVENTORY_ITEMS,
  InventoryItem
} from './mockData';

// ─── Axios Instance ──────────────────────────────────────────────────────────
const apiClient: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  timeout: 4000,
  headers: { 'Content-Type': 'application/json' },
});

// Dedicated Topology client on port 8001
const topologyApiClient: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8001/api/v1',
  timeout: 4000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

function normalizeUser(user: any): User {
  let role: UserRole = user.role || 'WAREHOUSE_OPERATOR';
  const emailLower = (user.email || '').toLowerCase();
  if (emailLower.includes('admin')) role = 'ENTERPRISE_ADMIN';
  else if (emailLower.includes('manager')) role = 'WAREHOUSE_MANAGER';
  else if (emailLower.includes('supervisor')) role = 'WAREHOUSE_SUPERVISOR';
  else if (emailLower.includes('operator')) role = 'WAREHOUSE_OPERATOR';

  return {
    id: String(user.id || 'user-001'),
    email: user.email || 'user@wareops.dev',
    display_name: user.display_name || user.email || 'Platform User',
    avatar_url: user.avatar_url,
    role: role,
    org_id: String(user.org_id || 'org-001'),
    warehouse_ids: user.warehouse_ids || ['wh-001'],
    permissions: user.permissions || [
      'users:read', 'users:write', 'alerts:read', 'alerts:write',
      'missions:read', 'missions:write', 'inventory:read', 'inventory:write',
      'compliance:read', 'settings:read', 'settings:write'
    ],
    status: user.status || 'ACTIVE',
    mfa_enabled: user.mfa_enabled || false,
    last_login_at: user.last_login_at || new Date().toISOString(),
  };
}

// ─── Auth API ────────────────────────────────────────────────────────────────
export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    try {
      const { data } = await apiClient.post('/auth/login', payload);
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user: normalizeUser(data.user),
        mfa_required: data.requires_mfa || false,
      };
    } catch (error) {
      console.warn("Backend auth offline, using mock credentials fallback.");
      const matchedUser = MOCK_USERS.find((u) => u.email.toLowerCase() === payload.email.toLowerCase()) || MOCK_USERS[2];
      return {
        access_token: `mock-token-${matchedUser.id}`,
        refresh_token: `mock-refresh-${matchedUser.id}`,
        user: matchedUser,
        mfa_required: false,
      };
    }
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // Ignore offline error on logout
    }
  },

  refreshToken: async (token: string): Promise<{ access_token: string }> => {
    try {
      const { data } = await apiClient.post('/auth/refresh', { refresh_token: token });
      return data;
    } catch (e) {
      return { access_token: `mock-refreshed-token-${Date.now()}` };
    }
  },

  forgotPassword: async (email: string): Promise<void> => {
    try {
      await apiClient.post('/auth/forgot-password', { email });
    } catch (e) {
      // Mock fallback
    }
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    try {
      await apiClient.post('/auth/reset-password', { token, password });
    } catch (e) {
      // Mock fallback
    }
  },

  getMe: async (): Promise<User> => {
    try {
      const { data } = await apiClient.get<User>('/auth/me');
      return normalizeUser(data);
    } catch (e) {
      const currentUser = useAuthStore.getState().user;
      return currentUser || MOCK_USERS[2];
    }
  },

  updateMe: async (data: Partial<User>): Promise<User> => {
    try {
      const { data: resp } = await apiClient.patch<User>('/auth/me', data);
      return normalizeUser(resp);
    } catch (e) {
      const currentUser = useAuthStore.getState().user || MOCK_USERS[2];
      return { ...currentUser, ...data };
    }
  },
};

// ─── Alerts API ──────────────────────────────────────────────────────────────
export const alertsApi = {
  getAlerts: async (filters?: AlertsFilter): Promise<Alert[]> => {
    try {
      const { data } = await apiClient.get<Alert[]>('/alerts', { params: filters });
      return data;
    } catch (e) {
      let alerts = [...MOCK_ALERTS];
      if (filters?.severity?.length) alerts = alerts.filter((a) => filters.severity!.includes(a.severity));
      if (filters?.status?.length) alerts = alerts.filter((a) => filters.status!.includes(a.status));
      return alerts;
    }
  },

  getAlertById: async (id: string): Promise<Alert> => {
    try {
      const { data } = await apiClient.get<Alert>(`/alerts/${id}`);
      return data;
    } catch (e) {
      return MOCK_ALERTS.find((a) => a.id === id) || MOCK_ALERTS[0];
    }
  },

  acknowledgeAlert: async (id: string): Promise<Alert> => {
    try {
      const { data } = await apiClient.post<Alert>(`/alerts/${id}/acknowledge`);
      return data;
    } catch (e) {
      const alert = MOCK_ALERTS.find((a) => a.id === id) || MOCK_ALERTS[0];
      alert.status = 'ACKNOWLEDGED';
      alert.acknowledged_at = new Date().toISOString();
      return { ...alert };
    }
  },

  assignAlert: async (id: string, userId: string): Promise<Alert> => {
    try {
      const { data } = await apiClient.post<Alert>(`/alerts/${id}/assign`, { user_id: userId });
      return data;
    } catch (e) {
      const alert = MOCK_ALERTS.find((a) => a.id === id) || MOCK_ALERTS[0];
      alert.assigned_to = userId;
      return { ...alert };
    }
  },

  resolveAlert: async (id: string, notes: string): Promise<Alert> => {
    try {
      const { data } = await apiClient.post<Alert>(`/alerts/${id}/resolve`, { notes });
      return data;
    } catch (e) {
      const alert = MOCK_ALERTS.find((a) => a.id === id) || MOCK_ALERTS[0];
      alert.status = 'RESOLVED';
      alert.resolved_at = new Date().toISOString();
      alert.resolution_notes = notes;
      return { ...alert };
    }
  },

  escalateAlert: async (id: string): Promise<Alert> => {
    try {
      const { data } = await apiClient.post<Alert>(`/alerts/${id}/escalate`);
      return data;
    } catch (e) {
      const alert = MOCK_ALERTS.find((a) => a.id === id) || MOCK_ALERTS[0];
      alert.severity = 'CRITICAL';
      return { ...alert };
    }
  },

  createAlert: async (payload: Partial<Alert>): Promise<Alert> => {
    try {
      const { data } = await apiClient.post<Alert>('/alerts', payload);
      return data;
    } catch (e) {
      const newAlert: Alert = {
        id: `alert-${Date.now()}`,
        type: payload.type || 'MISPLACED',
        severity: payload.severity || 'MEDIUM',
        status: 'OPEN',
        warehouse_id: payload.warehouse_id || 'wh-001',
        zone_id: payload.zone_id || 'zone-A',
        bin_id: payload.bin_id || 'bin-01',
        bin_code: payload.bin_code || 'A1-R1-S1-B1',
        expected_sku: payload.expected_sku,
        image_url: payload.image_url,
        title: payload.title || 'User Reported Issue',
        description: payload.description || 'Inventory discrepancy reported by operator.',
        created_at: new Date().toISOString(),
      };
      MOCK_ALERTS.unshift(newAlert);
      return newAlert;
    }
  },
};

// ─── Missions API ─────────────────────────────────────────────────────────────
export const missionsApi = {
  getMissions: async (): Promise<Mission[]> => {
    try {
      const { data } = await apiClient.get<Mission[]>('/missions');
      return data;
    } catch (e) {
      return [...MOCK_MISSIONS];
    }
  },

  createMission: async (payload: Partial<Mission>): Promise<Mission> => {
    try {
      const { data } = await apiClient.post<Mission>('/missions', payload);
      return data;
    } catch (e) {
      const newMission: Mission = {
        id: `mission-${Date.now()}`,
        warehouse_id: payload.warehouse_id || 'wh-001',
        name: payload.name || 'Custom Audit Mission',
        status: 'SCHEDULED',
        priority: payload.priority || 'MEDIUM',
        robot_id: payload.robot_id,
        robot_name: payload.robot_name || 'WR-001 Argus',
        bins_total: payload.bins_total || 25,
        bins_scanned: 0,
        progress_percent: 0,
        created_at: new Date().toISOString(),
        audit_scope: payload.audit_scope || 'ZONE',
        target_scope_id: payload.target_scope_id || 'Zone A',
      };
      MOCK_MISSIONS.unshift(newMission);
      return newMission;
    }
  },

  startMission: async (id: string): Promise<Mission> => {
    try {
      const { data } = await apiClient.post<Mission>(`/missions/${id}/start`);
      return data;
    } catch (e) {
      const m = MOCK_MISSIONS.find((m) => m.id === id) || MOCK_MISSIONS[0];
      m.status = 'IN_PROGRESS';
      m.started_at = new Date().toISOString();
      return { ...m };
    }
  },

  pauseMission: async (id: string): Promise<Mission> => {
    try {
      const { data } = await apiClient.post<Mission>(`/missions/${id}/pause`);
      return data;
    } catch (e) {
      const m = MOCK_MISSIONS.find((m) => m.id === id) || MOCK_MISSIONS[0];
      m.status = 'SCHEDULED';
      return { ...m };
    }
  },

  completeMission: async (id: string): Promise<Mission> => {
    try {
      const { data } = await apiClient.post<Mission>(`/missions/${id}/complete`);
      return data;
    } catch (e) {
      const m = MOCK_MISSIONS.find((m) => m.id === id) || MOCK_MISSIONS[0];
      m.status = 'COMPLETED';
      m.progress_percent = 100;
      m.completed_at = new Date().toISOString();
      return { ...m };
    }
  },

  cancelMission: async (id: string): Promise<Mission> => {
    try {
      const { data } = await apiClient.post<Mission>(`/missions/${id}/cancel`);
      return data;
    } catch (e) {
      const m = MOCK_MISSIONS.find((m) => m.id === id) || MOCK_MISSIONS[0];
      m.status = 'CANCELLED';
      return { ...m };
    }
  },
};

// ─── Inventory API ───────────────────────────────────────────────────────────
export const inventoryApi = {
  searchInventory: async (query: string, zone?: string): Promise<Bin[]> => {
    try {
      const { data } = await apiClient.get<Bin[]>('/inventory/search', { params: { q: query, zone } });
      return data;
    } catch (e) {
      const q = query.toLowerCase();
      const results = MOCK_BINS.filter(
        (b) =>
          b.code.toLowerCase().includes(q) ||
          (b.expected_sku && b.expected_sku.toLowerCase().includes(q)) ||
          (b.observed_sku && b.observed_sku.toLowerCase().includes(q))
      );
      return zone ? results.filter((b) => b.zone_id === zone) : results;
    }
  },

  getBin: async (code: string): Promise<Bin> => {
    try {
      const { data } = await apiClient.get<Bin>(`/inventory/bins/${code}`);
      return data;
    } catch (e) {
      return MOCK_BINS.find((b) => b.code === code) || MOCK_BINS[0];
    }
  },

  getBinById: async (id: string): Promise<Bin> => {
    try {
      const { data } = await apiClient.get<Bin>(`/inventory/bins/by-id/${id}`);
      return data;
    } catch (e) {
      return MOCK_BINS.find((b) => b.id === id) || MOCK_BINS[0];
    }
  },

  requestRescan: async (binId: string): Promise<void> => {
    try {
      await apiClient.post(`/inventory/bins/${binId}/rescan`);
    } catch (e) {
      // Mock rescan trigger
    }
  },
};

// ─── Robots API ──────────────────────────────────────────────────────────────
export const robotsApi = {
  getRobots: async (): Promise<Robot[]> => {
    try {
      const { data } = await apiClient.get<Robot[]>('/robots');
      return data;
    } catch (e) {
      return [...MOCK_ROBOTS];
    }
  },

  getRobotById: async (id: string): Promise<Robot> => {
    try {
      const { data } = await apiClient.get<Robot>(`/robots/${id}`);
      return data;
    } catch (e) {
      return MOCK_ROBOTS.find((r) => r.id === id) || MOCK_ROBOTS[0];
    }
  },
};

// ─── Analytics API ────────────────────────────────────────────────────────────
export const analyticsApi = {
  getWarehouseKPIs: async (warehouseId: string): Promise<WarehouseKPIs> => {
    try {
      const { data } = await apiClient.get<WarehouseKPIs>(`/analytics/kpis`, { params: { warehouse_id: warehouseId } });
      return data;
    } catch (e) {
      return { ...MOCK_KPIS };
    }
  },

  getAccuracyTrend: async (warehouseId: string, days = 30): Promise<AccuracyDataPoint[]> => {
    try {
      const { data } = await apiClient.get<AccuracyDataPoint[]>('/analytics/accuracy-trend', { params: { warehouse_id: warehouseId, days } });
      return data;
    } catch (e) {
      return [...MOCK_ACCURACY_TREND];
    }
  },

  getAlertFrequency: async (warehouseId: string): Promise<AlertFrequencyPoint[]> => {
    try {
      const { data } = await apiClient.get<AlertFrequencyPoint[]>('/analytics/alert-frequency', { params: { warehouse_id: warehouseId } });
      return data;
    } catch (e) {
      return [
        { date: '2026-07-20', CRITICAL: 1, HIGH: 2, MEDIUM: 1, LOW: 0 },
        { date: '2026-07-21', CRITICAL: 2, HIGH: 3, MEDIUM: 2, LOW: 0 },
        { date: '2026-07-22', CRITICAL: 0, HIGH: 1, MEDIUM: 1, LOW: 0 },
        { date: '2026-07-23', CRITICAL: 1, HIGH: 2, MEDIUM: 2, LOW: 0 },
        { date: '2026-07-24', CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 0 },
      ];
    }
  },

  getMissionStats: async (warehouseId: string): Promise<Record<string, number>> => {
    try {
      const { data } = await apiClient.get('/analytics/mission-stats', { params: { warehouse_id: warehouseId } });
      return data;
    } catch (e) {
      return { COMPLETED: 124, FAILED: 8, CANCELLED: 3, IN_PROGRESS: 2 };
    }
  },
};

// ─── Notifications API ────────────────────────────────────────────────────────
export const notificationsApi = {
  getNotifications: async (): Promise<Notification[]> => {
    try {
      const { data } = await apiClient.get<Notification[]>('/notifications');
      return data;
    } catch (e) {
      return [
        { id: 'n-1', category: 'MISSION', title: 'Mission Completed', message: 'Zone A audit mission completed with 99.8% accuracy.', read: false, created_at: new Date().toISOString() },
        { id: 'n-2', category: 'ALERT', title: 'Discrepancy Escalated', message: 'Critical SKU mismatch on Bin A1-R2-S3-B1 requires supervisor review.', read: false, created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() }
      ];
    }
  },

  markRead: async (id: string): Promise<void> => {
    try {
      await apiClient.post(`/notifications/${id}/read`);
    } catch (e) {
      // Mock fallback
    }
  },

  markAllRead: async (): Promise<void> => {
    try {
      await apiClient.post('/notifications/mark-all-read');
    } catch (e) {
      // Mock fallback
    }
  },
};

// ─── Admin API ───────────────────────────────────────────────────────────────
export const adminApi = {
  getUsers: async (): Promise<User[]> => {
    try {
      const { data } = await apiClient.get<User[]>('/admin/users');
      return data;
    } catch (e) {
      return [...MOCK_USERS];
    }
  },

  inviteUser: async (payload: { email: string; role: string; warehouse_ids: string[] }): Promise<void> => {
    try {
      await apiClient.post('/admin/users/invite', payload);
    } catch (e) {
      const newUser: User = {
        id: `user-${Date.now()}`,
        email: payload.email,
        display_name: payload.email.split('@')[0],
        role: payload.role as UserRole,
        org_id: 'org-001',
        warehouse_ids: payload.warehouse_ids,
        permissions: ['read', 'write'],
        status: 'PENDING',
        mfa_enabled: false,
      };
      MOCK_USERS.push(newUser);
    }
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    try {
      const { data: resp } = await apiClient.patch<User>(`/admin/users/${id}`, data);
      return resp;
    } catch (e) {
      const user = MOCK_USERS.find((u) => u.id === id) || MOCK_USERS[0];
      Object.assign(user, data);
      return { ...user };
    }
  },

  getAuditLogs: async (): Promise<unknown[]> => {
    try {
      const { data } = await apiClient.get('/admin/audit-logs');
      return data;
    } catch (e) {
      return [
        { id: 'al-1', actor: 'admin@wareops.dev', action: 'USER_INVITED', resource: 'user:operator3@wareops.dev', time: '10m ago', outcome: 'success' },
        { id: 'al-2', actor: 'supervisor@wareops.dev', action: 'ALERT_RESOLVED', resource: 'alert:alert-001', time: '45m ago', outcome: 'success' },
        { id: 'al-3', actor: 'manager@wareops.dev', action: 'WMS_SYNC_TRIGGERED', resource: 'wms:sap-adapter', time: '2h ago', outcome: 'success' }
      ];
    }
  },
};

// ─── Products API (Backend-Backed with Fallback) ─────────────────────────────
export const productsApi = {
  getProducts: async (): Promise<InventoryItem[]> => {
    try {
      const { data } = await topologyApiClient.get<InventoryItem[]>('/products');
      return data.map(p => ({
        sku: p.sku,
        name: p.name,
        category: p.category || 'General',
        location: p.location || 'Unassigned',
        status: p.location ? 'VERIFIED' as const : 'CLEARED' as const,
        lastScanned: 'Backend DB',
        confidence: 100
      }));
    } catch (error) {
      return [...MOCK_INVENTORY_ITEMS];
    }
  },

  addProduct: async (product: Partial<InventoryItem>): Promise<InventoryItem> => {
    try {
      const { data } = await topologyApiClient.post<any>('/products', {
        sku: product.sku,
        name: product.name,
        category: product.category,
        location: product.location,
        unit_of_measure: 'EACH',
        weight_kg: 1.0,
        is_active: true
      });
      return {
        sku: data.sku,
        name: data.name,
        category: data.category || 'General',
        location: data.location || 'Unassigned',
        status: data.location ? 'VERIFIED' : 'CLEARED',
        lastScanned: 'Just now',
        confidence: 100
      };
    } catch (e) {
      const newItem: InventoryItem = {
        sku: product.sku || `SKU-${Date.now()}`,
        name: product.name || 'New Inventory Item',
        category: product.category || 'General',
        location: product.location || 'A1-R1-S1-B1',
        status: 'VERIFIED',
        lastScanned: 'Just now',
        confidence: 100,
      };
      MOCK_INVENTORY_ITEMS.unshift(newItem);
      return newItem;
    }
  },

  deleteProduct: async (sku: string): Promise<void> => {
    try {
      await topologyApiClient.delete(`/products/${sku}`);
    } catch (e) {
      const idx = MOCK_INVENTORY_ITEMS.findIndex(i => i.sku === sku);
      if (idx !== -1) MOCK_INVENTORY_ITEMS.splice(idx, 1);
    }
  },

  deleteProducts: async (skus: string[]): Promise<void> => {
    try {
      await topologyApiClient.post('/products/delete-bulk', { skus });
    } catch (e) {
      const updated = MOCK_INVENTORY_ITEMS.filter(i => !skus.includes(i.sku));
      MOCK_INVENTORY_ITEMS.splice(0, MOCK_INVENTORY_ITEMS.length, ...updated);
    }
  },
};

export default apiClient;
