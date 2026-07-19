import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Compass, Users, Clock, ArrowRight, Play, Eye } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { MOCK_ALERTS, MOCK_MISSIONS } from '../../api/mockData';

export default function SupervisorDashboard() {
  const navigate = useNavigate();

  // Compute stat metrics from mock data
  const openAlerts = MOCK_ALERTS.filter(a => a.status === 'OPEN').length;
  const activeMissions = MOCK_MISSIONS.filter(m => m.status === 'IN_PROGRESS').length;
  const onlineOperators = 3;
  const avgResponseTime = '28 min';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Supervisor Control Center</h1>
        <p className="text-sm text-slate-400">Real-time control panel for warehouse operations, robot missions, and operator assignments.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Active Alerts"
          value={openAlerts.toString()}
          trendLabel="Triage required"
          icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
        />
        <StatCard
          label="Active Missions"
          value={activeMissions.toString()}
          trendLabel="Running audits"
          icon={<Compass className="w-5 h-5 text-indigo-400" />}
        />
        <StatCard
          label="Operators Online"
          value={onlineOperators.toString()}
          trendLabel="Floor coverage"
          icon={<Users className="w-5 h-5 text-emerald-400" />}
        />
        <StatCard
          label="Avg Response Time"
          value={avgResponseTime}
          trendLabel="SLA Compliance: 94%"
          icon={<Clock className="w-5 h-5 text-blue-400" />}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Missions overview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-100">Live Robot Audits</h2>
            <button 
              onClick={() => navigate('/supervisor/missions')} 
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Mission Control <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <Card className="p-0 overflow-hidden">
            <Table
              headers={['Mission Name', 'Progress', 'Bins Scanned', 'Status']}
              rows={MOCK_MISSIONS.slice(0, 3).map(m => [
                <div key={m.id} className="font-semibold text-slate-200">{m.name}</div>,
                <div key={m.id} className="w-full max-w-[150px] flex items-center gap-3">
                  <div className="w-full bg-white/06 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${m.progress_percent}%` }} />
                  </div>
                  <span className="text-xs font-mono text-slate-400">{m.progress_percent}%</span>
                </div>,
                <div key={m.id} className="text-slate-300 font-mono">{m.bins_scanned} / {m.bins_total}</div>,
                <span key={m.id} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  m.status === 'IN_PROGRESS' ? 'bg-indigo-500/10 text-indigo-400 animate-pulse' :
                  m.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                  'bg-white/04 text-slate-400'
                }`}>
                  {m.status}
                </span>
              ])}
            />
          </Card>
        </div>

        {/* Team Live panel */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-100">Team Status</h2>
            <button 
              onClick={() => navigate('/supervisor/team')} 
              className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1"
            >
              Manage Team <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <Card className="space-y-4">
            {[
              { name: 'John Doe', status: 'Online', task: 'Reviewing Bin A1-R2', time: 'Active now' },
              { name: 'Alice Smith', status: 'Online', task: 'Idle', time: '5m ago' },
              { name: 'Bob Johnson', status: 'Offline', task: 'On break', time: '1h ago' }
            ].map((op, idx) => (
              <div key={idx} className="flex items-center justify-between pb-3.5 border-b border-white/06 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/06 flex items-center justify-center font-bold text-xs text-indigo-300">
                    {op.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">{op.name}</h4>
                    <p className="text-xs text-slate-400">{op.task}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                    op.status === 'Online' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/04 text-slate-400'
                  }`}>
                    {op.status}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">{op.time}</span>
                </div>
              </div>
            ))}
          </Card>
        </div>

      </div>

      {/* Critical alerts section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-100">Critical Warnings & Anomalies</h2>
          <button 
            onClick={() => navigate('/supervisor/alerts')} 
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
          >
            Triage Desk <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {MOCK_ALERTS.slice(0, 2).map(alert => (
            <Card key={alert.id} className="border-red-500/20 bg-red-500/02 flex justify-between items-start gap-4">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  {alert.severity}
                </span>
                <h4 className="font-semibold text-slate-200">{alert.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Mismatch found at location <span className="font-mono text-indigo-300 font-semibold">{alert.bin_code}</span>. Expected product {alert.expected_sku} but found {alert.observed_sku}.
                </p>
              </div>
              <button 
                onClick={() => navigate(`/supervisor/alerts`)}
                className="btn-icon text-slate-400 hover:text-slate-200 flex-shrink-0"
              >
                <Eye className="w-4 h-4" />
              </button>
            </Card>
          ))}
        </div>
      </div>

    </div>
  );
}
