import React from 'react';
import { Bot, Camera, Cpu, RefreshCw, Database, Monitor, ChevronRight } from 'lucide-react';

export const DataStreamPipeline: React.FC = () => {
  const pipelineSteps = [
    { label: 'AMR Fleet', icon: Bot, desc: 'LiDAR & QR Scans' },
    { label: 'Observation Service', icon: Camera, desc: 'Transactional Outbox' },
    { label: 'Kafka Event Bus', icon: Cpu, desc: 'Partitioned Streaming' },
    { label: 'Reconciliation', icon: RefreshCw, desc: 'Expected vs Observed' },
    { label: 'Redis Cache-Aside', icon: Database, desc: 'Sub-ms Spatial Lookup' },
    { label: 'Digital Twin Sync', icon: Monitor, desc: 'Socket.IO Delta Fan-Out' },
  ];

  return (
    <section className="relative z-10 py-16 px-4 max-w-6xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400">High-Throughput Data Stream</span>
        <h3 className="text-xl md:text-3xl font-extrabold text-white">End-to-End Pipeline Telemetry Flow</h3>
      </div>

      <div className="rounded-3xl p-1 bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl">
        <div className="rounded-[calc(1.5rem-0.25rem)] bg-slate-950/90 p-6 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[800px] gap-2 relative">
            
            {pipelineSteps.map((step, idx) => {
              const IconComp = step.icon;
              return (
                <React.Fragment key={idx}>
                  <div className="flex flex-col items-center text-center space-y-2 group">
                    <div className="h-12 w-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-indigo-400 group-hover:border-indigo-500/50 group-hover:bg-indigo-500/10 transition-all duration-300">
                      <IconComp className="h-6 w-6" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-200">{step.label}</h5>
                      <span className="text-[9px] font-mono text-slate-500">{step.desc}</span>
                    </div>
                  </div>

                  {idx < pipelineSteps.length - 1 && (
                    <div className="flex-1 flex items-center justify-center relative">
                      <div className="w-full h-0.5 bg-gradient-to-r from-indigo-500/20 via-cyan-500/40 to-indigo-500/20 relative overflow-hidden">
                        <div className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan-sweep" />
                      </div>
                      <ChevronRight className="h-4 w-4 text-cyan-400 shrink-0 -ml-2" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}

          </div>
        </div>
      </div>
    </section>
  );
};
