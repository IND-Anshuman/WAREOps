import React, { useState, useMemo } from 'react';
import { Search, Download, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const generateLogs = () => {
  const events = ['USER_LOGIN', 'USER_LOGOUT', 'ALERT_RESOLVED', 'ROLE_CHANGED', 'USER_INVITED',
    'ACCOUNT_LOCKED', 'SESSION_REVOKED', 'API_KEY_GENERATED', 'DATA_EXPORT', 'WAREHOUSE_UPDATED',
    'MISSION_CREATED', 'ROBOT_COMMISSIONED', 'MFA_ENABLED', 'PASSWORD_RESET'];
  const actors = ['admin@platform.io', 'ananya.k@alpha.sg', 'marcus.c@gamma.jp', 'sofia.a@delta.de', 'system'];
  const roles = ['ADMIN', 'MANAGER', 'SUPERVISOR', 'SYSTEM'];
  const ips = ['203.0.113.42', '198.51.100.7', '192.0.2.55', '203.0.113.11', '0.0.0.0'];
  const warehouses = ['WH-ALPHA-001', 'WH-BETA-002', 'WH-GAMMA-003', 'WH-DELTA-004'];
  const outcomes = ['SUCCESS', 'FAILURE', 'SUCCESS', 'SUCCESS', 'SUCCESS'];

  return Array.from({ length: 120 }, (_, i) => {
    const d = new Date('2026-07-17T16:00:00');
    d.setMinutes(d.getMinutes() - i * 7);
    const eventType = events[i % events.length];
    const actorIdx = i % actors.length;
    const outcome = outcomes[i % outcomes.length];
    return {
      id: `log-${i + 1}`,
      timestamp: d.toISOString().replace('T', ' ').slice(0, 19),
      actor: actors[actorIdx],
      role: roles[Math.min(actorIdx, roles.length - 1)],
      eventType,
      resource: eventType === 'ALERT_RESOLVED' ? `alert:A${(i % 3) + 1}-R${(i % 4) + 1}` :
        eventType === 'MISSION_CREATED' ? `mission:MSN-${2800 + i}` :
          eventType === 'ROLE_CHANGED' ? `user:user-${i} → MANAGER` : warehouses[i % warehouses.length],
      ip: ips[actorIdx],
      outcome,
      beforeState: eventType === 'ROLE_CHANGED' ? { role: 'OPERATOR' } : null,
      afterState: eventType === 'ROLE_CHANGED' ? { role: 'MANAGER' } : null,
    };
  });
};

const ALL_LOGS = generateLogs();

const EVENT_TYPES = ['USER_LOGIN', 'USER_LOGOUT', 'ALERT_RESOLVED', 'ROLE_CHANGED',
  'USER_INVITED', 'ACCOUNT_LOCKED', 'SESSION_REVOKED', 'API_KEY_GENERATED', 'DATA_EXPORT'];

// ─── Export Modal ──────────────────────────────────────────────────────────────
const ExportModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [evidence, setEvidence] = useState<string[]>(['audit_logs', 'alerts']);
  const toggleEvidence = (e: string) =>
    setEvidence(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0d1424] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] p-6">
          <h2 className="text-base font-semibold text-slate-100">Export Compliance Package</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">From Date</label>
              <input type="date" className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-indigo-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">To Date</label>
              <input type="date" className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-indigo-500 transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Evidence to Include</label>
            <div className="space-y-2">
              {[
                { id: 'audit_logs', label: 'Audit Logs' },
                { id: 'alerts', label: 'Alert History' },
                { id: 'missions', label: 'Mission Records' },
                { id: 'access_logs', label: 'Access Logs' },
              ].map(ev => (
                <label key={ev.id} className="flex items-center gap-3 cursor-pointer rounded-xl p-2.5 hover:bg-white/[0.03] transition-colors">
                  <div
                    onClick={() => toggleEvidence(ev.id)}
                    className={`h-4 w-4 rounded flex items-center justify-center transition-all
                      ${evidence.includes(ev.id) ? 'bg-indigo-600' : 'bg-white/10 border border-white/20'}`}
                  >
                    {evidence.includes(ev.id) && <span className="text-white text-[10px] font-bold">✓</span>}
                  </div>
                  <span className="text-sm text-slate-300">{ev.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Format</label>
            <div className="flex gap-2">
              {['CSV', 'JSON'].map(f => (
                <button key={f} className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-slate-400 hover:text-slate-200 hover:border-white/[0.15] transition-all font-semibold">{f}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-white/[0.06] p-6">
          <button onClick={onClose} className="rounded-xl border border-white/[0.08] px-5 py-2.5 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
          <button className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors shadow-lg shadow-indigo-500/20">
            <Download className="h-4 w-4" /> Generate Package
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const PAGE_SIZE = 50;

export default function AuditLogs() {
  const [search, setSearch] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string[]>([]);
  const [outcomeFilter, setOutcomeFilter] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [showExport, setShowExport] = useState(false);

  const filtered = useMemo(() => ALL_LOGS.filter(log =>
    (search === '' || log.actor.includes(search) || log.eventType.includes(search.toUpperCase())) &&
    (eventTypeFilter.length === 0 || eventTypeFilter.includes(log.eventType)) &&
    (outcomeFilter === 'All' || log.outcome === outcomeFilter)
  ), [search, eventTypeFilter, outcomeFilter]);

  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-[#080c14] p-6 space-y-5">
      {showExport && <ExportModal onClose={() => setShowExport(false)} />}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-400 mb-1">Compliance</p>
          <h1 className="text-2xl font-bold text-slate-100">Audit Logs</h1>
          <p className="text-sm text-slate-500 mt-1">{filtered.length} records found</p>
        </div>
        <button
          onClick={() => setShowExport(true)}
          className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] px-5 py-2.5 text-sm font-semibold text-slate-300 transition-all"
        >
          <Download className="h-4 w-4" /> Export Compliance Package
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search actor or event..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="rounded-xl bg-white/[0.04] border border-white/[0.08] pl-9 pr-4 py-2 text-sm text-slate-300 placeholder-slate-600 outline-none focus:border-indigo-500 transition-colors w-56"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {EVENT_TYPES.slice(0, 5).map(et => (
            <button
              key={et}
              onClick={() => setEventTypeFilter(prev => prev.includes(et) ? prev.filter(x => x !== et) : [...prev, et])}
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition-all
                ${eventTypeFilter.includes(et) ? 'bg-indigo-600 text-white' : 'bg-white/[0.05] text-slate-500 hover:text-slate-300'}`}
            >
              {et}
            </button>
          ))}
        </div>
        <select
          value={outcomeFilter}
          onChange={e => setOutcomeFilter(e.target.value)}
          className="rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-sm text-slate-300 outline-none focus:border-indigo-500 transition-colors ml-auto"
        >
          {['All', 'SUCCESS', 'FAILURE'].map(o => <option key={o}>{o}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {['Timestamp', 'Actor', 'Role', 'Event Type', 'Resource', 'IP Address', 'Outcome'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData.map(log => (
                <React.Fragment key={log.id}>
                  <tr
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 text-slate-500">{log.timestamp}</td>
                    <td className="px-4 py-3 text-indigo-400 max-w-[160px] truncate">{log.actor}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold
                        ${log.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400' :
                          log.role === 'MANAGER' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
                        {log.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-semibold">{log.eventType}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate">{log.resource}</td>
                    <td className="px-4 py-3 text-slate-600">{log.ip}</td>
                    <td className="px-4 py-3">
                      <span className={log.outcome === 'SUCCESS' ? 'text-emerald-400' : 'text-red-400'}>
                        {log.outcome === 'SUCCESS' ? '✅' : '❌'}
                      </span>
                    </td>
                  </tr>
                  {expandedId === log.id && log.beforeState && (
                    <tr className="border-b border-white/[0.04] bg-white/[0.02]">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-semibold text-red-400 uppercase tracking-widest mb-2">Before State</p>
                            <pre className="rounded-xl bg-red-500/5 border border-red-500/10 p-3 text-xs text-red-300 overflow-auto">
                              {JSON.stringify(log.beforeState, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest mb-2">After State</p>
                            <pre className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-3 text-xs text-emerald-300 overflow-auto">
                              {JSON.stringify(log.afterState, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-white/[0.04] px-6 py-4">
          <span className="text-xs text-slate-500">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-lg bg-white/[0.04] p-1.5 text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-slate-500">{page + 1} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-lg bg-white/[0.04] p-1.5 text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
