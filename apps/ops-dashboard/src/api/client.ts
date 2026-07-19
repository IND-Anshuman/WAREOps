import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import type {
  LoginPayload,
  LoginResponse,
  User,
  Alert,
  AlertsFilter,
  Mission,
  Robot,
  Bin,
  Notification,
  WarehouseKPIs,
  AccuracyDataPoint,
  AlertFrequencyPoint,
  PaginatedResponse,
} from '../types';
import { MOCK_USERS, MOCK_ALERTS, MOCK_MISSIONS, MOCK_ROBOTS, MOCK_BINS, MOCK_KPIS, MOCK_ACCURACY_TREND } from './mockData';

// ─── Axios Instance ──────────────────────────────────────────────────────────
const apiClient: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
let isRefreshing = false;
let failedQueue: { resolve: (v: string) => void; reject: (e: unknown) => void }[] = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers = { ...originalRequest.headers, Authorization: `Bearer ${token}` };
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        useAuthStore.getState().logout();
        window.location.href = '/auth/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${apiClient.defaults.baseURL}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        const newToken = data.access_token;
        useAuthStore.setState({ accessToken: newToken });
        processQueue(null, newToken);
        originalRequest.headers = { ...originalRequest.headers, Authorization: `Bearer ${newToken}` };
        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        useAuthStore.getState().logout();
        window.location.href = '/auth/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Mock Mode Helper ────────────────────────────────────────────────────────
const USE_MOCK = true; // Set to false when backend is live

function delay<T>(data: T, ms = 300): Promise<T> {
  return new Promise((res) => setTimeout(() => res(data), ms));
}

// ─── Auth API ────────────────────────────────────────────────────────────────
export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    if (USE_MOCK) {
      const user = MOCK_USERS.find(
        (u) => u.email === payload.email && payload.password === 'Admin@123!'
      );
      if (!user) throw new Error('Invalid credentials');
      return delay({
        access_token: `mock-token-${user.id}`,
        refresh_token: `mock-refresh-${user.id}`,
        user,
        mfa_required: false,
      });
    }
    const { data } = await apiClient.post<LoginResponse>('/auth/login', payload);
    return data;
  },

  logout: async (): Promise<void> => {
    if (USE_MOCK) return delay(undefined);
    await apiClient.post('/auth/logout');
  },

  refreshToken: async (token: string): Promise<{ access_token: string }> => {
    const { data } = await apiClient.post('/auth/refresh', { refresh_token: token });
    return data;
  },

  forgotPassword: async (email: string): Promise<void> => {
    if (USE_MOCK) return delay(undefined, 500);
    await apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    if (USE_MOCK) return delay(undefined, 500);
    await apiClient.post('/auth/reset-password', { token, password });
  },

  getMe: async (): Promise<User> => {
    if (USE_MOCK) {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('Not authenticated');
      return delay(user);
    }
    const { data } = await apiClient.get<User>('/auth/me');
    return data;
  },

  updateMe: async (data: Partial<User>): Promise<User> => {
    if (USE_MOCK) {
      const user = { ...useAuthStore.getState().user!, ...data };
      return delay(user);
    }
    const { data: resp } = await apiClient.patch<User>('/auth/me', data);
    return resp;
  },
};

// ─── Alerts API ──────────────────────────────────────────────────────────────
export const alertsApi = {
  getAlerts: async (filters?: AlertsFilter): Promise<Alert[]> => {
    if (USE_MOCK) {
      let alerts = [...MOCK_ALERTS];
      if (filters?.severity?.length) alerts = alerts.filter((a) => filters.severity!.includes(a.severity));
      if (filters?.status?.length) alerts = alerts.filter((a) => filters.status!.includes(a.status));
      return delay(alerts);
    }
    const { data } = await apiClient.get<Alert[]>('/alerts', { params: filters });
    return data;
  },

  getAlertById: async (id: string): Promise<Alert> => {
    if (USE_MOCK) {
      const alert = MOCK_ALERTS.find((a) => a.id === id);
      if (!alert) throw new Error('Alert not found');
      return delay(alert);
    }
    const { data } = await apiClient.get<Alert>(`/alerts/${id}`);
    return data;
  },

  acknowledgeAlert: async (id: string): Promise<Alert> => {
    if (USE_MOCK) {
      const alert = MOCK_ALERTS.find((a) => a.id === id)!;
      return delay({ ...alert, status: 'ACKNOWLEDGED', acknowledged_at: new Date().toISOString() });
    }
    const { data } = await apiClient.post<Alert>(`/alerts/${id}/acknowledge`);
    return data;
  },

  assignAlert: async (id: string, userId: string): Promise<Alert> => {
    if (USE_MOCK) {
      const alert = MOCK_ALERTS.find((a) => a.id === id)!;
      return delay({ ...alert, assigned_to: userId });
    }
    const { data } = await apiClient.post<Alert>(`/alerts/${id}/assign`, { user_id: userId });
    return data;
  },

  resolveAlert: async (id: string, notes: string): Promise<Alert> => {
    if (USE_MOCK) {
      const alert = MOCK_ALERTS.find((a) => a.id === id)!;
      return delay({ ...alert, status: 'RESOLVED', resolved_at: new Date().toISOString(), resolution_notes: notes });
    }
    const { data } = await apiClient.post<Alert>(`/alerts/${id}/resolve`, { notes });
    return data;
  },

  escalateAlert: async (id: string): Promise<Alert> => {
    if (USE_MOCK) {
      const alert = MOCK_ALERTS.find((a) => a.id === id)!;
      return delay({ ...alert, severity: 'CRITICAL' });
    }
    const { data } = await apiClient.post<Alert>(`/alerts/${id}/escalate`);
    return data;
  },

  createAlert: async (payload: Partial<Alert>): Promise<Alert> => {
    if (USE_MOCK) {
      return delay({ ...MOCK_ALERTS[0], ...payload, id: `alert-${Date.now()}`, created_at: new Date().toISOString() });
    }
    const { data } = await apiClient.post<Alert>('/alerts', payload);
    return data;
  },
};

// ─── Missions API ─────────────────────────────────────────────────────────────
export const missionsApi = {
  getMissions: async (): Promise<Mission[]> => {
    if (USE_MOCK) return delay([...MOCK_MISSIONS]);
    const { data } = await apiClient.get<Mission[]>('/missions');
    return data;
  },

  createMission: async (payload: Partial<Mission>): Promise<Mission> => {
    if (USE_MOCK) {
      return delay({ ...MOCK_MISSIONS[0], ...payload, id: `mission-${Date.now()}`, status: 'SCHEDULED', progress_percent: 0, created_at: new Date().toISOString() });
    }
    const { data } = await apiClient.post<Mission>('/missions', payload);
    return data;
  },

  startMission: async (id: string): Promise<Mission> => {
    if (USE_MOCK) {
      const m = MOCK_MISSIONS.find((m) => m.id === id)!;
      return delay({ ...m, status: 'IN_PROGRESS', started_at: new Date().toISOString() });
    }
    const { data } = await apiClient.post<Mission>(`/missions/${id}/start`);
    return data;
  },

  pauseMission: async (id: string): Promise<Mission> => {
    if (USE_MOCK) {
      const m = MOCK_MISSIONS.find((m) => m.id === id)!;
      return delay({ ...m, status: 'SCHEDULED' });
    }
    const { data } = await apiClient.post<Mission>(`/missions/${id}/pause`);
    return data;
  },

  completeMission: async (id: string): Promise<Mission> => {
    if (USE_MOCK) {
      const m = MOCK_MISSIONS.find((m) => m.id === id)!;
      return delay({ ...m, status: 'COMPLETED', completed_at: new Date().toISOString(), progress_percent: 100 });
    }
    const { data } = await apiClient.post<Mission>(`/missions/${id}/complete`);
    return data;
  },

  cancelMission: async (id: string): Promise<Mission> => {
    if (USE_MOCK) {
      const m = MOCK_MISSIONS.find((m) => m.id === id)!;
      return delay({ ...m, status: 'CANCELLED' });
    }
    const { data } = await apiClient.post<Mission>(`/missions/${id}/cancel`);
    return data;
  },
};

// ─── Inventory API ───────────────────────────────────────────────────────────
export const inventoryApi = {
  searchInventory: async (query: string, zone?: string): Promise<Bin[]> => {
    if (USE_MOCK) {
      const q = query.toLowerCase();
      const results = MOCK_BINS.filter(
        (b) =>
          b.code.toLowerCase().includes(q) ||
          (b.expected_sku && b.expected_sku.toLowerCase().includes(q)) ||
          (b.observed_sku && b.observed_sku.toLowerCase().includes(q))
      );
      return delay(zone ? results.filter((b) => b.zone_id === zone) : results);
    }
    const { data } = await apiClient.get<Bin[]>('/inventory/search', { params: { q: query, zone } });
    return data;
  },

  getBin: async (code: string): Promise<Bin> => {
    if (USE_MOCK) {
      const bin = MOCK_BINS.find((b) => b.code === code);
      if (!bin) throw new Error('Bin not found');
      return delay(bin);
    }
    const { data } = await apiClient.get<Bin>(`/inventory/bins/${code}`);
    return data;
  },

  getBinById: async (id: string): Promise<Bin> => {
    if (USE_MOCK) {
      const bin = MOCK_BINS.find((b) => b.id === id);
      if (!bin) throw new Error('Bin not found');
      return delay(bin);
    }
    const { data } = await apiClient.get<Bin>(`/inventory/bins/by-id/${id}`);
    return data;
  },

  requestRescan: async (binId: string): Promise<void> => {
    if (USE_MOCK) return delay(undefined, 600);
    await apiClient.post(`/inventory/bins/${binId}/rescan`);
  },
};

// ─── Robots API ──────────────────────────────────────────────────────────────
export const robotsApi = {
  getRobots: async (): Promise<Robot[]> => {
    if (USE_MOCK) return delay([...MOCK_ROBOTS]);
    const { data } = await apiClient.get<Robot[]>('/robots');
    return data;
  },

  getRobotById: async (id: string): Promise<Robot> => {
    if (USE_MOCK) {
      const robot = MOCK_ROBOTS.find((r) => r.id === id);
      if (!robot) throw new Error('Robot not found');
      return delay(robot);
    }
    const { data } = await apiClient.get<Robot>(`/robots/${id}`);
    return data;
  },
};

// ─── Analytics API ────────────────────────────────────────────────────────────
export const analyticsApi = {
  getWarehouseKPIs: async (_warehouseId: string): Promise<WarehouseKPIs> => {
    if (USE_MOCK) return delay({ ...MOCK_KPIS });
    const { data } = await apiClient.get<WarehouseKPIs>(`/analytics/kpis`, { params: { warehouse_id: _warehouseId } });
    return data;
  },

  getAccuracyTrend: async (_warehouseId: string, days = 30): Promise<AccuracyDataPoint[]> => {
    if (USE_MOCK) return delay([...MOCK_ACCURACY_TREND]);
    const { data } = await apiClient.get<AccuracyDataPoint[]>('/analytics/accuracy-trend', { params: { warehouse_id: _warehouseId, days } });
    return data;
  },

  getAlertFrequency: async (_warehouseId: string): Promise<AlertFrequencyPoint[]> => {
    if (USE_MOCK) return delay([]);
    const { data } = await apiClient.get<AlertFrequencyPoint[]>('/analytics/alert-frequency', { params: { warehouse_id: _warehouseId } });
    return data;
  },

  getMissionStats: async (_warehouseId: string): Promise<Record<string, number>> => {
    if (USE_MOCK) return delay({ COMPLETED: 124, FAILED: 8, CANCELLED: 3, IN_PROGRESS: 2 });
    const { data } = await apiClient.get('/analytics/mission-stats', { params: { warehouse_id: _warehouseId } });
    return data;
  },
};

// ─── Notifications API ────────────────────────────────────────────────────────
export const notificationsApi = {
  getNotifications: async (): Promise<Notification[]> => {
    if (USE_MOCK) return delay([]);
    const { data } = await apiClient.get<Notification[]>('/notifications');
    return data;
  },

  markRead: async (id: string): Promise<void> => {
    if (USE_MOCK) return delay(undefined);
    await apiClient.post(`/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    if (USE_MOCK) return delay(undefined);
    await apiClient.post('/notifications/mark-all-read');
  },
};

// ─── Admin API ───────────────────────────────────────────────────────────────
export const adminApi = {
  getUsers: async (): Promise<User[]> => {
    if (USE_MOCK) return delay([...MOCK_USERS]);
    const { data } = await apiClient.get<User[]>('/admin/users');
    return data;
  },

  inviteUser: async (payload: { email: string; role: string; warehouse_ids: string[] }): Promise<void> => {
    if (USE_MOCK) return delay(undefined, 600);
    await apiClient.post('/admin/users/invite', payload);
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    if (USE_MOCK) {
      const user = MOCK_USERS.find((u) => u.id === id)!;
      return delay({ ...user, ...data });
    }
    const { data: resp } = await apiClient.patch<User>(`/admin/users/${id}`, data);
    return resp;
  },

  getAuditLogs: async (): Promise<unknown[]> => {
    if (USE_MOCK) return delay([]);
    const { data } = await apiClient.get('/admin/audit-logs');
    return data;
  },
};

export default apiClient;
