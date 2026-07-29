import React, { useState, useEffect } from 'react';
import { Users, Clock, CheckCircle2, ShieldAlert, Download, Filter, UserCheck } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { exportToCsv } from '../../utils/exportCsv';
import { adminApi, alertsApi } from '../../api/client';
import { MOCK_TEAM } from '../../api/mockData';

export default function TeamMonitor() {
  const [team, setTeam] = useState(MOCK_TEAM);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [openAlertsCount, setOpenAlertsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONLINE' | 'AWAY' | 'OFFLINE'>('ALL');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [logs, alerts] = await Promise.all([
          adminApi.getAuditLogs().catch(() => []),
          alertsApi.getAlerts().catch(() => []),
        ]);
        setAuditLogs(logs);
        setOpenAlertsCount(alerts.filter((a) => a.status === 'OPEN').length);
      } catch (err) {
        console.error('Failed to load team monitor data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredTeam = team.filter(t => statusFilter === 'ALL' || t.status === statusFilter);

  const avgResponseTimeMin = Math.round(team.reduce((acc, t) => acc + t.avg_response_time_min, 0) / (team.length || 1));
  const totalVerifications = team.reduce((acc, t) => acc + t.pending_tasks + 10, 0);

  const handleAssignTask = (operatorName: string) => {
    alert(`Priority verification task dispatched to ${operatorName}.`);
  };

  if (loading) return <div className="p-12 text-center text-slate-400">Loading team metrics...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Team Performance Monitor</h1>
          <p className="text-sm text-slate-400">Monitor operator SLA compliance, response times, and daily verification volumes.</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            const headers = ['Task ID', 'Actor', 'Action', 'Resource', 'Timestamp', 'Outcome'];
            const rows = auditLogs.map((l) => [l.id, l.actor, l.action, l.resource, l.time, l.outcome]);
            exportToCsv('team_performance_export', headers, rows);
          }}
          className="flex items-center gap-1.5 text-xs py-2 px-3 self-start sm:self-auto"
        >
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="Team Response Time"
          value={`${avgResponseTimeMin} min`}
          trendLabel="Target: <15 min"
          icon={<Clock className="w-5 h-5 text-indigo-400" />}
        />
        <StatCard
          label="Verifications Done"
          value={totalVerifications.toString()}
          trendLabel="Today's team volume"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
        />
        <StatCard
          label="Open Critical Alerts"
          value={openAlertsCount.toString()}
          trendLabel="Requires supervisor action"
          icon={<ShieldAlert className="w-5 h-5 text-red-400" />}
        />
      </div>

      {/* Operator Status Cards */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-100">Floor Staff Status</h2>
          <div className="flex gap-1.5">
            {(['ALL', 'ONLINE', 'AWAY', 'OFFLINE'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  statusFilter === st
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                    : 'bg-white/02 border-white/06 text-slate-400 hover:bg-white/05'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredTeam.map((member) => (
            <Card key={member.id} className="space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-300 flex items-center justify-center font-bold text-sm">
                      {member.display_name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-200">{member.display_name}</h3>
                      <p className="text-xs text-slate-400 font-mono text-[10px]">{member.email}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      member.status === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-400' :
                      member.status === 'AWAY' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-white/04 text-slate-400'
                    }`}
                  >
                    {member.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 py-2 border-t border-b border-white/06 text-xs text-slate-400">
                  <div>
                    <span>Pending Tasks:</span>
                    <span className="block font-semibold text-indigo-300 mt-0.5">{member.pending_tasks}</span>
                  </div>
                  <div>
                    <span>Avg SLA Time:</span>
                    <span className="block font-semibold text-slate-200 mt-0.5">{member.avg_response_time_min}m</span>
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  Last activity: <span className="text-slate-300 block font-medium mt-0.5">{member.last_action || 'Active'}</span>
                </div>
              </div>

              <Button
                variant="secondary"
                onClick={() => handleAssignTask(member.display_name)}
                className="w-full btn-sm flex items-center justify-center gap-1.5 mt-2"
              >
                <UserCheck className="w-3.5 h-3.5" /> Dispatch Task
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* SLA Task logs */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-100">Live Verification & Audit Trail Log</h2>
        <Card className="p-0 overflow-hidden">
          <Table
            headers={['Event ID', 'Actor', 'Activity Detail', 'Target Resource', 'Timestamp', 'Outcome']}
            rows={auditLogs.map((log) => [
              <span key={log.id} className="font-mono text-xs text-slate-400">{log.id}</span>,
              <span key={log.id} className="font-semibold text-slate-200">{log.actor}</span>,
              <span key={log.id} className="text-slate-300">{log.action}</span>,
              <span key={log.id} className="font-mono text-xs text-indigo-300">{log.resource}</span>,
              <span key={log.id} className="text-xs text-slate-400">{log.time}</span>,
              <span
                key={log.id}
                className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                  log.outcome === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}
              >
                {log.outcome.toUpperCase()}
              </span>,
            ])}
          />
        </Card>
      </div>
    </div>
  );
}

