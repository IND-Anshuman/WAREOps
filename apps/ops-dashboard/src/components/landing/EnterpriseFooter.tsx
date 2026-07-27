import React from 'react';
import { Bot, ShieldCheck, Cpu, Database, Activity } from 'lucide-react';

export const EnterpriseFooter: React.FC = () => {
  return (
    <footer className="relative z-10 border-t border-white/08 bg-slate-950/90 pt-16 pb-12 px-4">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Upper grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 p-[1px] flex items-center justify-center">
                <div className="h-full w-full bg-slate-950 rounded-full flex items-center justify-center">
                  <Bot className="h-3.5 w-3.5 text-indigo-400" />
                </div>
              </div>
              <span className="text-base font-extrabold text-white tracking-tight font-mono">WAREOps</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Autonomous Warehouse Intelligence Platform maintaining continuous inventory digital twins through mobile auditing robotics.
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">Microservices Stack</h5>
            <ul className="space-y-1 text-xs text-slate-400 font-mono">
              <li>• Auth & Identity Service (:8000)</li>
              <li>• Topology Spatial Service (:8001)</li>
              <li>• Mission Route Service (:8002)</li>
              <li>• Observation Engine (:8003)</li>
              <li>• Reconciliation Service (:8004)</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">Event Conduits</h5>
            <ul className="space-y-1 text-xs text-slate-400 font-mono">
              <li>• Kafka Event Stream Bus</li>
              <li>• Redis Cache-Aside & Pub/Sub</li>
              <li>• WebSocket Digital Twin (:8006)</li>
              <li>• PostgreSQL 16 Relational DB</li>
              <li>• MinIO Object Storage</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">Operational Health</h5>
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/06 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-emerald-400">All Microservices Online</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 block">System Version 2.4.0-RELEASE</span>
            </div>
          </div>
        </div>

        {/* Lower bar */}
        <div className="pt-8 border-t border-white/06 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-slate-500">
          <span>© 2026 WAREOps Autonomous Intelligence. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-300 cursor-pointer">Security Protocol</span>
            <span className="hover:text-slate-300 cursor-pointer">Privacy Matrix</span>
            <span className="hover:text-slate-300 cursor-pointer">RBAC Standards</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
