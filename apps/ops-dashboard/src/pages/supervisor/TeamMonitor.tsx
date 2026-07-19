import React from 'react';
import { Users, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';

export default function TeamMonitor() {
  const teamMembers = [
    { name: 'John Doe', role: 'Operator', lastActive: 'Active now', tasksCompleted: 14, responseTime: '22m avg', status: 'Online' },
    { name: 'Alice Smith', role: 'Operator', lastActive: '5m ago', tasksCompleted: 10, responseTime: '30m avg', status: 'Online' },
    { name: 'Bob Johnson', role: 'Operator', lastActive: '1 hour ago', tasksCompleted: 6, responseTime: '45m avg', status: 'Offline' },
  ];

  const tasksLog = [
    { id: 'task-101', operator: 'John Doe', activity: 'Resolved Misplaced Alert at Bin A1-R2', time: '10m ago', sla: 'ON-TIME' },
    { id: 'task-102', operator: 'Alice Smith', activity: 'Verified Observation at Bin A2-R3', time: '20m ago', sla: 'ON-TIME' },
    { id: 'task-103', operator: 'John Doe', activity: 'Reported Aisle Obstruction in Aisle 3', time: '45m ago', sla: 'ON-TIME' },
    { id: 'task-104', operator: 'Bob Johnson', activity: 'Resolved Missing Alert at Bin B3-R2', time: '2h ago', sla: 'OVERDUE' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Team Performance Monitor</h1>
        <p className="text-sm text-slate-400">Monitor operator SLA compliance, response times, and daily verification volumes.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="Team Response Time"
          value="28 min"
          trendLabel="Target: <30 min"
          icon={<Clock className="w-5 h-5 text-indigo-400" />}
        />
        <StatCard
          label="Verifications Done"
          value="30"
          trendLabel="Today's team volume"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
        />
        <StatCard
          label="Overdue SLA Tasks"
          value="1"
          trendLabel="Requires immediate action"
          icon={<ShieldAlert className="w-5 h-5 text-red-400" />}
        />
      </div>

      {/* Operator Status Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-100">Floor Staff Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {teamMembers.map((member, idx) => (
            <Card key={idx} className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-300 flex items-center justify-center font-bold text-sm">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-200">{member.name}</h3>
                    <p className="text-xs text-slate-400">{member.role}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  member.status === 'Online' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/04 text-slate-400'
                }`}>
                  {member.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 py-2.5 border-t border-b border-white/06 text-xs text-slate-400">
                <div>
                  <span>Tasks Completed:</span>
                  <span className="block font-semibold text-slate-200 mt-0.5">{member.tasksCompleted}</span>
                </div>
                <div>
                  <span>Avg Response:</span>
                  <span className="block font-semibold text-slate-200 mt-0.5">{member.responseTime}</span>
                </div>
              </div>

              <div className="text-xs text-slate-500">
                Last active: <span className="text-slate-400">{member.lastActive}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* SLA Task logs */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-100">Live Verification Log</h2>
        <Card className="p-0 overflow-hidden">
          <Table
            headers={['Task ID', 'Operator', 'Activity Detail', 'Completed At', 'SLA Status']}
            rows={tasksLog.map(log => [
              <span key={log.id} className="font-mono text-xs text-slate-400">{log.id}</span>,
              <span key={log.id} className="font-semibold text-slate-200">{log.operator}</span>,
              <span key={log.id} className="text-slate-300">{log.activity}</span>,
              <span key={log.id} className="text-xs text-slate-400">{log.time}</span>,
              <span key={log.id} className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                log.sla === 'ON-TIME' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
              }`}>{log.sla}</span>
            ])}
          />
        </Card>
      </div>

    </div>
  );
}
