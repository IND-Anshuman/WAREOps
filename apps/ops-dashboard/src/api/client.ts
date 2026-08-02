import axios, { type AxiosInstance } from 'axios';
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
  Warehouse,
  WarehouseTwinSnapshot,
  TwinRobotPosition,
  InventoryItem,
} from '../types';

// ─── Axios Instances ─────────────────────────────────────────────────────────
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const TOPOLOGY_API_URL = (import.meta as any).env?.VITE_TOPOLOGY_API_URL || 'http://localhost:8001/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export const topologyApiClient: AxiosInstance = axios.create({
  baseURL: TOPOLOGY_API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptors — attach auth token
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

topologyApiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global 401 token refresh interceptor for apiClient
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        isRefreshing = false;
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const newAccessToken = data.access_token;
        const newRefreshToken = data.refresh_token || refreshToken;
        const currentUser = useAuthStore.getState().user;

        if (currentUser) {
          useAuthStore.getState().setUser(currentUser, newAccessToken, newRefreshToken);
        } else {
          useAuthStore.setState({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          });
        }

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        useAuthStore.getState().logout();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

function normalizeUser(user: any): User {
  return {
    id: String(user.id),
    email: user.email,
    display_name: user.display_name || user.email,
    avatar_url: user.avatar_url,
    role: user.role || 'WAREHOUSE_OPERATOR',
    org_id: String(user.org_id),
    warehouse_ids: user.warehouse_ids || [],
    permissions: user.permissions || [],
    status: user.status || 'ACTIVE',
    mfa_enabled: user.mfa_enabled || false,
    last_login_at: user.last_login_at,
  };
}

// ─── Auth API ────────────────────────────────────────────────────────────────
export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const { data } = await apiClient.post('/auth/login', payload);
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: normalizeUser(data.user),
      mfa_required: data.requires_mfa || false,
    };
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  refreshToken: async (token: string): Promise<{ access_token: string }> => {
    const { data } = await apiClient.post('/auth/refresh', { refresh_token: token });
    return data;
  },

  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await apiClient.post('/auth/reset-password', { token, password });
  },

  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/auth/me');
    return normalizeUser(data);
  },

  updateMe: async (data: Partial<User>): Promise<User> => {
    const { data: resp } = await apiClient.patch<User>('/auth/me', data);
    return normalizeUser(resp);
  },
};

// ─── Alerts API ──────────────────────────────────────────────────────────────
export const alertsApi = {
  getAlerts: async (filters?: AlertsFilter): Promise<Alert[]> => {
    const { data } = await apiClient.get<Alert[]>('/alerts', { params: filters });
    return data;
  },

  getAlertById: async (id: string): Promise<Alert> => {
    const { data } = await apiClient.get<Alert>(`/alerts/${id}`);
    return data;
  },

  getAlert: async (id: string): Promise<Alert> => {
    const { data } = await apiClient.get<Alert>(`/alerts/${id}`);
    return data;
  },

  acknowledgeAlert: async (id: string): Promise<Alert> => {
    const { data } = await apiClient.post<Alert>(`/alerts/${id}/acknowledge`);
    return data;
  },

  assignAlert: async (id: string, userId: string): Promise<Alert> => {
    const { data } = await apiClient.post<Alert>(`/alerts/${id}/assign`, { user_id: userId });
    return data;
  },

  resolveAlert: async (id: string, notes: string): Promise<Alert> => {
    const { data } = await apiClient.post<Alert>(`/alerts/${id}/resolve`, { notes, resolutionNotes: notes });
    return data;
  },

  escalateAlert: async (id: string): Promise<Alert> => {
    const { data } = await apiClient.post<Alert>(`/alerts/${id}/escalate`);
    return data;
  },

  dismissAlert: async (id: string): Promise<Alert> => {
    const { data } = await apiClient.post<Alert>(`/alerts/${id}/dismiss`);
    return data;
  },

  createAlert: async (payload: Partial<Alert>): Promise<Alert> => {
    const { data } = await apiClient.post<Alert>('/alerts', payload);
    return data;
  },

  requestRescan: async (id: string): Promise<{ missionId: string }> => {
    const { data } = await apiClient.post(`/alerts/${id}/request-rescan`);
    return data;
  },

  getAlertStats: async (warehouseId?: string) => {
    const { data } = await apiClient.get('/alerts/stats', { params: { warehouseId } });
    return data;
  },
};

// ─── Missions API ─────────────────────────────────────────────────────────────
export const missionsApi = {
  getMissions: async (params: any = {}): Promise<Mission[]> => {
    const { data } = await apiClient.get<Mission[]>('/missions', { params });
    return data;
  },

  getMission: async (id: string): Promise<Mission> => {
    const { data } = await apiClient.get<Mission>(`/missions/${id}`);
    return data;
  },

  createMission: async (payload: Partial<Mission>): Promise<Mission> => {
    const { data } = await apiClient.post<Mission>('/missions', payload);
    return data;
  },

  startMission: async (id: string): Promise<Mission> => {
    const { data } = await apiClient.post<Mission>(`/missions/${id}/start`);
    return data;
  },

  pauseMission: async (id: string): Promise<Mission> => {
    const { data } = await apiClient.post<Mission>(`/missions/${id}/pause`);
    return data;
  },

  resumeMission: async (id: string): Promise<Mission> => {
    const { data } = await apiClient.post<Mission>(`/missions/${id}/resume`);
    return data;
  },

  completeMission: async (id: string): Promise<Mission> => {
    const { data } = await apiClient.post<Mission>(`/missions/${id}/complete`);
    return data;
  },

  cancelMission: async (id: string): Promise<Mission> => {
    const { data } = await apiClient.post<Mission>(`/missions/${id}/cancel`);
    return data;
  },

  getActiveMissions: async (warehouseId?: string): Promise<Mission[]> => {
    const { data } = await apiClient.get<Mission[]>('/missions/active', { params: { warehouseId } });
    return data;
  },
};

// ─── Inventory API ───────────────────────────────────────────────────────────
export const inventoryApi = {
  searchInventory: async (query: string, zone?: string): Promise<Bin[]> => {
    const { data } = await apiClient.get<Bin[]>('/inventory/search', { params: { q: query, zone } });
    return data;
  },

  getBin: async (code: string): Promise<Bin> => {
    const { data } = await apiClient.get<Bin>(`/inventory/bins/${code}`);
    return data;
  },

  getBinById: async (id: string): Promise<Bin> => {
    const { data } = await apiClient.get<Bin>(`/inventory/bins/by-id/${id}`);
    return data;
  },

  requestRescan: async (binId: string): Promise<void> => {
    await apiClient.post(`/inventory/bins/${binId}/rescan`);
  },
};

// ─── Robots API ──────────────────────────────────────────────────────────────
export const robotsApi = {
  getRobots: async (): Promise<Robot[]> => {
    const { data } = await apiClient.get<Robot[]>('/robots');
    return data;
  },

  getRobotById: async (id: string): Promise<Robot> => {
    const { data } = await apiClient.get<Robot>(`/robots/${id}`);
    return data;
  },
};

// ─── Analytics API ────────────────────────────────────────────────────────────
export const analyticsApi = {
  getWarehouseKPIs: async (warehouseId: string): Promise<WarehouseKPIs> => {
    const { data } = await apiClient.get<WarehouseKPIs>('/analytics/kpis', { params: { warehouse_id: warehouseId } });
    return data;
  },

  getAccuracyTrend: async (warehouseId: string, days = 30): Promise<AccuracyDataPoint[]> => {
    const { data } = await apiClient.get<AccuracyDataPoint[]>('/analytics/accuracy-trend', { params: { warehouse_id: warehouseId, days } });
    return data;
  },

  getAlertFrequency: async (warehouseId: string): Promise<AlertFrequencyPoint[]> => {
    const { data } = await apiClient.get<AlertFrequencyPoint[]>('/analytics/alert-frequency', { params: { warehouse_id: warehouseId } });
    return data;
  },

  getMissionStats: async (warehouseId: string): Promise<Record<string, number>> => {
    const { data } = await apiClient.get('/analytics/mission-stats', { params: { warehouse_id: warehouseId } });
    return data;
  },
};

// ─── Notifications API ────────────────────────────────────────────────────────
export const notificationsApi = {
  getNotifications: async (): Promise<Notification[]> => {
    const { data } = await apiClient.get<Notification[]>('/notifications');
    return data;
  },

  markRead: async (id: string): Promise<void> => {
    await apiClient.post(`/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await apiClient.post('/notifications/mark-all-read');
  },
};

// ─── Admin API ───────────────────────────────────────────────────────────────
export const adminApi = {
  getUsers: async (): Promise<User[]> => {
    const { data } = await apiClient.get<User[]>('/admin/users');
    return data.map(normalizeUser);
  },

  inviteUser: async (payload: { email: string; role: string; warehouse_ids: string[] }): Promise<void> => {
    await apiClient.post('/admin/users/invite', payload);
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const { data: resp } = await apiClient.patch<User>(`/admin/users/${id}`, data);
    return normalizeUser(resp);
  },

  getAuditLogs: async (): Promise<any[]> => {
    const { data } = await apiClient.get('/admin/audit-logs');
    return data;
  },
};

// ─── Warehouses API (Topology) ────────────────────────────────────────────────
export const warehousesApi = {
  getWarehouses: async (): Promise<Warehouse[]> => {
    const { data } = await topologyApiClient.get<Warehouse[]>('/warehouses');
    return data;
  },

  getWarehouse: async (id: string): Promise<Warehouse> => {
    const { data } = await topologyApiClient.get<Warehouse>(`/warehouses/${id}`);
    return data;
  },

  // BUGFIX: Twin endpoints live on digital-twin-sync, NOT topology-service.
  // They are routed via the gateway at /api/v1/warehouses/{id}/twin/*, so we
  // must use apiClient (which points at the gateway) not topologyApiClient.
  getTwinSnapshot: async (warehouseId: string): Promise<any> => {
    const { data } = await apiClient.get(`/warehouses/${warehouseId}/twin/snapshot`);
    return data;
  },

  getTwinRobots: async (warehouseId: string): Promise<any> => {
    const { data } = await apiClient.get(`/warehouses/${warehouseId}/twin/robots`);
    return data;
  },

  getTwinBins: async (warehouseId: string): Promise<any> => {
    const { data } = await apiClient.get(`/warehouses/${warehouseId}/twin/bins`);
    return data;
  },

  getDashboardStats: async (warehouseId?: string) => {
    const { data } = await topologyApiClient.get('/dashboard/stats', {
      params: { warehouseId },
    });
    return data;
  },
};

export const topologyApi = warehousesApi;

// ─── Products API ─────────────────────────────────────────────────────────────
export const productsApi = {
  getProducts: async (): Promise<InventoryItem[]> => {
    const { data } = await topologyApiClient.get<any[]>('/products');
    return data.map((p) => ({
      sku: p.sku,
      name: p.name,
      category: p.category || 'General',
      location: p.location || 'Unassigned',
      status: p.location ? 'VERIFIED' : 'CLEARED',
      lastScanned: 'Backend DB',
      confidence: 100,
    }));
  },

  addProduct: async (product: Partial<InventoryItem>): Promise<InventoryItem> => {
    const { data } = await topologyApiClient.post<any>('/products', {
      sku: product.sku,
      name: product.name,
      category: product.category,
      location: product.location,
      unit_of_measure: 'EACH',
      weight_kg: 1.0,
      is_active: true,
    });
    return {
      sku: data.sku,
      name: data.name,
      category: data.category || 'General',
      location: data.location || 'Unassigned',
      status: data.location ? 'VERIFIED' : 'CLEARED',
      lastScanned: 'Just now',
      confidence: 100,
    };
  },

  deleteProduct: async (sku: string): Promise<void> => {
    await topologyApiClient.delete(`/products/${sku}`);
  },

  deleteProducts: async (skus: string[]): Promise<void> => {
    await topologyApiClient.post('/products/delete-bulk', { skus });
  },
};

export default apiClient;
