import React, { useState } from 'react';
import { 
  Cpu, Bot, Database, Activity, RefreshCw, Bell, Shield, MapPin, ArrowRight
} from 'lucide-react';

interface ArchNode {
  id: string;
  name: string;
  category: string;
  icon: any;
  desc: string;
  guarantees: string[];
}

const ARCH_NODES: ArchNode[] = [
  {
    id: 'mission',
    name: 'Mission Control',
    category: 'Fleet Orchestration',
    icon: MapPin,
    desc: 'Plans spatial paths, auto-names spot checks, and assigns active AMRs to target warehouse zones.',
    guarantees: ['State machine validations', '30s heartbeat watchdog', 'Dynamic bin target calculations'],
  },
  {
    id: 'digital_twin',
    name: 'Digital Twin Sync',
    category: 'Real-Time State',
    icon: Database,
    desc: 'Broadcasting live Socket.IO WebSocket deltas to operational dashboard rooms.',
    guarantees: ['Sub-15ms WebSocket fan-out', 'Redis cache-aside caching', 'ES6 Map in-memory store'],
  },
  {
    id: 'fleet',
    name: 'Robot Fleet Engine',
    category: 'Edge AMRs',
    icon: Bot,
    desc: 'Autonomous mobile robots with LiDAR, wheel encoders, and offline SQLite buffering.',
    guarantees: ['Zero data-loss offline buffer', '2-meter proximity threshold', 'Battery telemetry pings'],
  },
  {
    id: 'observation',
    name: 'Observation Service',
    category: 'Data Ingestion',
    icon: Activity,
    desc: 'Ingests edge camera frames, archives JPEGs to MinIO, and publishes outbox events.',
    guarantees: ['Transactional outbox pattern', 'MinIO object storage', 'Strict FK relation to observation ID'],
  },
  {
    id: 'reconciliation',
    name: 'Reconciliation Engine',
    category: 'State Comparison',
    icon: RefreshCw,
    desc: 'Compares observed shelf QR scans against expected WMS inventory records.',
    guarantees: ['Automated discrepancy categorization', 'Misplaced/Missing/Quantity audit states'],
  },
  {
    id: 'kafka',
    name: 'Kafka Event Bus',
    category: 'Streaming Conduit',
    icon: Cpu,
    desc: 'Enterprise pub/sub event pipeline streaming raw observations and telemetry topics.',
    guarantees: ['Partitioned topic queues', 'Transactional outbox publisher', 'High-throughput payload streaming'],
  },
  {
    id: 'alerts',
    name: 'Alert Lifecycle Engine',
    category: 'Incident Management',
    icon: Bell,
    desc: 'Monitors discrepancy thresholds and dispatches user notifications.',
    guarantees: ['Multi-channel alert routing', 'State lifecycle transitions', 'Role-based alert views'],
  },
  {
    id: 'security',
    name: 'Enterprise Security & RBAC',
    category: 'Access Control',
    icon: Shield,
    desc: 'Enforces JWT session validation, TOTP MFA verification, and role permissions.',
    guarantees: ['Refresh Token Rotation (RTR)', 'TOTP MFA verification', 'Strict RBAC role guards'],
  },
];

export const PlatformArchitectureMap: React.FC = () => {
  const [activeNode, setActiveNode] = useState<ArchNode>(ARCH_NODES[0]);

  return (
    <section id="architecture" className="relative z-10 py-24 px-4 max-w-6xl mx-auto space-y-12">
      {/* Title */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-mono font-semibold uppercase tracking-[0.2em]">
          <Cpu className="h-3.5 w-3.5" /> Platform Architecture Map
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
          Decoupled Microservice Intelligence
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Select any architectural node to inspect its execution guarantees, streaming conduits, and microservice responsibilities.
        </p>
      </div>

      {/* Grid of Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {ARCH_NODES.map((node) => {
          const IconComp = node.icon;
          const isSelected = activeNode.id === node.id;

          return (
            <button
              key={node.id}
              onClick={() => setActiveNode(node)}
              className={`rounded-3xl p-1 text-left transition-all duration-500 ${
                isSelected 
                  ? 'bg-gradient-to-tr from-indigo-500/30 to-cyan-500/20 border border-indigo-500/50 shadow-2xl scale-[1.02]' 
                  : 'bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/15'
              }`}
            >
              <div className="rounded-[calc(1.5rem-0.25rem)] bg-slate-950/80 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`h-10 w-10 rounded-2xl flex items-center justify-center border ${
                    isSelected ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300' : 'bg-white/05 border-white/10 text-slate-400'
                  }`}>
                    <IconComp className="h-5 w-5" />
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">{node.category}</span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-white tracking-wide">{node.name}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">{node.desc}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Node Technical Inspector Panel */}
      <div className="rounded-3xl p-1 bg-gradient-to-r from-indigo-500/20 via-cyan-500/20 to-purple-500/20 border border-white/10 backdrop-blur-2xl shadow-2xl animate-fade-in">
        <div className="rounded-[calc(1.5rem-0.25rem)] bg-slate-950/90 p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/08 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                {React.createElement(activeNode.icon, { className: "h-6 w-6" })}
              </div>
              <div>
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest">{activeNode.category}</span>
                <h3 className="text-2xl font-bold text-white">{activeNode.name}</h3>
              </div>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              Microservice Operational
            </span>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed font-sans">{activeNode.desc}</p>

          <div className="space-y-2 pt-2">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">Architectural Guarantees:</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {activeNode.guarantees.map((g, i) => (
                <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/06 text-xs text-slate-200 font-mono">
                  <ArrowRight className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span>{g}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
