import React, { useState, useEffect } from 'react';
import { 
  Bot, MapPin, Barcode, Database, Activity, RefreshCw, 
  CheckCircle2, Bell, Shield, ArrowRight
} from 'lucide-react';

const MISSION_STAGES = [
  { id: 'assign', label: 'Mission Assigned', icon: Shield, desc: 'Target audit vector generated' },
  { id: 'deploy', label: 'AMR Deployment', icon: Bot, desc: 'Node AMR-01 dispatched to Zone A' },
  { id: 'navigate', label: 'Navigation & Telemetry', icon: MapPin, desc: 'LiDAR pathing & coordinate sync' },
  { id: 'qr_scan', label: 'QR Observation', icon: Barcode, desc: 'Frame capture at Bin A1-R3-S2-B2' },
  { id: 'event', label: 'Kafka Event Stream', icon: Activity, desc: 'Payload streamed to observation bus' },
  { id: 'reconcile', label: 'State Reconciliation', icon: RefreshCw, desc: 'Expected vs Observed calculation' },
  { id: 'twin_sync', label: 'Digital Twin Update', icon: Database, desc: 'Real-time WebSocket delta broadcast' },
  { id: 'alert_health', label: 'Health Score Updated', icon: CheckCircle2, desc: '99.98% Accuracy score logged' },
];

export const MissionSequenceHUD: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % MISSION_STAGES.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const CurrentIcon = MISSION_STAGES[activeStep].icon;

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl p-1.5 bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl shadow-2xl">
      <div className="rounded-[calc(1.5rem-0.375rem)] bg-slate-950/80 p-4 md:p-6 space-y-4">
        
        {/* Header HUD Status */}
        <div className="flex items-center justify-between border-b border-white/06 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-300">
              Autonomous Closed-Loop Audit Sequence
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            Step {activeStep + 1} of {MISSION_STAGES.length}
          </span>
        </div>

        {/* Current Active Step Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/[0.02] border border-white/[0.06] p-4 rounded-2xl">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <CurrentIcon className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-wide">{MISSION_STAGES[activeStep].label}</h4>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{MISSION_STAGES[activeStep].desc}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              STATE MATCHED
            </span>
          </div>
        </div>

        {/* Progress Timeline Nodes */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2 pt-2">
          {MISSION_STAGES.map((stage, idx) => {
            const isCompleted = idx < activeStep;
            const isCurrent = idx === activeStep;

            return (
              <button
                key={stage.id}
                onClick={() => setActiveStep(idx)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all duration-500 group
                  ${isCurrent 
                    ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300 shadow-lg shadow-indigo-500/10 scale-105' 
                    : isCompleted 
                    ? 'bg-white/[0.02] border-white/08 text-emerald-400/80' 
                    : 'bg-white/[0.01] border-white/04 text-slate-600'}`}
              >
                <div className={`h-6 w-6 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold border transition-colors
                  ${isCurrent 
                    ? 'bg-indigo-500 text-white border-indigo-400' 
                    : isCompleted 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                    : 'bg-white/05 text-slate-500 border-white/10'}`}
                >
                  {idx + 1}
                </div>
                <span className="text-[9px] font-semibold tracking-tight truncate w-full hidden sm:block">
                  {stage.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};
