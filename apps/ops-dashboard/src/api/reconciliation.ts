import apiClient from './client';
import type { Inventory, PaginatedResponse } from '../types';

export interface InventoryQueryParams {
  page?: number;
  pageSize?: number;
  warehouseId?: string;
  status?: 'ACCURATE' | 'DISCREPANT' | 'UNVERIFIED' | 'ALL';
  search?: string;
  zoneId?: string;
}

export const reconciliationApi = {
  getInventory: async (
    params: InventoryQueryParams = {},
  ): Promise<PaginatedResponse<Inventory>> => {
    const { data } = await apiClient.get('/api/v1/inventory', { params });
    return data;
  },

  getInventoryItem: async (id: string): Promise<Inventory> => {
    const { data } = await apiClient.get(`/api/v1/inventory/${id}`);
    return data;
  },

  reconcileManually: async (
    binId: string,
    payload: { actualQuantity: number; notes?: string },
  ): Promise<Inventory> => {
    const { data } = await apiClient.post(
      `/api/v1/inventory/bins/${binId}/reconcile`,
      payload,
    );
    return data;
  },

  getAccuracyReport: async (warehouseId: string) => {
    const { data } = await apiClient.get('/api/v1/inventory/accuracy-report', {
      params: { warehouseId },
    });
    return data;
  },

  exportReconciliationReport: async (warehouseId: string): Promise<Blob> => {
    const { data } = await apiClient.get('/api/v1/inventory/export', {
      params: { warehouseId },
      responseType: 'blob',
    });
    return data;
  },
};
