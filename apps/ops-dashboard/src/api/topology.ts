import apiClient from './client';
import type { Warehouse, WarehouseTwinSnapshot } from '../types';

export const topologyApi = {
  getWarehouses: async (): Promise<Warehouse[]> => {
    const { data } = await apiClient.get('/api/v1/warehouses');
    return data;
  },

  getWarehouse: async (id: string): Promise<Warehouse> => {
    const { data } = await apiClient.get(`/api/v1/warehouses/${id}`);
    return data;
  },

  getTwinSnapshot: async (warehouseId: string): Promise<WarehouseTwinSnapshot> => {
    const { data } = await apiClient.get(
      `/api/v1/warehouses/${warehouseId}/twin-snapshot`,
    );
    return data;
  },

  getDashboardStats: async (warehouseId?: string) => {
    const { data } = await apiClient.get('/api/v1/dashboard/stats', {
      params: { warehouseId },
    });
    return data;
  },
};
