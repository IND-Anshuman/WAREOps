import React, { useState } from 'react';
import { Shield, UserCheck, Wrench, Barcode, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RoleCard {
  role: 'WAREHOUSE_OPERATOR' | 'WAREHOUSE_SUPERVISOR' | 'WAREHOUSE_MANAGER' | 'ENTERPRISE_ADMIN';
  title: string;
  badge: string;
  icon: any;
  desc: string;
  defaultPath: string;
  permissions: string[];
  kpis: { label: string; value: string }[];
}

const ROLES: RoleCard[] = [
  {
    role: 'WAREHOUSE_OPERATOR',
    title: 'Warehouse Operator',
    badge: 'Floor Level',
    icon: Barcode,
    desc: 'Focuses on bin lookups, scanning discrepancies, and shelf product verification.',
    defaultPath: '/operator/dashboard',
    permissions: ['Read spatial topology', 'Scan product QR codes', 'View shelf reconciliation results'],
    kpis: [{ label: 'Daily Audits', value: '450 Bins' }, { label: 'Accuracy Rate', value: '99.4%' }],
  },
  {
    role: 'WAREHOUSE_SUPERVISOR',
    title: 'Warehouse Supervisor',
    badge: 'Floor Management',
    icon: Wrench,
    desc: 'Manages AMR mission creation, granular audit scopes, product catalog CRUD, and inbound/outbound QR scans.',
    defaultPath: '/supervisor/dashboard',
    permissions: ['Schedule audit missions', 'Manage AMR fleet assignments', 'Perform catalog CRUD & QR checkouts'],
    kpis: [{ label: 'Active Missions', value: '12 Scheduled' }, { label: 'AMRs Online', value: '8 Nodes' }],
  },
  {
    role: 'WAREHOUSE_MANAGER',
    title: 'Warehouse Manager',
    badge: 'Operations Lead',
    icon: UserCheck,
    desc: 'Executive digital twin view, discrepancy trends, overall warehouse health scores, and WMS sync settings.',
    defaultPath: '/manager/dashboard',
    permissions: ['Access Executive Digital Twin', 'Configure WMS Sync options', 'Approve inventory adjustments'],
    kpis: [{ label: 'Warehouse Health', value: '98.8%' }, { label: 'Reconciliation', value: 'Instant' }],
  },
  {
    role: 'ENTERPRISE_ADMIN',
    title: 'Enterprise Administrator',
    badge: 'System Admin',
    icon: Shield,
    desc: 'Global system configuration, user provisioning, role-based permissions, and immutable audit logs.',
    defaultPath: '/admin/overview',
    permissions: ['User invitation & role assignments', 'Security policy & MFA configuration', 'System audit logs'],
    kpis: [{ label: 'Users Provisioned', value: '128 Staff' }, { label: 'Security Status', value: 'TOTP Active' }],
  },
];

export const RolePreviewGrid: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<RoleCard>(ROLES[1]); // Default Supervisor
  const navigate = useNavigate();

  const handleAuthRedirect = () => {
    navigate('/auth/login');
  };

  return (
    <section id="roles" className="relative z-10 py-24 px-4 max-w-6xl mx-auto space-y-12">
      {/* Title */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-mono font-semibold uppercase tracking-[0.2em]">
          <Shield className="h-3.5 w-3.5" /> Enterprise RBAC Command Matrix
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
          Role-Based Control Interfaces
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Preview the dashboard views, permissions, and operational capabilities assigned to each role before authenticating.
        </p>
      </div>

      {/* Role Selector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ROLES.map((r) => {
          const IconComp = r.icon;
          const isSelected = selectedRole.role === r.role;

          return (
            <button
              key={r.role}
              onClick={() => setSelectedRole(r)}
              className={`rounded-3xl p-1 text-left transition-all duration-500 ${
                isSelected 
                  ? 'bg-gradient-to-tr from-indigo-600/30 to-cyan-500/30 border border-indigo-500/50 shadow-2xl scale-[1.02]' 
                  : 'bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04]'
              }`}
            >
              <div className="rounded-[calc(1.5rem-0.25rem)] bg-slate-950/80 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`h-10 w-10 rounded-2xl flex items-center justify-center border ${
                    isSelected ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300' : 'bg-white/05 border-white/10 text-slate-400'
                  }`}>
                    <IconComp className="h-5 w-5" />
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">{r.badge}</span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-white tracking-wide">{r.title}</h4>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Role Inspector Card */}
      <div className="rounded-3xl p-1 bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-2xl animate-fade-in">
        <div className="rounded-[calc(1.5rem-0.25rem)] bg-slate-950/90 p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/08 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                {React.createElement(selectedRole.icon, { className: "h-6 w-6" })}
              </div>
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">{selectedRole.badge} Scope</span>
                <h3 className="text-2xl font-bold text-white">{selectedRole.title}</h3>
              </div>
            </div>

            <button
              onClick={handleAuthRedirect}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all"
            >
              <span>Authenticate for {selectedRole.title.split(' ')[1]} Access</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed font-sans">{selectedRole.desc}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">Granted Permissions:</span>
              <div className="space-y-1.5">
                {selectedRole.permissions.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-300 font-mono">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">Role Control Metrics:</span>
              <div className="grid grid-cols-2 gap-3">
                {selectedRole.kpis.map((k, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/04 space-y-0.5 font-mono">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest block">{k.label}</span>
                    <span className="text-sm font-bold text-indigo-300">{k.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
