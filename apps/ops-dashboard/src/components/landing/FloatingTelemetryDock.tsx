import React from 'react';
import { Bot, BatteryCharging, Radio, ShieldCheck } from 'lucide-react';

export const FloatingTelemetryDock: React.FC = () => {
  return (
    <div className="rounded-3xl p-1 bg-white/[0.04] border border-white/[0.1] backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] w-full max-w-xs transition-all hover:border-indigo-500/30 group">
      <div className="rounded-[calc(1.5rem-0.25rem)] bg-slate-950/90 p-4 space-y-3.5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/06 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-100 font-mono">AMR-NODE-01</h4>
              <span className="text-[9px] text-slate-400 font-mono">ROS 2 Navigation Stack</span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase">ONLINE</span>
          </div>
        </div>

        {/* Telemetry Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-xl bg-white/[0.02] border border-white/04 space-y-0.5">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Protocol</span>
            <span className="font-mono font-bold text-indigo-300">gRPC / Protobuf</span>
          </div>

          <div className="p-2 rounded-xl bg-white/[0.02] border border-white/04 space-y-0.5">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Sensors</span>
            <div className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
              <span className="font-mono font-bold text-slate-200">LiDAR 3D</span>
            </div>
          </div>
        </div>

        {/* System Specs */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[10px] font-mono">
            <span className="text-slate-400">Telemetry Target SLA</span>
            <span className="text-cyan-400 font-bold">&lt; 15 ms</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/05 overflow-hidden p-[1px] border border-white/10">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 shadow-[0_0_10px_rgba(99,102,241,0.5)] w-[85%]"
            />
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 pt-1 border-t border-white/04">
          <span className="flex items-center gap-1">
            <Radio className="h-3 w-3 text-indigo-400" /> Topic: robot.telemetry
          </span>
          <span>Sample Rate: 60Hz</span>
        </div>

      </div>
    </div>
  );
};
