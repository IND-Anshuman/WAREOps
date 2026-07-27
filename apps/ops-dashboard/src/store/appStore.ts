import { create } from 'zustand';
import type { Notification } from '../types';

interface AppState {
  sidebarCollapsed: boolean;
  activeWarehouseId: string | null;
  notifications: Notification[];
  unreadCount: number;
  pageTitle: string;
  breadcrumbs: { label: string; path?: string }[];

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveWarehouse: (id: string) => void;
  addNotification: (n: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  setPageTitle: (title: string, breadcrumbs?: { label: string; path?: string }[]) => void;
}

export const useAppStore = create<AppState>()((set, get) => ({
  sidebarCollapsed: false,
  activeWarehouseId: 'wh-001',
  notifications: [],
  unreadCount: 0,
  pageTitle: 'Dashboard',
  breadcrumbs: [],

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setActiveWarehouse: (id) => set({ activeWarehouseId: id }),

  addNotification: (n) =>
    set((s) => ({
      notifications: [n, ...s.notifications],
      unreadCount: s.unreadCount + (n.read ? 0 : 1),
    })),

  markNotificationRead: (id) =>
    set((s) => {
      const target = s.notifications.find((n) => n.id === id);
      if (!target || target.read) return s;
      return {
        notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        unreadCount: Math.max(0, s.unreadCount - 1),
      };
    }),

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  setPageTitle: (title, breadcrumbs = []) => set({ pageTitle: title, breadcrumbs }),
}));
