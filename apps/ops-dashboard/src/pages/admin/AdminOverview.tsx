import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, AlertTriangle, Bot, CheckCircle2, Shield,
  Clock, TrendingUp, Activity, UserX, MonitorSmartphone
} from 'lucide-react';

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const warehouses = [
  {
    id: 'wh1', name: 'WH-ALPHA-001', location: 'Singapore · SG',
    healthScore: 92, missions: 7, alerts: 3, robotsOnline: 6, robotsTotal: 7,
    status: 'ACTIVE', grade: 'A',
  },
  {
    id: 'wh2', name: 'WH-BETA-002', location: 'Mumbai · IN',
    healthScore: 78, missions: 3, alerts: 11, robotsOnline: 4, robotsTotal: 6,
    status: 'ACTIVE', grade: 'B',
  },
  {
    id: 'wh3', name: 'WH-GAMMA-003', location: 'Tokyo · JP',
    healthScore: 95, missions: 12, alerts: 1, robotsOnline: 8, robotsTotal: 8,
    status: 'ACTIVE', grade: 'A+',
  },
  {
    id: 'wh4', name: 'WH-DELTA-004', location: 'Frankfurt · DE',
    healthScore: 61, missions: 0, alerts: 24, robotsOnline: 2, robotsTotal: 5,
    status: 'ACTIVE', grade: 'C',
  },
  {
    id: 'wh5', name: 'WH-EPSILON-005', location: 'Sydney · AU',
    healthScore: 0, missions: 0, alerts: 0, robotsOnline: 0, robotsTotal: 3,
    status: 'SETUP_MODE', grade: '–',
  },
  {
    id: 'wh6', name: 'WH-ZETA-006', location: 'London · GB',
    healthScore: 0, missions: 0, alerts: 0, robotsOnline: 0, robotsTotal: 0,
    status: 'INACTIVE', grade: '–',
  },
];

const securitySummary = {
  failedLogins: 7,
  activeSessions: 23,
  lastEvent: 'Account lockout for user jin.ha@beta.com after 5 failed attempts',
  lastEventTime: '14 min ago',
};

const auditFeed = [
  { id: 1, actor: 'admin@platform.io', action: 'ROLE_CHANGED', resource: 'user:carlos.m → MANAGER', time: '5m ago', outcome: 'success' },
  { id: 2, actor: 'admin@platform.io', action: 'USER_INVITED', resource: 'email:new.hire@wh3.jp', time: '22m ago', outcome: 'success' },
  { id: 3, actor: 'system', action: 'ACCOUNT_LOCKED', resource: 'user:jin.ha@beta.com', time: '36m ago', outcome: 'warning' },
  { id: 4, actor: 'admin@platform.io', action: 'WAREHOUSE_CREATED', resource: 'warehouse:WH-EPSILON-005', time: '2h ago', outcome: 'success' },
  { id: 5, actor: 'admin@platform.io', action: 'API_KEY_REVOKED', resource: 'key:robot-prod-old', time: '3h 12m ago', outcome: 'success' },
  { id: 6, actor: 'admin@platform.io', action: 'DATA_EXPORT', resource: 'report:compliance-q2-2026', time: '4h ago', outcome: 'success' },
  { id: 7, actor: 'system', action: 'SESSION_REVOKED', resource: 'user:tom.b@alpha.sg (3 sessions)', time: '5h 45m ago', outcome: 'warning' },
  { id: 8, actor: 'admin@platform.io', action: 'MFA_POLICY_UPDATED', resource: 'org:global → REQUIRED', time: '1d ago', outcome: 'success' },
  { id: 9, actor: 'admin@platform.io', action: 'USER_SUSPENDED', resource: 'user:contractor.x@old.com', time: '1d 6h ago', outcome: 'warning' },
  { id: 10, actor: 'system', action: 'BACKUP_COMPLETED', resource: 'db:warehouse-platform-prod', time: '1d 12h ago', outcome: 'success' },
];

// ─── Small Circular Health Ring ───────────────────────────────────────────────
const HealthRing: React.FC<{ score: number; size?: number }> = ({ score, size = 40 }) => {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 90 ? '#10b981' : score >= 75 ? '#6366f1' : score >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fill="white" fontSize="10" fontWeight="700">
        {score > 0 ? score : '–'}
      </text>
    </svg>
  );
};

// ─── Org Health Score ──────────────────────────────────────────────────────────
const orgScore = Math.round(warehouses.filter(w => w.status === 'ACTIVE').reduce((acc, w) => acc + w.healthScore, 0) / warehouses.filter(w => w.status === 'ACTIVE').length);
const orgGrade = orgScore >= 90 ? 'A' : orgScore >= 80 ? 'B' : orgScore >= 70 ? 'C' : orgScore >= 60 ? 'D' : 'F';

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AdminOverview() {
  const navigate = useNavigate();
  const [selectedWh, setSelectedWh] = useState<string | null>(null);

  const statusColor: Record<string, string> = {
    ACTIVE: 'bg-emerald-500/10 text-emerald-400',
    SETUP_MODE: 'bg-amber-500/10 text-amber-400',
    INACTIVE: 'bg-slate-800 text-slate-500',
  };

  const outcomeColor: Record<string, string> = {
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    error: 'text-red-400',
  };

  return (
    <div className="min-h-screen bg-[#080c14] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-400 mb-1">Administrator</p>
          <h1 className="text-2xl font-bold text-slate-100">Organization Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Global view across {warehouses.length} warehouses</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-6 py-4 text-center">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Org Health Score</p>
            <p className="text-4xl font-bold mt-1" style={{ color: orgScore >= 80 ? '#10b981' : orgScore >= 70 ? '#6366f1' : '#f59e0b' }}>{orgScore}</p>
            <p className="text-lg font-bold text-slate-400 mt-0.5">Grade: {orgGrade}</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Warehouses', value: warehouses.filter(w => w.status === 'ACTIVE').length, icon: Building2, color: '#6366f1' },
          { label: 'Total Active Missions', value: warehouses.reduce((a, w) => a + w.missions, 0), icon: Activity, color: '#10b981' },
          { label: 'Total Open Alerts', value: warehouses.reduce((a, w) => a + w.alerts, 0), icon: AlertTriangle, color: '#ef4444' },
          { label: 'Robots Online', value: `${warehouses.reduce((a, w) => a + w.robotsOnline, 0)}/${warehouses.reduce((a, w) => a + w.robotsTotal, 0)}`, icon: Bot, color: '#8b5cf6' },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-100" style={{ fontFamily: 'monospace' }}>{stat.value}</p>
              </div>
              <div className="rounded-xl p-2" style={{ backgroundColor: stat.color + '18' }}>
                <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Warehouse Grid */}
      <div>
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Warehouse Network</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {warehouses.map(wh => (
            <div
              key={wh.id}
              onClick={() => { if (wh.status === 'ACTIVE') navigate('/manager/dashboard'); }}
              className={`rounded-2xl border p-5 transition-all duration-300 group
                ${wh.status === 'ACTIVE' ? 'border-white/[0.06] bg-white/[0.03] cursor-pointer hover:border-indigo-500/30 hover:bg-indigo-500/[0.04]' : 'border-white/[0.03] bg-white/[0.01] opacity-70 cursor-default'}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{wh.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> {wh.location}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <HealthRing score={wh.healthScore} size={44} />
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor[wh.status]}`}>{wh.status}</span>
                </div>
              </div>

              {wh.status !== 'INACTIVE' && (
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-white/[0.03] p-2">
                    <p className="text-xs font-bold text-emerald-400">{wh.missions}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">Missions</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] p-2">
                    <p className={`text-xs font-bold ${wh.alerts > 10 ? 'text-red-400' : wh.alerts > 3 ? 'text-amber-400' : 'text-slate-300'}`}>{wh.alerts}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">Alerts</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] p-2">
                    <p className="text-xs font-bold text-indigo-400">{wh.robotsOnline}/{wh.robotsTotal}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">Robots</p>
                  </div>
                </div>
              )}
              {wh.status === 'INACTIVE' && (
                <p className="text-xs text-slate-600 text-center mt-2">Warehouse not in service</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Row: Security + Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Security Summary */}
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-red-400" />
            <h2 className="text-sm font-semibold text-slate-200">Security Summary</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-4 text-center">
              <p className="text-2xl font-bold text-red-400 font-mono">{securitySummary.failedLogins}</p>
              <p className="text-[10px] text-slate-500 mt-1">Failed Logins Today</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400 font-mono">{securitySummary.activeSessions}</p>
              <p className="text-[10px] text-slate-500 mt-1">Active Sessions</p>
            </div>
          </div>
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Last Security Event</p>
            <p className="text-xs text-slate-300 leading-relaxed">{securitySummary.lastEvent}</p>
            <p className="text-[10px] text-slate-600 mt-2">{securitySummary.lastEventTime}</p>
          </div>
          <button
            onClick={() => navigate('/admin/security')}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:border-white/[0.15] transition-all"
          >
            View Security Logs →
          </button>
        </div>

        {/* Admin Audit Feed */}
        <div className="lg:col-span-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-200">Recent Admin Activity</h2>
          </div>
          <div className="space-y-0">
            {auditFeed.map((event, idx) => (
              <div key={event.id} className={`flex items-start gap-3 py-2.5 ${idx < auditFeed.length - 1 ? 'border-b border-white/[0.04]' : ''}`}>
                <span className={`mt-0.5 text-[10px] ${outcomeColor[event.outcome]} font-bold flex-shrink-0`}>
                  {event.outcome === 'success' ? '✓' : '!'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] font-mono font-semibold text-slate-500 flex-shrink-0">{event.actor}</span>
                    <span className="text-[10px] font-semibold text-indigo-400">{event.action}</span>
                    <span className="text-[10px] text-slate-600 truncate">{event.resource}</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-600 whitespace-nowrap">{event.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
