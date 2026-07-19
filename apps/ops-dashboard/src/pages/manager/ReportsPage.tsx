import React, { useState } from 'react';
import {
  FileText, Download, Play, Trash2, Edit2, Plus,
  Clock, Users, Calendar, ChevronDown, ChevronUp,
  Table, FileJson
} from 'lucide-react';

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const scheduledReports = [
  { id: 'r1', name: 'Daily Inventory Summary', frequency: 'Daily', nextRun: 'Tomorrow 06:00', recipients: 'mgmt@warehouse.com, ops@warehouse.com', status: 'active' },
  { id: 'r2', name: 'Weekly Accuracy Report', frequency: 'Weekly (Mon)', nextRun: 'Jul 21, 06:00', recipients: 'manager@warehouse.com', status: 'active' },
  { id: 'r3', name: 'Mission Performance Digest', frequency: 'Weekly (Fri)', nextRun: 'Jul 18, 18:00', recipients: 'ops@warehouse.com, cto@company.com', status: 'paused' },
  { id: 'r4', name: 'Robot Health Report', frequency: 'Daily', nextRun: 'Tomorrow 07:30', recipients: 'robotops@warehouse.com', status: 'active' },
  { id: 'r5', name: 'Monthly Compliance Audit', frequency: 'Monthly (1st)', nextRun: 'Aug 01, 09:00', recipients: 'compliance@company.com, cfo@company.com', status: 'active' },
];

const reportHistory = [
  { id: 'h1', name: 'Daily Inventory Summary', format: 'PDF', generatedAt: '2026-07-17 06:00', size: '2.4 MB', status: 'completed' },
  { id: 'h2', name: 'Weekly Accuracy Report', format: 'CSV', generatedAt: '2026-07-14 06:00', size: '840 KB', status: 'completed' },
  { id: 'h3', name: 'Mission Performance Digest', format: 'PDF', generatedAt: '2026-07-11 18:00', size: '3.1 MB', status: 'completed' },
  { id: 'h4', name: 'Robot Health Report', format: 'CSV', generatedAt: '2026-07-17 07:30', size: '512 KB', status: 'completed' },
  { id: 'h5', name: 'Monthly Compliance Audit', format: 'PDF', generatedAt: '2026-07-01 09:00', size: '8.7 MB', status: 'completed' },
  { id: 'h6', name: 'Daily Inventory Summary', format: 'PDF', generatedAt: '2026-07-16 06:00', size: '2.2 MB', status: 'completed' },
];

const REPORT_TYPES = ['Daily Summary', 'Weekly Accuracy', 'Mission Report', 'Custom Audit'];

// ─── Modal ─────────────────────────────────────────────────────────────────────
interface CreateReportModalProps {
  onClose: () => void;
}

const CreateReportModal: React.FC<CreateReportModalProps> = ({ onClose }) => {
  const [type, setType] = useState('Daily Summary');
  const [format, setFormat] = useState('PDF');
  const [scheduled, setScheduled] = useState(false);
  const [email, setEmail] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0d1424] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] p-6">
          <h2 className="text-base font-semibold text-slate-100">Create New Report</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Report Type</label>
            <div className="grid grid-cols-2 gap-2">
              {REPORT_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`rounded-xl border p-3 text-sm font-medium text-left transition-all
                    ${type === t ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:border-white/[0.15]'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Start Date</label>
              <input type="date" className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-indigo-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">End Date</label>
              <input type="date" className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-indigo-500 transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Format</label>
            <div className="flex gap-2">
              {['PDF', 'CSV'].map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all
                    ${format === f ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' : 'border-white/[0.08] bg-white/[0.02] text-slate-500 hover:text-slate-300'}`}
                >
                  {f === 'PDF' ? <FileText className="h-4 w-4" /> : <Table className="h-4 w-4" />}
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Recipient Emails</label>
            <input
              type="text"
              placeholder="email1@company.com, email2@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2.5 text-sm text-slate-300 placeholder-slate-600 outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
            <div>
              <p className="text-sm font-medium text-slate-300">Schedule Report</p>
              <p className="text-xs text-slate-500 mt-0.5">Automatically run on a recurring basis</p>
            </div>
            <button
              onClick={() => setScheduled(!scheduled)}
              className={`relative h-6 w-11 rounded-full transition-all duration-300 ${scheduled ? 'bg-indigo-600' : 'bg-white/10'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ${scheduled ? 'left-5.5 translate-x-0.5' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-white/[0.06] p-6">
          <button onClick={onClose} className="rounded-xl border border-white/[0.08] px-5 py-2.5 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
          <button className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors shadow-lg shadow-indigo-500/20">
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [showModal, setShowModal] = useState(false);
  const [runNowId, setRunNowId] = useState<string | null>(null);

  const handleRunNow = (id: string) => {
    setRunNowId(id);
    setTimeout(() => setRunNowId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#080c14] p-6 space-y-6">
      {showModal && <CreateReportModal onClose={() => setShowModal(false)} />}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-400 mb-1">Reports</p>
          <h1 className="text-2xl font-bold text-slate-100">Report Management</h1>
          <p className="text-sm text-slate-500 mt-1">Schedule, manage, and export warehouse reports</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus className="h-4 w-4" />
          Create Report
        </button>
      </div>

      {/* Quick Export */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Quick Export</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { icon: '📊', label: 'Export Inventory CSV', color: 'from-emerald-600/20 to-emerald-500/10 border-emerald-500/20 text-emerald-400' },
            { icon: '📋', label: 'Export Alert Log', color: 'from-red-600/20 to-red-500/10 border-red-500/20 text-red-400' },
            { icon: '🤖', label: 'Export Mission Log', color: 'from-indigo-600/20 to-indigo-500/10 border-indigo-500/20 text-indigo-400' },
          ].map(btn => (
            <button
              key={btn.label}
              className={`flex items-center gap-2.5 rounded-xl border bg-gradient-to-r ${btn.color} px-5 py-3 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]`}
            >
              <span>{btn.icon}</span>
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scheduled Reports */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-slate-200">Scheduled Reports</h2>
          </div>
          <span className="text-xs text-slate-500">{scheduledReports.length} reports</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {['Report Name', 'Frequency', 'Next Run', 'Recipients', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {scheduledReports.map(r => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-200">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-slate-400">{r.frequency}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-400">{r.nextRun}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-500 max-w-[200px] truncate block">{r.recipients}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold
                      ${r.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {r.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="rounded-lg bg-white/[0.04] p-1.5 text-slate-500 hover:text-slate-300 transition-colors" title="Edit">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleRunNow(r.id)}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all
                          ${runNowId === r.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20'}`}
                      >
                        <Play className="h-3 w-3" />
                        {runNowId === r.id ? 'Running...' : 'Run Now'}
                      </button>
                      <button className="rounded-lg bg-white/[0.04] p-1.5 text-slate-600 hover:text-red-400 transition-colors" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report History */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-200">Report History</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {['Report Name', 'Format', 'Generated At', 'Size', 'Status', 'Download'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {reportHistory.map(r => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-200">{r.name}</td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 text-xs font-semibold w-fit
                      ${r.format === 'PDF' ? 'text-red-400' : 'text-emerald-400'}`}>
                      {r.format === 'PDF' ? <FileText className="h-3.5 w-3.5" /> : <FileJson className="h-3.5 w-3.5" />}
                      {r.format}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400 font-mono">{r.generatedAt}</td>
                  <td className="px-6 py-4 text-xs text-slate-500 font-mono">{r.size}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-emerald-500/10 text-emerald-400 px-2.5 py-1 text-[10px] font-semibold">{r.status.toUpperCase()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:border-white/[0.15] transition-all">
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
