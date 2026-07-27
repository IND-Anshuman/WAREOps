import React from 'react';
import { ShieldCheck, Zap, Bot, Database } from 'lucide-react';

export const SystemMetricsBand: React.FC = () => {
  const metrics = [
    {
      label: 'ACID Reconciliation Engine',
      value: 'PostgreSQL 16',
      change: 'Strict Schema Compliance',
      icon: ShieldCheck,
      color: 'from-emerald-500/20 to-teal-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
    },
    {
      label: 'Event Pipeline Latency',
      value: '< 50ms',
      change: 'Kafka 24-Partition Bus',
      icon: Zap,
      color: 'from-indigo-500/20 to-cyan-500/10',
      border: 'border-indigo-500/30',
      text: 'text-indigo-400',
    },
    {
      label: 'AMR Telemetry Ingestion',
      value: 'ROS 2 / Protobuf',
      change: '60Hz LiDAR Streams',
      icon: Bot,
      color: 'from-cyan-500/20 to-blue-500/10',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
    },
    {
      label: 'Security & Access Control',
      value: 'OAuth2 / JWT',
      change: 'Redis Session Revocation',
      icon: Database,
      color: 'from-purple-500/20 to-indigo-500/10',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
    },
  ];

  return (
    <section className="relative z-10 py-16 px-4 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {metrics.map((m, idx) => {
          const IconComponent = m.icon;
          return (
            <div
              key={idx}
              className="rounded-3xl p-1 bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl transition-all duration-500 hover:border-white/20 hover:-translate-y-1 group"
            >
              <div className="rounded-[calc(1.5rem-0.25rem)] bg-slate-950/80 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`h-10 w-10 rounded-2xl bg-gradient-to-br ${m.color} border ${m.border} flex items-center justify-center ${m.text}`}>
                    <IconComponent className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{m.change}</span>
                </div>

                <div>
                  <h3 className="text-xl md:text-2xl font-extrabold text-white font-mono tracking-tight">{m.value}</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-1">{m.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
