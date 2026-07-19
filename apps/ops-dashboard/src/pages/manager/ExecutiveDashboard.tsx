import React, { useState, useEffect, useRef } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Clock, Zap, Bot, Activity, Shield, Package
} from 'lucide-react';

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const accuracyTrend = Array.from({ length: 14 }, (_, i) => ({
  day: `D${i + 1}`,
  value: 97.8 + Math.random() * 1.8,
}));

const missionTrend = Array.from({ length: 14 }, (_, i) => ({
  day: `D${i + 1}`,
  value: 90 + Math.random() * 7,
}));

const slaTrend = Array.from({ length: 14 }, (_, i) => ({
  day: `D${i + 1}`,
  value: 22 + Math.random() * 12,
}));

const uptimeTrend = Array.from({ length: 14 }, (_, i) => ({
  day: `D${i + 1}`,
  value: 88 + Math.random() * 8,
}));

const alertTrendData = Array.from({ length: 14 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (13 - i));
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    critical: Math.floor(Math.random() * 3),
    high: Math.floor(Math.random() * 6),
    medium: Math.floor(Math.random() * 10),
    low: Math.floor(Math.random() * 15),
  };
});

const robotUtilization = [
  { name: 'Active', value: 4, color: '#6366f1' },
  { name: 'Charging', value: 2, color: '#10b981' },
  { name: 'Offline', value: 1, color: '#374151' },
];

const criticalEvents = [
  {
    id: 1,
    icon: CheckCircle2,
    iconColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    title: 'Mission MSN-2847 completed',
    desc: '312 bins scanned, 99.4% accuracy in Zone A',
    time: '4 min ago',
    severity: 'success',
  },
  {
    id: 2,
    icon: AlertTriangle,
    iconColor: 'text-red-400',
    bgColor: 'bg-red-500/10',
    title: 'Critical alert resolved',
    desc: 'MISMATCH in A3-R2-S4-B1 cleared by Supervisor Chen',
    time: '18 min ago',
    severity: 'critical',
  },
  {
    id: 3,
    icon: Bot,
    iconColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    title: 'Robot R-007 went offline',
    desc: 'Battery depleted mid-mission, rescued by R-003',
    time: '42 min ago',
    severity: 'warning',
  },
  {
    id: 4,
    icon: Package,
    iconColor: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    title: 'New inventory batch imported',
    desc: '1,248 SKUs updated from WMS sync (SAP)',
    time: '1h 12min ago',
    severity: 'info',
  },
  {
    id: 5,
    icon: Shield,
    iconColor: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    title: 'Weekly accuracy target exceeded',
    desc: 'Fleet achieved 99.2% vs 98.5% target — new record',
    time: '3h 5min ago',
    severity: 'success',
  },
];

// ─── Circular Health Score Gauge ───────────────────────────────────────────────
const HealthGauge: React.FC<{ score: number }> = ({ score }) => {
  const [animated, setAnimated] = useState(0);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const progress = (animated / 100) * circumference;
  const dashOffset = circumference - progress;

  let color = '#6366f1';
  let glowColor = 'rgba(99,102,241,0.4)';
  let label = 'Excellent';
  if (score >= 90) { color = '#10b981'; glowColor = 'rgba(16,185,129,0.4)'; label = 'Optimal'; }
  else if (score >= 75) { color = '#6366f1'; glowColor = 'rgba(99,102,241,0.4)'; label = 'Good'; }
  else if (score >= 60) { color = '#f59e0b'; glowColor = 'rgba(245,158,11,0.4)'; label = 'Fair'; }
  else { color = '#ef4444'; glowColor = 'rgba(239,68,68,0.4)'; label = 'Critical'; }

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(score), 300);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width="200" height="200" viewBox="0 0 200 200">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Track */}
        <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
        {/* Progress */}
        <circle
          cx="100" cy="100" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 100 100)"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.32,0.72,0,1), stroke 0.5s ease', filter: `drop-shadow(0 0 8px ${glowColor})` }}
        />
        {/* Center */}
        <text x="100" y="90" textAnchor="middle" fill="white" fontSize="36" fontWeight="700" fontFamily="monospace">
          {Math.round(animated)}
        </text>
        <text x="100" y="112" textAnchor="middle" fill={color} fontSize="11" fontWeight="600" letterSpacing="1">
          {label.toUpperCase()}
        </text>
        <text x="100" y="128" textAnchor="middle" fill="rgba(148,163,184,0.7)" fontSize="9">
          HEALTH SCORE
        </text>
      </svg>
      <div className="flex flex-wrap justify-center gap-1.5 mt-2">
        {['Accuracy 40%', 'Missions 25%', 'Alerts 20%', 'Robots 15%'].map(c => (
          <span key={c} className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-slate-400 font-medium">
            {c}
          </span>
        ))}
      </div>
    </div>
  );
};

// ─── Sparkline KPI Card ────────────────────────────────────────────────────────
interface KpiCardProps {
  title: string;
  value: string;
  trend: 'up' | 'down';
  change: string;
  data: { day: string; value: number }[];
  color: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, trend, change, data, color, icon: Icon }) => (
  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm hover:border-white/[0.12] transition-all duration-500 group">
    <div className="flex items-start justify-between mb-4">
      <div>
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-100" style={{ fontFamily: 'monospace' }}>{value}</p>
        <div className="flex items-center gap-1 mt-1">
          {trend === 'up' ? (
            <TrendingUp className="h-3 w-3 text-emerald-400" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-400" />
          )}
          <span className={`text-xs font-medium ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>{change}</span>
          <span className="text-xs text-slate-600">vs last week</span>
        </div>
      </div>
      <div className="rounded-xl p-2" style={{ backgroundColor: color + '15' }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
    </div>
    <ResponsiveContainer width="100%" height={48}>
      <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} fill={`url(#grad-${title})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#0d1424] p-3 text-xs shadow-xl">
      <p className="text-slate-400 mb-2 font-semibold">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.fill || p.color }} />
          <span className="text-slate-300">{p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</strong></span>
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ExecutiveDashboard() {
  const healthScore = 87;

  return (
    <div className="min-h-screen bg-[#080c14] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-400 mb-1">Manager Dashboard</p>
          <h1 className="text-2xl font-bold text-slate-100">Executive Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Warehouse WH-ALPHA-001 · Last updated just now</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-semibold text-emerald-400">Live Monitoring</span>
        </div>
      </div>

      {/* Health Score + KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Health Gauge */}
        <div className="lg:col-span-1 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-6 flex items-center justify-center">
          <HealthGauge score={healthScore} />
        </div>

        {/* KPI Cards */}
        <div className="lg:col-span-4 grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="Inventory Accuracy"
            value="99.2%"
            trend="up"
            change="+0.4%"
            data={accuracyTrend}
            color="#10b981"
            icon={CheckCircle2}
          />
          <KpiCard
            title="Mission Success Rate"
            value="94.1%"
            trend="up"
            change="+1.2%"
            data={missionTrend}
            color="#6366f1"
            icon={Activity}
          />
          <KpiCard
            title="Alert Resolution SLA"
            value="28 min avg"
            trend="down"
            change="-3min"
            data={slaTrend}
            color="#f59e0b"
            icon={Clock}
          />
          <KpiCard
            title="Robot Fleet Uptime"
            value="91.3%"
            trend="up"
            change="+2.1%"
            data={uptimeTrend}
            color="#8b5cf6"
            icon={Bot}
          />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alert Trend BarChart */}
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Alert Volume</p>
              <h2 className="text-base font-semibold text-slate-200 mt-0.5">Last 14 Days by Severity</h2>
            </div>
            <div className="flex gap-3 text-xs">
              {[['#ef4444', 'Critical'], ['#f97316', 'High'], ['#f59e0b', 'Medium'], ['#6b7280', 'Low']].map(([c, l]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: c }} />
                  <span className="text-slate-400">{l}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={alertTrendData} barSize={10} barGap={1}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="critical" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
              <Bar dataKey="high" stackId="a" fill="#f97316" />
              <Bar dataKey="medium" stackId="a" fill="#f59e0b" />
              <Bar dataKey="low" stackId="a" fill="#374151" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Robot Utilization Donut */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-6">
          <div className="mb-5">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Fleet Status</p>
            <h2 className="text-base font-semibold text-slate-200 mt-0.5">Robot Utilization</h2>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={robotUtilization} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                {robotUtilization.map((entry, index) => (
                  <Cell key={index} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {robotUtilization.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-slate-400">{item.name}</span>
                </div>
                <span className="text-xs font-semibold text-slate-200">{item.value} robots</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Critical Events Timeline */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Event Feed</p>
            <h2 className="text-base font-semibold text-slate-200 mt-0.5">Recent Critical Events</h2>
          </div>
          <span className="text-xs text-slate-500">Last 24 hours</span>
        </div>
        <div className="relative space-y-0">
          {criticalEvents.map((event, idx) => (
            <div key={event.id} className="relative flex gap-4 group">
              {/* Timeline line */}
              {idx < criticalEvents.length - 1 && (
                <div className="absolute left-5 top-10 h-full w-px bg-white/5" />
              )}
              <div className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${event.bgColor}`}>
                <event.icon className={`h-4 w-4 ${event.iconColor}`} />
              </div>
              <div className="flex-1 pb-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{event.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{event.desc}</p>
                  </div>
                  <span className="text-[11px] text-slate-600 whitespace-nowrap ml-4 mt-0.5">{event.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
