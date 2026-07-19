import apiClient from './client';
import type { Mission, MissionStatus, PaginatedResponse } from '../types';

export interface CreateMissionPayload {
  warehouseId: string;
  robotId?: string;
  zoneIds: string[];
  priority?: number;
  notes?: string;
}

export interface MissionsQueryParams {
  page?: number;
  pageSize?: number;
  status?: MissionStatus | 'ALL';
  warehouseId?: string;
  robotId?: string;
}

export const missionsApi = {
  getMissions: async (params: MissionsQueryParams = {}): Promise<PaginatedResponse<Mission>> => {
    const { data } = await apiClient.get('/api/v1/missions', { params });
    return data;
  },

  getMission: async (id: string): Promise<Mission> => {
    const { data } = await apiClient.get(`/api/v1/missions/${id}`);
    return data;
  },

  createMission: async (payload: CreateMissionPayload): Promise<Mission> => {
    const { data } = await apiClient.post('/api/v1/missions', payload);
    return data;
  },

  pauseMission: async (id: string): Promise<Mission> => {
    const { data } = await apiClient.post(`/api/v1/missions/${id}/pause`);
    return data;
  },

  resumeMission: async (id: string): Promise<Mission> => {
    const { data } = await apiClient.post(`/api/v1/missions/${id}/resume`);
    return data;
  },

  cancelMission: async (id: string): Promise<Mission> => {
    const { data } = await apiClient.post(`/api/v1/missions/${id}/cancel`);
    return data;
  },

  getActiveMissions: async (warehouseId?: string): Promise<Mission[]> => {
    const { data } = await apiClient.get('/api/v1/missions/active', {
      params: { warehouseId },
    });
    return data;
  },
};
