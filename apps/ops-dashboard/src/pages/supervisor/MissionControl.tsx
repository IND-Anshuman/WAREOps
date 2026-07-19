import React, { useState } from 'react';
import { Compass, Play, Pause, XCircle, Plus, Calendar, Compass as CompassIcon, RefreshCw } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { MOCK_MISSIONS } from '../../api/mockData';

export default function MissionControl() {
  const [missions, setMissions] = useState(MOCK_MISSIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Create mission states
  const [name, setName] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [zone, setZone] = useState('Zone A');

  const handleAction = (id: string, action: string) => {
    setMissions(prev => prev.map(m => {
      if (m.id === id) {
        if (action === 'PAUSE') return { ...m, status: 'CANCELLED' }; // represent pause/cancel
        if (action === 'RESUME') return { ...m, status: 'IN_PROGRESS' };
        return m;
      }
      return m;
    }));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newMission = {
      id: `mission-00${missions.length + 1}`,
      name,
      warehouse_id: 'wh-001',
      robot_id: 'robot-001',
      status: 'SCHEDULED' as const,
      priority: priority as any,
      progress_percent: 0,
      bins_scanned: 0,
      bins_total: 24,
      created_at: new Date().toISOString(),
    };
    setMissions([newMission, ...missions]);
    setIsModalOpen(false);
    setName('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Mission Control</h1>
          <p className="text-sm text-slate-400">Schedule inventory audits, track active robot positions, and configure scan priorities.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="primary" className="flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Schedule Audit
        </Button>
      </div>

      {/* Active Missions Card Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-100">Active Audits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {missions.filter(m => m.status === 'IN_PROGRESS').map(mission => (
            <Card key={mission.id} className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-slate-200">{mission.name}</h3>
                  <span className="text-[10px] text-indigo-400 font-mono">{mission.id}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-indigo-500/10 text-indigo-400 animate-pulse">
                  {mission.status}
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400 font-mono">
                  <span>Progress</span>
                  <span>{mission.progress_percent}%</span>
                </div>
                <div className="w-full bg-white/06 rounded-full h-2 overflow-hidden">
                  <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500" style={{ width: `${mission.progress_percent}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-2 border-t border-b border-white/06 text-xs text-slate-400">
                <div>
                  <span>Robot assigned:</span>
                  <span className="block font-semibold text-slate-200">{mission.robot_id || 'Unassigned'}</span>
                </div>
                <div>
                  <span>Bins scanned:</span>
                  <span className="block font-semibold text-slate-200">{mission.bins_scanned} / {mission.bins_total}</span>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button 
                  onClick={() => handleAction(mission.id, 'PAUSE')}
                  variant="secondary" 
                  className="btn-sm flex-1"
                >
                  <Pause className="w-3.5 h-3.5 mr-1" /> Pause Audit
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Scheduled Queue & History */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-100">Scheduled Audit Queue</h2>
        <Card className="p-0 overflow-hidden">
          <Table
            headers={['ID', 'Audit Name', 'Priority', 'Bins Code Count', 'Status', 'Actions']}
            rows={missions.filter(m => m.status !== 'IN_PROGRESS').map(m => [
              <span key={m.id} className="font-mono text-xs text-slate-400">{m.id}</span>,
              <span key={m.id} className="font-semibold text-slate-200">{m.name}</span>,
              <span key={m.id} className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                m.priority === 'HIGH' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'
              }`}>{m.priority}</span>,
              <span key={m.id} className="font-mono text-slate-300">{m.bins_total}</span>,
              <span key={m.id} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                m.status === 'SCHEDULED' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
              }`}>{m.status}</span>,
              <div key={m.id} className="flex gap-2">
                {m.status === 'SCHEDULED' && (
                  <Button 
                    onClick={() => handleAction(m.id, 'RESUME')}
                    variant="primary" 
                    className="btn-sm"
                  >
                    <Play className="w-3 h-3 mr-1" /> Run Now
                  </Button>
                )}
              </div>
            ])}
          />
        </Card>
      </div>

      {/* Create Mission Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Audit Mission">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Audit Mission Name"
            placeholder="e.g. Zone A Full Stock Count"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Target Zone</label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-slate-100 outline-none bg-slate-900 border border-white/08 focus:border-indigo-500/50"
              >
                <option value="Zone A">Zone A (Electronics)</option>
                <option value="Zone B">Zone B (Furniture)</option>
                <option value="Zone C">Zone C (Books)</option>
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-slate-100 outline-none bg-slate-900 border border-white/08 focus:border-indigo-500/50"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-white/06">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Schedule Mission
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
