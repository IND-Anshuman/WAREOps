import apiClient from './client';
import type { Observation, PaginatedResponse } from '../types';
import { MOCK_OBSERVATIONS, type PendingObservation } from './mockData';

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
    try {
      const { data } = await apiClient.get('/api/v1/observations', { params });
      return data;
    } catch (e) {
      return {
        items: [],
        total: 0,
        page: 1,
        per_page: 10,
        has_more: false,
      };
    }
  },

  getPendingQueue: async (): Promise<PendingObservation[]> => {
    try {
      const { data } = await apiClient.get('/api/v1/observations/pending');
      return data;
    } catch (e) {
      return MOCK_OBSERVATIONS.filter((obs) => obs.status === 'PENDING');
    }
  },

  resolveObservation: async (
    id: string,
    action: 'ACCEPT_AS_CORRECT' | 'REQUEST_RESCAN' | 'FLAG_DISCREPANCY',
    notes?: string
  ): Promise<PendingObservation> => {
    try {
      const { data } = await apiClient.post(`/api/v1/observations/${id}/resolve`, { action, notes });
      return data;
    } catch (e) {
      const obs = MOCK_OBSERVATIONS.find((o) => o.id === id);
      if (obs) {
        if (action === 'ACCEPT_AS_CORRECT') obs.status = 'ACCEPTED';
        else if (action === 'REQUEST_RESCAN') obs.status = 'RESCAN_DISPATCHED';
        else if (action === 'FLAG_DISCREPANCY') obs.status = 'DISCREPANCY_FLAGGED';
        return { ...obs };
      }
      throw new Error('Observation not found');
    }
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

