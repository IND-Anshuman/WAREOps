import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Alert, DashboardStats } from '../types';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  timestamp: number;
}

interface AppState {
  // ── Warehouse selection
  selectedWarehouseId: string | null;
  setSelectedWarehouseId: (id: string | null) => void;

  // ── Sidebar
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebar: () => void;

  // ── WebSocket
  wsConnected: boolean;
  wsLastPing: number | null;
  setWsConnected: (v: boolean) => void;
  setWsLastPing: (ts: number) => void;

  // ── Notifications / Toasts
  notifications: Notification[];
  addNotification: (n: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;

  // ── Live alert count (badge in sidebar)
  liveOpenAlerts: number;
  setLiveOpenAlerts: (n: number) => void;

  // ── Recent live alerts (from websocket)
  liveAlerts: Alert[];
  pushLiveAlert: (a: Alert) => void;

  // ── Dashboard stats overlay
  statsOverride: Partial<DashboardStats> | null;
  setStatsOverride: (s: Partial<DashboardStats> | null) => void;
}

let notifCounter = 0;

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // ── Warehouse
      selectedWarehouseId: null,
      setSelectedWarehouseId: (id) => set({ selectedWarehouseId: id }),

      // ── Sidebar
      sidebarCollapsed: false,
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // ── WebSocket
      wsConnected: false,
      wsLastPing: null,
      setWsConnected: (v) => set({ wsConnected: v }),
      setWsLastPing: (ts) => set({ wsLastPing: ts }),

      // ── Notifications
      notifications: [],
      addNotification: (n) =>
        set((state) => ({
          notifications: [
            ...state.notifications.slice(-9),
            {
              ...n,
              id: String(++notifCounter),
              timestamp: Date.now(),
            },
          ],
        })),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      // ── Alert badge
      liveOpenAlerts: 0,
      setLiveOpenAlerts: (n) => set({ liveOpenAlerts: n }),

      // ── Live alerts feed
      liveAlerts: [],
      pushLiveAlert: (a) =>
        set((state) => ({
          liveAlerts: [a, ...state.liveAlerts].slice(0, 50),
        })),

      // ── Stats override from WS
      statsOverride: null,
      setStatsOverride: (s) => set({ statsOverride: s }),
    }),
    {
      name: 'wareops-app-store',
      partialize: (state) => ({
        selectedWarehouseId: state.selectedWarehouseId,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    },
  ),
);
