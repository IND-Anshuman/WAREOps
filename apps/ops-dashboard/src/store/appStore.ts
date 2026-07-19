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
  notifications: [
    {
      id: 'n1',
      category: 'alert',
      title: 'Critical Alert: Bin A1-R2-S3',
      message: 'SKU mismatch detected at high-priority bin. Immediate action required.',
      read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      link: '/supervisor/alerts',
    },
    {
      id: 'n2',
      category: 'mission',
      title: 'Mission #M-2041 Completed',
      message: 'Zone B full audit completed with 99.1% accuracy.',
      read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      link: '/supervisor/missions',
    },
    {
      id: 'n3',
      category: 'robot',
      title: 'Robot WR-003 Offline',
      message: 'Robot WR-003 stopped reporting heartbeats. Possible hardware failure.',
      read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
    },
    {
      id: 'n4',
      category: 'system',
      title: 'Daily Report Ready',
      message: 'The warehouse accuracy report for today is ready to view.',
      read: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: 'n5',
      category: 'alert',
      title: 'Alert Resolved by Supervisor',
      message: 'Alert #ALT-1892 has been resolved by Sarah Chen.',
      read: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    },
  ],
  unreadCount: 3,
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
