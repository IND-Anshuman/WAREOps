import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User, accessToken: string, refreshToken?: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  hasPermission: (resource: string, action: string) => boolean;
  hasRole: (...roles: UserRole[]) => boolean;
  canAccessWarehouse: (warehouseId: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken: refreshToken ?? null, isAuthenticated: true, isLoading: false }),

      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),

      setLoading: (loading) => set({ isLoading: loading }),

      hasPermission: (resource, action) => {
        const { user } = get();
        if (!user) return false;
        // Admins have all permissions
        if (user.role === 'ENTERPRISE_ADMIN') return true;
        return user.permissions.includes(`${resource}:${action}`);
      },

      hasRole: (...roles) => {
        const { user } = get();
        if (!user) return false;
        return roles.includes(user.role);
      },

      canAccessWarehouse: (warehouseId) => {
        const { user } = get();
        if (!user) return false;
        if (user.role === 'ENTERPRISE_ADMIN' || user.role === 'WAREHOUSE_MANAGER') return true;
        return user.warehouse_ids.includes(warehouseId);
      },
    }),
    {
      name: 'wareops-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
