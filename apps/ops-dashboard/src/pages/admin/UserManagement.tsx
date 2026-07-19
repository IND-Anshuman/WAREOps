import React, { useState, useMemo } from 'react';
import {
  Search, Filter, MoreVertical, UserPlus, ChevronRight,
  Shield, Clock, Mail, X, Check, AlertTriangle
} from 'lucide-react';

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const users = [
  { id: 'u1', name: 'Ananya Krishnan', email: 'ananya.k@alpha.sg', role: 'MANAGER', warehouse: 'WH-ALPHA-001', status: 'ACTIVE', lastLogin: '2026-07-17 14:22', avatar: 'AK', ip: '203.0.113.42' },
  { id: 'u2', name: 'Marcus Chen', email: 'marcus.c@gamma.jp', role: 'SUPERVISOR', warehouse: 'WH-GAMMA-003', status: 'ACTIVE', lastLogin: '2026-07-17 11:08', avatar: 'MC', ip: '198.51.100.7' },
  { id: 'u3', name: 'Priya Nair', email: 'priya.n@beta.in', role: 'OPERATOR', warehouse: 'WH-BETA-002', status: 'ACTIVE', lastLogin: '2026-07-16 09:44', avatar: 'PN', ip: '192.0.2.55' },
  { id: 'u4', name: 'Jin Ha', email: 'jin.ha@beta.in', role: 'OPERATOR', warehouse: 'WH-BETA-002', status: 'SUSPENDED', lastLogin: '2026-07-15 16:01', avatar: 'JH', ip: '198.51.100.22' },
  { id: 'u5', name: 'Thomas Bauer', email: 'tom.b@alpha.sg', role: 'SUPERVISOR', warehouse: 'WH-ALPHA-001', status: 'ACTIVE', lastLogin: '2026-07-17 13:55', avatar: 'TB', ip: '203.0.113.11' },
  { id: 'u6', name: 'Sofia Andersson', email: 'sofia.a@delta.de', role: 'MANAGER', warehouse: 'WH-DELTA-004', status: 'ACTIVE', lastLogin: '2026-07-17 10:30', avatar: 'SA', ip: '192.0.2.88' },
  { id: 'u7', name: 'Carlos Mendoza', email: 'carlos.m@gamma.jp', role: 'OPERATOR', warehouse: 'WH-GAMMA-003', status: 'PENDING', lastLogin: 'Never', avatar: 'CM', ip: '–' },
  { id: 'u8', name: 'Lena Schmidt', email: 'lena.s@delta.de', role: 'OPERATOR', warehouse: 'WH-DELTA-004', status: 'ACTIVE', lastLogin: '2026-07-16 18:22', avatar: 'LS', ip: '192.0.2.71' },
];

const pendingInvites = [
  { id: 'i1', email: 'new.hire@wh3.jp', role: 'OPERATOR', invitedBy: 'admin@platform.io', expiresAt: '2026-07-24', warehouse: 'WH-GAMMA-003' },
  { id: 'i2', email: 'manager.new@alpha.sg', role: 'MANAGER', invitedBy: 'admin@platform.io', expiresAt: '2026-07-20', warehouse: 'WH-ALPHA-001' },
];

const userAuditEvents = [
  { action: 'LOGIN', resource: 'session created', time: '2h ago', outcome: 'success' },
  { action: 'ALERT_RESOLVED', resource: 'alert:A3-R2-S4', time: '3h ago', outcome: 'success' },
  { action: 'MISSION_CREATED', resource: 'mission:MSN-2849', time: '5h ago', outcome: 'success' },
  { action: 'LOGIN_FAILED', resource: 'IP: 198.51.100.99', time: '1d ago', outcome: 'failure' },
  { action: 'LOGOUT', resource: 'session ended', time: '1d 2h ago', outcome: 'success' },
];

const ROLES = ['All', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR'];
const STATUSES = ['All', 'ACTIVE', 'SUSPENDED', 'PENDING'];

// ─── Role Badge ────────────────────────────────────────────────────────────────
const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const map: Record<string, string> = {
    ADMIN: 'bg-purple-500/10 text-purple-400',
    MANAGER: 'bg-indigo-500/10 text-indigo-400',
    SUPERVISOR: 'bg-blue-500/10 text-blue-400',
    OPERATOR: 'bg-slate-800 text-slate-400',
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${map[role] || 'bg-slate-800 text-slate-400'}`}>{role}</span>;
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    ACTIVE: 'bg-emerald-500/10 text-emerald-400',
    SUSPENDED: 'bg-red-500/10 text-red-400',
    PENDING: 'bg-amber-500/10 text-amber-400',
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${map[status] || 'bg-slate-800 text-slate-400'}`}>{status}</span>;
};

// ─── Invite Modal ──────────────────────────────────────────────────────────────
const InviteModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [role, setRole] = useState('OPERATOR');
  const roleDescriptions: Record<string, string> = {
    ADMIN: 'Full platform access across all warehouses',
    MANAGER: 'Analytics, reports, and warehouse settings',
    SUPERVISOR: 'Alert management and mission oversight',
    OPERATOR: 'View alerts and basic mission interaction',
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0d1424] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] p-6">
          <h2 className="text-base font-semibold text-slate-100">Invite New User</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
            <input type="email" placeholder="user@company.com" className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2.5 text-sm text-slate-300 placeholder-slate-600 outline-none focus:border-indigo-500 transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Role</label>
            <div className="space-y-2">
              {['OPERATOR', 'SUPERVISOR', 'MANAGER'].map(r => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`w-full rounded-xl border p-3 text-left transition-all
                    ${role === r ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'}`}
                >
                  <div className="flex items-center justify-between">
                    <RoleBadge role={r} />
                    {role === r && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{roleDescriptions[r]}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Warehouse Assignment</label>
            <select className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-indigo-500 transition-colors">
              <option>WH-ALPHA-001</option>
              <option>WH-BETA-002</option>
              <option>WH-GAMMA-003</option>
              <option>WH-DELTA-004</option>
            </select>
          </div>
          <div className="rounded-xl bg-indigo-500/5 border border-indigo-500/20 p-4">
            <p className="text-xs font-semibold text-indigo-300 mb-1">Preview Invitation Email</p>
            <p className="text-xs text-slate-500">
              "You've been invited to join the Autonomous Warehouse Intelligence Platform as <strong className="text-slate-400">{role}</strong>. Click the link below to set up your account..."
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-white/[0.06] p-6">
          <button onClick={onClose} className="rounded-xl border border-white/[0.08] px-5 py-2.5 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
          <button className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors shadow-lg shadow-indigo-500/20">
            <Mail className="h-4 w-4" /> Send Invite
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── User Detail Panel ─────────────────────────────────────────────────────────
interface UserDetailPanelProps {
  user: typeof users[0];
  onClose: () => void;
}

const UserDetailPanel: React.FC<UserDetailPanelProps> = ({ user, onClose }) => (
  <div className="fixed right-0 top-0 h-full w-96 z-40 border-l border-white/[0.06] bg-[#0a1020] shadow-2xl flex flex-col">
    <div className="flex items-center justify-between border-b border-white/[0.06] p-6">
      <h2 className="text-sm font-semibold text-slate-200">User Details</h2>
      <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors"><X className="h-4 w-4" /></button>
    </div>
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* Avatar + Info */}
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
          {user.avatar}
        </div>
        <div>
          <p className="font-semibold text-slate-100">{user.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <RoleBadge role={user.role} />
            <StatusBadge status={user.status} />
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] divide-y divide-white/[0.04]">
        {[
          { label: 'Warehouse', value: user.warehouse },
          { label: 'Last Login', value: user.lastLogin },
          { label: 'Last IP', value: user.ip },
          { label: 'Active Sessions', value: '2' },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between px-4 py-3">
            <span className="text-xs text-slate-500">{row.label}</span>
            <span className="text-xs font-mono text-slate-300">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Activity */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Recent Activity</p>
        <div className="space-y-2">
          {userAuditEvents.map((ev, idx) => (
            <div key={idx} className="flex items-start gap-3 py-2 border-b border-white/[0.04]">
              <span className={`text-[10px] font-bold mt-0.5 ${ev.outcome === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                {ev.outcome === 'success' ? '✓' : '✕'}
              </span>
              <div>
                <p className="text-[11px] font-semibold text-indigo-400">{ev.action}</p>
                <p className="text-[10px] text-slate-600">{ev.resource} · {ev.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {[
          { label: 'Change Role', color: 'border-indigo-500/20 bg-indigo-500/5 text-indigo-400 hover:bg-indigo-500/10' },
          { label: 'Suspend Account', color: 'border-amber-500/20 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10' },
          { label: 'Reset Password Link', color: 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]' },
          { label: 'Revoke All Sessions', color: 'border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10' },
        ].map(action => (
          <button key={action.label} className={`w-full rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${action.color}`}>
            {action.label}
          </button>
        ))}
      </div>
    </div>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
export default function UserManagement() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedUser, setSelectedUser] = useState<typeof users[0] | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPendingInvites, setShowPendingInvites] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filtered = useMemo(() => users.filter(u =>
    (search === '' || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) &&
    (roleFilter === 'All' || u.role === roleFilter) &&
    (statusFilter === 'All' || u.status === statusFilter)
  ), [search, roleFilter, statusFilter]);

  return (
    <div className={`min-h-screen bg-[#080c14] p-6 space-y-6 transition-all ${selectedUser ? 'pr-[416px]' : ''}`}>
      {showInviteModal && <InviteModal onClose={() => setShowInviteModal(false)} />}
      {selectedUser && <UserDetailPanel user={selectedUser} onClose={() => setSelectedUser(null)} />}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-400 mb-1">Administrator</p>
          <h1 className="text-2xl font-bold text-slate-100">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">{users.length} users across {[...new Set(users.map(u => u.warehouse))].length} warehouses</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition-all shadow-lg shadow-indigo-500/20"
        >
          <UserPlus className="h-4 w-4" /> Invite User
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] pl-9 pr-4 py-2.5 text-sm text-slate-300 placeholder-slate-600 outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-indigo-500 transition-colors"
        >
          {ROLES.map(r => <option key={r}>{r}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-indigo-500 transition-colors"
        >
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <span className="text-xs text-slate-500">{filtered.length} results</span>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.04]">
              {['User', 'Role', 'Warehouse', 'Status', 'Last Login', 'Actions'].map(h => (
                <th key={h} className="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {filtered.map(user => (
              <tr
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="hover:bg-white/[0.02] transition-colors cursor-pointer"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {user.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4"><RoleBadge role={user.role} /></td>
                <td className="px-6 py-4 text-xs font-mono text-slate-400">{user.warehouse}</td>
                <td className="px-6 py-4"><StatusBadge status={user.status} /></td>
                <td className="px-6 py-4 text-xs text-slate-500 font-mono">{user.lastLogin}</td>
                <td className="px-6 py-4">
                  <div className="relative">
                    <button
                      onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === user.id ? null : user.id); }}
                      className="rounded-lg bg-white/[0.04] p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {openMenuId === user.id && (
                      <div className="absolute right-0 top-8 z-20 w-48 rounded-xl border border-white/[0.08] bg-[#0d1424] shadow-2xl overflow-hidden">
                        {['View Detail', 'Change Role', 'Suspend', 'Revoke Sessions', 'Delete'].map(action => (
                          <button
                            key={action}
                            onClick={e => { e.stopPropagation(); setOpenMenuId(null); if (action === 'View Detail') setSelectedUser(user); }}
                            className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors hover:bg-white/[0.05]
                              ${action === 'Delete' || action === 'Suspend' ? 'text-red-400' : 'text-slate-300'}`}
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pending Invites */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
        <button
          onClick={() => setShowPendingInvites(!showPendingInvites)}
          className="flex items-center justify-between w-full px-6 py-4 border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-semibold text-slate-200">Pending Invites</span>
            <span className="rounded-full bg-amber-500/10 text-amber-400 px-2 py-0.5 text-[10px] font-bold">{pendingInvites.length}</span>
          </div>
          <ChevronRight className={`h-4 w-4 text-slate-500 transition-transform ${showPendingInvites ? 'rotate-90' : ''}`} />
        </button>
        {showPendingInvites && (
          <div className="divide-y divide-white/[0.03]">
            {pendingInvites.map(inv => (
              <div key={inv.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Mail className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-300">{inv.email}</p>
                    <p className="text-xs text-slate-500">Invited by {inv.invitedBy} · Expires {inv.expiresAt}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RoleBadge role={inv.role} />
                  <span className="text-xs text-slate-500 font-mono">{inv.warehouse}</span>
                  <button className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all">
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
