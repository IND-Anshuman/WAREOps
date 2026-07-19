import apiClient from './client';
import type { Alert, AlertStatus, PaginatedResponse } from '../types';

export interface AlertsQueryParams {
  page?: number;
  pageSize?: number;
  status?: AlertStatus | 'ALL';
  severity?: string;
  warehouseId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export const alertsApi = {
  getAlerts: async (params: AlertsQueryParams = {}): Promise<PaginatedResponse<Alert>> => {
    const { data } = await apiClient.get('/api/v1/alerts', { params });
    return data;
  },

  getAlert: async (id: string): Promise<Alert> => {
    const { data } = await apiClient.get(`/api/v1/alerts/${id}`);
    return data;
  },

  acknowledgeAlert: async (id: string): Promise<Alert> => {
    const { data } = await apiClient.post(`/api/v1/alerts/${id}/acknowledge`);
    return data;
  },

  resolveAlert: async (id: string, notes: string): Promise<Alert> => {
    const { data } = await apiClient.post(`/api/v1/alerts/${id}/resolve`, {
      resolutionNotes: notes,
    });
    return data;
  },

  dismissAlert: async (id: string): Promise<Alert> => {
    const { data } = await apiClient.post(`/api/v1/alerts/${id}/dismiss`);
    return data;
  },

  requestRescan: async (id: string): Promise<{ missionId: string }> => {
    const { data } = await apiClient.post(`/api/v1/alerts/${id}/request-rescan`);
    return data;
  },

  getAlertStats: async (warehouseId?: string) => {
    const { data } = await apiClient.get('/api/v1/alerts/stats', {
      params: { warehouseId },
    });
    return data;
  },
};
