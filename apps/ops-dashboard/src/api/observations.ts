import apiClient from './client';
import type { Observation, PaginatedResponse } from '../types';

export interface ObservationsQueryParams {
  page?: number;
  pageSize?: number;
  missionId?: string;
  binId?: string;
  hasMismatch?: boolean;
  robotId?: string;
}

export const observationsApi = {
  getObservations: async (
    params: ObservationsQueryParams = {},
  ): Promise<PaginatedResponse<Observation>> => {
    const { data } = await apiClient.get('/api/v1/observations', { params });
    return data;
  },

  getObservation: async (id: string): Promise<Observation> => {
    const { data } = await apiClient.get(`/api/v1/observations/${id}`);
    return data;
  },

  getMissionObservations: async (missionId: string): Promise<Observation[]> => {
    const { data } = await apiClient.get(`/api/v1/missions/${missionId}/observations`);
    return data;
  },
};
