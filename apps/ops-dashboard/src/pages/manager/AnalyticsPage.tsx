import React, { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, ReferenceLine, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Target } from 'lucide-react';

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const days30 = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (29 - i));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
});

const inventoryAccuracyData = days30.map(date => ({
  date,
  accuracy: 97.5 + Math.random() * 2.2,
  scans: 800 + Math.floor(Math.random() * 600),
}));

const zoneAccuracyBreakdown = [
  { zone: 'Zone A – Electronics', scanned: 480, total: 480, accuracy: 99.6, trend: 'up' },
  { zone: 'Zone B – Furniture', scanned: 362, total: 380, accuracy: 98.1, trend: 'up' },
  { zone: 'Zone C – Books', scanned: 195, total: 200, accuracy: 97.5, trend: 'down' },
  { zone: 'Zone D – Apparel', scanned: 310, total: 320, accuracy: 98.9, trend: 'up' },
  { zone: 'Zone E – Perishables', scanned: 88, total: 100, accuracy: 94.3, trend: 'down' },
];

const alertByTypeData = [
  { type: 'MISPLACED', count: 47, color: '#f97316' },
  { type: 'MISSING', count: 23, color: '#ef4444' },
  { type: 'EXTRA', count: 18, color: '#8b5cf6' },
  { type: 'DAMAGED', count: 11, color: '#f59e0b' },
];

const topAlertZones = [
  { zone: 'Zone C – Books', alerts: 28 },
  { zone: 'Zone E – Perishables', alerts: 21 },
  { zone: 'Zone B – Furniture', alerts: 15 },
  { zone: 'Zone D – Apparel', alerts: 10 },
  { zone: 'Zone A – Electronics', alerts: 7 },
];

const missionCompletionData = days30.slice(-14).map(date => ({
  date,
  rate: 88 + Math.random() * 10,
}));

const missionDurationData = [
  { range: '0–15m', count: 12 },
  { range: '15–30m', count: 34 },
  { range: '30–45m', count: 28 },
  { range: '45–60m', count: 16 },
  { range: '60–90m', count: 8 },
  { range: '90m+', count: 3 },
];

const missionOutcome = [
  { name: 'Success', value: 78, color: '#10b981' },
  { name: 'Failed', value: 8, color: '#ef4444' },
  { name: 'Cancelled', value: 14, color: '#6b7280' },
];

const robotEfficiencyData = [
  { robot: 'R-001 Atlas', uptime: 97.2, missions: 48, battery: 82, status: 'ACTIVE' },
  { robot: 'R-002 Nexus', uptime: 94.5, missions: 41, battery: 91, status: 'ACTIVE' },
  { robot: 'R-003 Vega', uptime: 91.3, missions: 37, battery: 64, status: 'ACTIVE' },
  { robot: 'R-004 Titan', uptime: 88.1, missions: 29, battery: 100, status: 'CHARGING' },
  { robot: 'R-005 Orion', uptime: 72.4, missions: 18, battery: 0, status: 'OFFLINE' },
  { robot: 'R-006 Nova', uptime: 95.8, missions: 45, battery: 77, status: 'ACTIVE' },
];

const robotScanCoverage = [
  { robot: 'R-001', scans: 4820 },
  { robot: 'R-002', scans: 4100 },
  { robot: 'R-003', scans: 3750 },
  { robot: 'R-004', scans: 2900 },
  { robot: 'R-005', scans: 1820 },
  { robot: 'R-006', scans: 4500 },
];

// ─── Sub-components ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1424] p-3 text-xs shadow-xl">
      <p className="text-slate-400 mb-2 font-semibold">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
          <span className="text-slate-300">{p.name}: <strong className="text-white">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</strong></span>
        </div>
      ))}
    </div>
  );
};

const TrendBadge: React.FC<{ trend: string; value: string }> = ({ trend, value }) => (
  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold
    ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
    {trend === 'up' ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
    {value}
  </span>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    ACTIVE: 'bg-emerald-500/10 text-emerald-400',
    CHARGING: 'bg-indigo-500/10 text-indigo-400',
    OFFLINE: 'bg-slate-800 text-slate-500',
  };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${map[status] || 'bg-slate-800 text-slate-400'}`}>{status}</span>;
};

const TABS = ['Inventory Accuracy', 'Alert Analysis', 'Mission Performance', 'Robot Efficiency'];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="min-h-screen bg-[#080c14] p-6 space-y-6">
      {/* Header */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-400 mb-1">Analytics</p>
        <h1 className="text-2xl font-bold text-slate-100">Performance Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">30-day rolling metrics for Warehouse WH-ALPHA-001</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-xl bg-white/[0.03] border border-white/[0.06] p-1 w-full overflow-x-auto">
        {TABS.map((tab, idx) => (
          <button
            key={tab}
            onClick={() => setActiveTab(idx)}
            className={`flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-300
              ${activeTab === idx
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-slate-500 hover:text-slate-300'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab 1: Inventory Accuracy */}
      {activeTab === 0 && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">30-Day Trend</p>
                <h2 className="text-base font-semibold text-slate-200 mt-0.5">Accuracy % vs Daily Scan Count</h2>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5">
                <Target className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-semibold">Target: 99.5%</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={inventoryAccuracyData}>
                <defs>
                  <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
                <YAxis yAxisId="left" domain={[95, 101]} tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine yAxisId="left" y={99.5} stroke="#6366f1" strokeDasharray="6 3" strokeWidth={1.5} label={{ value: 'Target', fill: '#6366f1', fontSize: 10 }} />
                <Bar yAxisId="right" dataKey="scans" fill="rgba(99,102,241,0.15)" radius={[2, 2, 0, 0]} name="Scans" />
                <Line yAxisId="left" type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} dot={false} name="Accuracy %" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Zone breakdown table */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
            <h2 className="text-base font-semibold text-slate-200 mb-4">Zone Accuracy Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Zone', 'Scanned Bins', 'Total Bins', 'Accuracy', 'Trend'].map(h => (
                      <th key={h} className="pb-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {zoneAccuracyBreakdown.map(row => (
                    <tr key={row.zone} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 text-sm font-medium text-slate-200">{row.zone}</td>
                      <td className="py-3.5 text-sm font-mono text-slate-400">{row.scanned.toLocaleString()}</td>
                      <td className="py-3.5 text-sm font-mono text-slate-400">{row.total.toLocaleString()}</td>
                      <td className="py-3.5">
                        <span className={`text-sm font-bold ${row.accuracy >= 99 ? 'text-emerald-400' : row.accuracy >= 97 ? 'text-amber-400' : 'text-red-400'}`}>
                          {row.accuracy}%
                        </span>
                      </td>
                      <td className="py-3.5">
                        <TrendBadge trend={row.trend} value={row.trend === 'up' ? '+0.3%' : '-0.8%'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Alert Analysis */}
      {activeTab === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1">30-Day Volume</p>
              <h2 className="text-base font-semibold text-slate-200 mb-5">Alerts by Type</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={alertByTypeData} layout="vertical" barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="type" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Alert Count">
                    {alertByTypeData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 flex flex-col items-center justify-center gap-4">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">SLA Compliance</p>
              <div className="text-center">
                <p className="text-6xl font-bold text-emerald-400" style={{ fontFamily: 'monospace' }}>86.4%</p>
                <p className="text-sm text-slate-500 mt-2">of alerts resolved within 60 min SLA</p>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '86.4%' }} />
              </div>
              <p className="text-xs text-slate-600">Target: 90% · Gap: 3.6%</p>
            </div>
          </div>

          {/* Top 5 alert zones */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
            <h2 className="text-base font-semibold text-slate-200 mb-4">Top 5 Alert Zones</h2>
            <div className="space-y-3">
              {topAlertZones.map((z, idx) => (
                <div key={z.zone} className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-600 w-5">#{idx + 1}</span>
                  <span className="text-sm text-slate-300 w-48">{z.zone}</span>
                  <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-700"
                      style={{ width: `${(z.alerts / topAlertZones[0].alerts) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-200 w-12 text-right">{z.alerts}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Mission Performance */}
      {activeTab === 2 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Trend</p>
              <h2 className="text-base font-semibold text-slate-200 mb-5">Mission Completion Rate (14 Days)</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={missionCompletionData}>
                  <defs>
                    <linearGradient id="missGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} interval={1} />
                  <YAxis domain={[80, 100]} tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} name="Completion %" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Outcomes</p>
              <h2 className="text-base font-semibold text-slate-200 mb-4">Mission Results</h2>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={missionOutcome} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" paddingAngle={3}>
                    {missionOutcome.map((entry, idx) => <Cell key={idx} fill={entry.color} stroke="none" />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {missionOutcome.map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-slate-400">{item.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-200">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
              <h2 className="text-base font-semibold text-slate-200 mb-5">Mission Duration Distribution</h2>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={missionDurationData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="range" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Missions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 flex flex-col items-center justify-center gap-2">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Avg Bins Scanned</p>
              <p className="text-5xl font-bold text-indigo-400" style={{ fontFamily: 'monospace' }}>312</p>
              <p className="text-sm text-slate-500">per mission</p>
              <div className="mt-4 grid grid-cols-2 gap-4 w-full">
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-200">34.8m</p>
                  <p className="text-[10px] text-slate-500">avg duration</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-200">94.1%</p>
                  <p className="text-[10px] text-slate-500">success rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Robot Efficiency */}
      {activeTab === 3 && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
            <h2 className="text-base font-semibold text-slate-200 mb-4">Robot Fleet Performance</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Robot', 'Uptime %', 'Missions', 'Avg Battery', 'Status'].map(h => (
                      <th key={h} className="pb-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {robotEfficiencyData.map(row => (
                    <tr key={row.robot} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 text-sm font-medium text-slate-200">{row.robot}</td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-white/5 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${row.uptime}%` }} />
                          </div>
                          <span className="text-sm font-mono text-slate-300">{row.uptime}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 text-sm font-mono text-slate-400">{row.missions}</td>
                      <td className="py-3.5">
                        <span className={`text-sm font-mono ${row.battery > 50 ? 'text-emerald-400' : row.battery > 20 ? 'text-amber-400' : 'text-red-400'}`}>
                          {row.battery}%
                        </span>
                      </td>
                      <td className="py-3.5"><StatusBadge status={row.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
            <h2 className="text-base font-semibold text-slate-200 mb-5">Total Scan Coverage by Robot</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={robotScanCoverage} layout="vertical" barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="robot" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="scans" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Total Scans" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
