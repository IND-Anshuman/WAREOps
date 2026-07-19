import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  ClipboardCheck,
  AlertTriangle,
  Rocket,
  Users,
  BarChart3,
  Settings,
  Globe,
  Building2,
  ShieldCheck,
  Bell,
  Package,
  Layers,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bot,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { authApi } from '../../api/client';
import { RoleBadge } from '../ui/Badge';
import type { UserRole } from '../../types';

// ─── Nav item definitions by role ─────────────────────────────────────────────
interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
}

function getNavItems(role: UserRole): NavItem[] {
  switch (role) {
    case 'WAREHOUSE_OPERATOR':
      return [
        { label: 'Dashboard', path: '/operator/dashboard', icon: <LayoutDashboard size={18} /> },
        { label: 'Product Finder', path: '/operator/products', icon: <Search size={18} /> },
        { label: 'My Verifications', path: '/operator/verifications', icon: <ClipboardCheck size={18} /> },
        { label: 'Report Issue', path: '/operator/report-issue', icon: <AlertTriangle size={18} /> },
        { label: 'Notifications', path: '/notifications', icon: <Bell size={18} /> },
      ];
    case 'WAREHOUSE_SUPERVISOR':
      return [
        { label: 'Dashboard', path: '/supervisor/dashboard', icon: <LayoutDashboard size={18} /> },
        { label: 'Mission Control', path: '/supervisor/missions', icon: <Rocket size={18} /> },
        { label: 'Alert Center', path: '/supervisor/alerts', icon: <AlertTriangle size={18} /> },
        { label: 'Team Monitor', path: '/supervisor/team', icon: <Users size={18} /> },
        { label: 'Reports', path: '/supervisor/reports', icon: <BarChart3 size={18} /> },
      ];
    case 'WAREHOUSE_MANAGER':
      return [
        { label: 'Executive Dashboard', path: '/manager/dashboard', icon: <LayoutDashboard size={18} /> },
        { label: 'Digital Twin', path: '/manager/twin', icon: <Layers size={18} /> },
        { label: 'Analytics', path: '/manager/analytics', icon: <BarChart3 size={18} /> },
        { label: 'Reports', path: '/manager/reports', icon: <Package size={18} /> },
        { label: 'Settings', path: '/manager/settings', icon: <Settings size={18} /> },
      ];
    case 'ENTERPRISE_ADMIN':
      return [
        { label: 'Global Overview', path: '/admin/overview', icon: <Globe size={18} /> },
        { label: 'Warehouses', path: '/admin/warehouses', icon: <Building2 size={18} /> },
        { label: 'User Management', path: '/admin/users', icon: <Users size={18} /> },
        { label: 'Security', path: '/admin/security', icon: <ShieldCheck size={18} /> },
        { label: 'Org Settings', path: '/admin/settings', icon: <Settings size={18} /> },
      ];
  }
}

// ─── Sidebar Component ────────────────────────────────────────────────────────
export function Sidebar() {
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const navigate = useNavigate();

  const navItems = user ? getNavItems(user.role) : [];

  const handleLogout = async () => {
    await authApi.logout().catch(() => {});
    logout();
    navigate('/auth/login');
  };

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 h-full z-30 flex flex-col glass-sidebar transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-60'
      )}
      style={{ transitionTimingFunction: 'cubic-bezier(0.32,0.72,0,1)' }}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-3 border-b border-white/06 flex-shrink-0">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
          style={{ background: 'var(--indigo)', boxShadow: 'var(--indigo-glow)' }}
        >
          <Bot size={18} className="text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="ml-3 overflow-hidden">
            <span className="font-bold text-slate-100 text-sm tracking-tight">WareOps</span>
            <p className="text-[10px] text-slate-500 leading-tight">Intelligence Platform</p>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="ml-auto btn-icon p-1.5 flex-shrink-0"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight size={14} className="text-slate-400" />
          ) : (
            <ChevronLeft size={14} className="text-slate-400" />
          )}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={sidebarCollapsed ? item.label : undefined}
            className={({ isActive }) =>
              clsx('nav-item', isActive && 'active', sidebarCollapsed && 'justify-center px-2')
            }
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!sidebarCollapsed && (
              <span className="truncate">{item.label}</span>
            )}
            {!sidebarCollapsed && item.badge && (
              <span className="ml-auto badge-danger text-xs">{item.badge}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      {user && (
        <div className="border-t border-white/06 p-2 flex-shrink-0">
          <div
            className={clsx(
              'flex items-center gap-2.5 px-2 py-2.5 rounded-xl',
              !sidebarCollapsed && 'mb-1'
            )}
          >
            {/* Avatar */}
            <div
              className={clsx(
                'flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white',
                'bg-gradient-to-br from-indigo-500 to-purple-600'
              )}
            >
              {user.display_name.slice(0, 2).toUpperCase()}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{user.display_name}</p>
                <RoleBadge role={user.role} />
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={clsx(
              'nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/08',
              sidebarCollapsed && 'justify-center px-2'
            )}
            title={sidebarCollapsed ? 'Sign Out' : undefined}
          >
            <LogOut size={16} />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      )}
    </aside>
  );
}
