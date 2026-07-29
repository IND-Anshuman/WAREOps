import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { 
  LayoutDashboard, Search, CheckSquare, AlertTriangle, 
  Boxes, Send, Users, BarChart3, Shield, Compass, FileText, Settings, UserCheck, LogOut
} from 'lucide-react';

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const getNavLinks = () => {
    const role = user?.role || 'WAREHOUSE_SUPERVISOR';
    
    switch (role) {
      case 'WAREHOUSE_OPERATOR':
        return [
          { label: 'Dashboard', path: '/operator/dashboard', icon: LayoutDashboard },
          { label: 'Product Finder & Scan', path: '/operator/products', icon: Search },
          { label: 'Verification Queue', path: '/operator/verifications', icon: CheckSquare },
          { label: 'Report Stock Issue', path: '/operator/report-issue', icon: AlertTriangle },
          { label: 'Digital Twin', path: '/twin', icon: Compass },
        ];
      case 'WAREHOUSE_SUPERVISOR':
        return [
          { label: 'Dashboard', path: '/supervisor/dashboard', icon: LayoutDashboard },
          { label: 'Alert Center', path: '/supervisor/alerts', icon: AlertTriangle },
          { label: 'Inventory Stock & Outbound Scan', path: '/supervisor/inventory', icon: Boxes },
          { label: 'Mission Control & Audit', path: '/supervisor/missions', icon: Send },
          { label: 'Team Monitor', path: '/supervisor/team', icon: Users },
          { label: 'Reports', path: '/supervisor/reports', icon: FileText },
          { label: 'Digital Twin', path: '/twin', icon: Compass },
        ];
      case 'WAREHOUSE_MANAGER':
        return [
          { label: 'Executive Dashboard', path: '/manager/dashboard', icon: LayoutDashboard },
          { label: 'Analytics & KPIs', path: '/manager/analytics', icon: BarChart3 },
          { label: 'Executive Reports', path: '/manager/reports', icon: FileText },
          { label: 'Warehouse Settings', path: '/manager/settings', icon: Settings },
          { label: 'Digital Twin', path: '/twin', icon: Compass },
        ];
      case 'ENTERPRISE_ADMIN':
        return [
          { label: 'Admin Overview', path: '/admin/overview', icon: Shield },
          { label: 'User Management', path: '/admin/users', icon: UserCheck },
          { label: 'Audit Logs', path: '/admin/audit-logs', icon: FileText },
          { label: 'Org Settings', path: '/admin/settings', icon: Settings },
          { label: 'Digital Twin', path: '/twin', icon: Compass },
        ];
      default:
        return [
          { label: 'Dashboard', path: '/supervisor/dashboard', icon: LayoutDashboard },
          { label: 'Digital Twin', path: '/twin', icon: Compass },
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <div className="min-h-screen bg-[#040711] text-slate-100 flex flex-col font-sans">
      
      {/* Sleek Horizontal Dashboard Feature Tabs Bar */}
      <header className="sticky top-0 z-40 bg-[#070b16]/95 border-b border-white/10 backdrop-blur-2xl px-6 py-3 shadow-2xl">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4 flex-wrap">
          
          {/* Logo & Active Role Badge */}
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/onboarding')} className="flex items-center gap-2.5 text-left group">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-mono font-black text-sm shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                W
              </div>
              <div>
                <span className="text-sm font-bold text-slate-100 tracking-tight font-mono">WAREOps OS</span>
                <span className="text-[10px] text-indigo-400 block font-mono">
                  Role: {user?.role ? user.role.replace('WAREHOUSE_', '') : 'SUPERVISOR'}
                </span>
              </div>
            </button>
          </div>

          {/* Horizontal Feature Tabs (All Use-Case Features Visible) */}
          <div className="flex items-center gap-1.5 overflow-x-auto p-1 rounded-2xl bg-white/[0.03] border border-white/08">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              const IconComp = link.icon;

              return (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/05'
                  }`}
                >
                  <IconComp className="h-3.5 w-3.5" />
                  {link.label}
                </button>
              );
            })}
          </div>

          {/* Logout Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-300 hover:text-red-100 px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 transition-all cursor-pointer shadow-sm"
            >
              <LogOut className="h-3.5 w-3.5 text-red-400" />
              Log Out
            </button>
          </div>

        </div>
      </header>

      {/* Main Full-Width Content Area */}
      <main className="flex-grow p-6 overflow-x-hidden w-full max-w-[1600px] mx-auto">
        <Outlet />
      </main>

    </div>
  );
}
