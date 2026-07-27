import React from 'react';
import { Terminal, Activity, ShieldCheck } from 'lucide-react';

const ARCHITECTURE_LOGS = [
  { time: '00:00:01', service: 'kafka-bus', msg: 'Topic [observation.raw] schema validated (Avro v2)', type: 'info' },
  { time: '00:00:02', service: 'amr-agent', msg: 'Telemetry heartbeat published (Topic: robot.telemetry)', type: 'success' },
  { time: '00:00:03', service: 'reconciliation', msg: 'Discrepancy engine evaluated bin matrix (Postgres ACID)', type: 'success' },
  { time: '00:00:04', service: 'twin-sync', msg: 'State delta broadcast via Redis Pub/Sub WebSocket gateway', type: 'info' },
  { time: '00:00:05', service: 'alert-service', msg: 'High-priority mismatch published to [alert.lifecycle]', type: 'warning' },
];

export const EventStreamTerminal: React.FC = () => {
  return (
    <div className="rounded-3xl p-1 bg-white/[0.04] border border-white/[0.1] backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] w-full max-w-sm">
      <div className="rounded-[calc(1.5rem-0.25rem)] bg-slate-950/90 p-4 space-y-3">
        
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-white/06 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400 ml-1">kafka://ops.stream.bus</span>
          </div>

          <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
            Avro Schema
          </span>
        </div>

        {/* Console Log Rows */}
        <div className="space-y-2 font-mono text-[10px] min-h-[160px]">
          {ARCHITECTURE_LOGS.map((log, idx) => (
            <div 
              key={idx} 
              className="flex items-start gap-2 p-1.5 rounded-lg bg-white/[0.015] border border-white/03 transition-all duration-300"
            >
              <span className="text-slate-500 shrink-0">{log.time}</span>
              <span className={`px-1 rounded text-[9px] font-bold uppercase shrink-0 ${
                log.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                log.type === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
              }`}>
                {log.service}
              </span>
              <span className="text-slate-300 truncate">{log.msg}</span>
            </div>
          ))}
        </div>

        {/* Footer Status */}
        <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 pt-1 border-t border-white/04">
          <span className="flex items-center gap-1.5">
            <Activity className="h-3 w-3 text-cyan-400" /> Event Partitioning: 24 Brokers
          </span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" /> OTEL Instrumented
          </span>
        </div>

      </div>
    </div>
  );
};
