import React, { useState, useEffect } from 'react';
import { Play, Pause, Plus, Calendar, Compass, RefreshCw, Download } from 'lucide-react';
import { exportToCsv } from '../../utils/exportCsv';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { missionsApi, robotsApi } from '../../api/client';
import type { Mission, Robot } from '../../types';

export default function MissionControl() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [robots, setRobots] = useState<Robot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchMissionsAndRobots = async () => {
    try {
      setLoading(true);
      const [mList, rList] = await Promise.all([
        missionsApi.getMissions().catch(() => []),
        robotsApi.getRobots().catch(() => []),
      ]);
      setMissions(mList);
      setRobots(rList);
    } catch (err) {
      console.error('Failed to load missions/robots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissionsAndRobots();
  }, []);
  
  // Create mission states
  const [name, setName] = useState('');
  const [isNameCustom, setIsNameCustom] = useState(false);
  const [priority, setPriority] = useState('MEDIUM');
  const [auditScope, setAuditScope] = useState<'FULL' | 'ZONE' | 'AISLE' | 'RACK'>('ZONE');
  const [zone, setZone] = useState('Zone A');
  const [targetAisle, setTargetAisle] = useState('Aisle 1');
  const [targetRack, setTargetRack] = useState('Rack A1');
  const [assignedRobotId, setAssignedRobotId] = useState('robot-001');

  // Auto-generate name based on configuration if it hasn't been custom edited
  useEffect(() => {
    if (isNameCustom) return;
    let autoName = '';
    if (auditScope === 'FULL') {
      autoName = 'Full Warehouse Audit';
    } else if (auditScope === 'ZONE') {
      autoName = `${zone} Full Audit`;
    } else if (auditScope === 'AISLE') {
      autoName = `${targetAisle} Spot Check`;
    } else if (auditScope === 'RACK') {
      autoName = `${targetRack} Detail Scan`;
    }
    setName(autoName);
  }, [auditScope, zone, targetAisle, targetRack, isNameCustom]);

  const handleAction = async (id: string, action: string) => {
    try {
      if (action === 'PAUSE') {
        await missionsApi.pauseMission(id);
      } else if (action === 'RESUME') {
        await missionsApi.startMission(id);
      }
      await fetchMissionsAndRobots();
    } catch (err) {
      console.error('Failed to execute mission action:', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Determine target bin count
    let binsTotal = 24;
    let targetScopeId = 'All';
    if (auditScope === 'FULL') {
      binsTotal = 300;
      targetScopeId = 'All';
    } else if (auditScope === 'ZONE') {
      targetScopeId = zone;
      if (zone === 'Zone A') binsTotal = 80;
      else if (zone === 'Zone B') binsTotal = 150;
      else binsTotal = 70;
    } else if (auditScope === 'AISLE') {
      targetScopeId = targetAisle;
      binsTotal = 24;
    } else if (auditScope === 'RACK') {
      targetScopeId = targetRack;
      binsTotal = 8;
    }

    const assignedRobot = robots.find(r => r.id === assignedRobotId);

    try {
      await missionsApi.createMission({
        name,
        warehouse_id: 'wh-001',
        robot_id: assignedRobotId,
        robot_name: assignedRobot?.name || 'Argus',
        priority: priority as any,
        bins_total: binsTotal,
        audit_scope: auditScope,
        target_scope_id: targetScopeId,
      });

      await fetchMissionsAndRobots();
      setIsModalOpen(false);
      setName('');
      setIsNameCustom(false);
    } catch (err) {
      console.error('Failed to create mission:', err);
      alert('Error scheduling audit mission.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Mission Control</h1>
          <p className="text-sm text-slate-400">Schedule inventory audits, track active robot positions, and configure scan priorities.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              const headers = ['Mission ID', 'Name', 'Scope', 'Target Scope ID', 'Target Bins', 'Assigned Robot', 'Status', 'Progress %'];
              const rows = missions.map(m => [m.id, m.name, m.audit_scope || 'ZONE', m.target_scope_id || 'Zone A', m.bins_total, m.robot_name || 'Unassigned', m.status, m.progress_percent]);
              exportToCsv('missions_export', headers, rows);
            }}
            className="flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button onClick={() => setIsModalOpen(true)} variant="primary" className="flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Schedule Audit
          </Button>
        </div>
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
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-indigo-400 font-mono">{mission.id}</span>
                    {mission.audit_scope && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/05 border border-white/08 text-slate-400 font-semibold font-mono uppercase">
                        {mission.audit_scope}: {mission.target_scope_id}
                      </span>
                    )}
                  </div>
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
                  <span className="block font-semibold text-slate-200">{mission.robot_name || mission.robot_id || 'Unassigned'}</span>
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
            headers={['ID', 'Audit Name', 'Scope', 'Priority', 'Target Bins', 'Assigned Robot', 'Status', 'Actions']}
            rows={missions.filter(m => m.status !== 'IN_PROGRESS').map(m => [
              <span key={m.id} className="font-mono text-xs text-slate-400">{m.id}</span>,
              <div key={m.id} className="flex flex-col">
                <span className="font-semibold text-slate-200">{m.name}</span>
                <span className="text-[10px] text-slate-500">{new Date(m.created_at).toLocaleDateString()}</span>
              </div>,
              <span key={m.id} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/05 border border-white/08 text-slate-350 font-mono uppercase">
                {m.audit_scope ? `${m.audit_scope}: ${m.target_scope_id}` : 'ZONE: Zone A'}
              </span>,
              <span key={m.id} className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                m.priority === 'CRITICAL' ? 'bg-red-500/10 text-red-400' :
                m.priority === 'HIGH' ? 'bg-orange-500/10 text-orange-400' : 
                m.priority === 'MEDIUM' ? 'bg-indigo-500/10 text-indigo-400' :
                'bg-slate-500/10 text-slate-400'
              }`}>{m.priority}</span>,
              <span key={m.id} className="font-mono text-slate-300">{m.bins_total} bins</span>,
              <span key={m.id} className="text-xs text-slate-400 font-medium">{m.robot_name || 'Unassigned'}</span>,
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
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Audit Mission" position="top-center">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Audit Mission Name"
            placeholder="e.g. Zone A Full Stock Count"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setIsNameCustom(true);
            }}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Audit Scope</label>
              <select
                value={auditScope}
                onChange={(e) => setAuditScope(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-slate-100 outline-none bg-slate-900 border border-white/08 focus:border-indigo-500/50"
              >
                <option value="FULL">Full Warehouse</option>
                <option value="ZONE">Specific Zone</option>
                <option value="AISLE">Specific Aisle</option>
                <option value="RACK">Specific Rack</option>
              </select>
            </div>

            {/* Target Selectors */}
            {auditScope === 'ZONE' && (
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
            )}

            {auditScope === 'AISLE' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Target Aisle</label>
                <select
                  value={targetAisle}
                  onChange={(e) => setTargetAisle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-slate-100 outline-none bg-slate-900 border border-white/08 focus:border-indigo-500/50"
                >
                  <option value="Aisle 1">Aisle 1</option>
                  <option value="Aisle 2">Aisle 2</option>
                  <option value="Aisle 3">Aisle 3</option>
                  <option value="Aisle 4">Aisle 4</option>
                  <option value="Aisle 5">Aisle 5</option>
                </select>
              </div>
            )}

            {auditScope === 'RACK' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Target Rack</label>
                <select
                  value={targetRack}
                  onChange={(e) => setTargetRack(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-slate-100 outline-none bg-slate-900 border border-white/08 focus:border-indigo-500/50"
                >
                  <option value="Rack A1">Rack A1</option>
                  <option value="Rack A2">Rack A2</option>
                  <option value="Rack A3">Rack A3</option>
                  <option value="Rack B1">Rack B1</option>
                  <option value="Rack B2">Rack B2</option>
                  <option value="Rack C1">Rack C1</option>
                </select>
              </div>
            )}
          </div>

          {/* Conditional Scope Details */}
          {auditScope === 'FULL' && (
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.04] p-3 text-xs text-slate-400">
              This will compile a complete audit route covering all active warehouse zones and racks. Estimated target: 300 bins.
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Assign Robot</label>
              <select
                value={assignedRobotId}
                onChange={(e) => setAssignedRobotId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-slate-100 outline-none bg-slate-900 border border-white/08 focus:border-indigo-500/50"
              >
                {robots.map(robot => (
                  <option key={robot.id} value={robot.id}>{robot.name} ({robot.status})</option>
                ))}
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
                <option value="CRITICAL">Critical</option>
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
