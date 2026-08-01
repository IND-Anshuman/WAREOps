import apiClient from './client';
import type { Observation, PaginatedResponse, PendingObservation } from '../types';

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
    const { data } = await apiClient.get('/observations', { params });
    return data;
  },

  getPendingQueue: async (): Promise<PendingObservation[]> => {
    const { data } = await apiClient.get('/observations/pending');
    return data;
  },

  resolveObservation: async (
    id: string,
    action: 'ACCEPT_AS_CORRECT' | 'REQUEST_RESCAN' | 'FLAG_DISCREPANCY',
    notes?: string
  ): Promise<PendingObservation> => {
    const { data } = await apiClient.post(`/observations/${id}/resolve`, { action, notes });
    return data;
  },

  getObservation: async (id: string): Promise<Observation> => {
    const { data } = await apiClient.get(`/observations/${id}`);
    return data;
  },

  getMissionObservations: async (missionId: string): Promise<Observation[]> => {
    const { data } = await apiClient.get(`/missions/${missionId}/observations`);
    return data;
  },
};
