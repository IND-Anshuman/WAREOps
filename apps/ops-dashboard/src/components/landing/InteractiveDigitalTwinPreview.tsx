import React, { useState } from 'react';
import { Database, Search, ShieldCheck, AlertTriangle, Lock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BinNode {
  code: string;
  status: 'VERIFIED' | 'MISMATCH' | 'MISSING' | 'CLEARED';
  expectedSku: string;
  observedSku: string;
  confidence: number;
}

const SAMPLE_BINS: BinNode[] = [
  { code: 'A1-R1-S1-B1', status: 'VERIFIED', expectedSku: 'SKU-ELEC-001', observedSku: 'SKU-ELEC-001', confidence: 99.8 },
  { code: 'A1-R1-S1-B2', status: 'VERIFIED', expectedSku: 'SKU-ELEC-002', observedSku: 'SKU-ELEC-002', confidence: 99.4 },
  { code: 'A1-R1-S2-B1', status: 'MISMATCH', expectedSku: 'SKU-FURN-001', observedSku: 'SKU-BOOK-002', confidence: 88.2 },
  { code: 'A1-R2-S1-B1', status: 'VERIFIED', expectedSku: 'SKU-TOOL-001', observedSku: 'SKU-TOOL-001', confidence: 99.9 },
  { code: 'A1-R2-S2-B2', status: 'MISSING', expectedSku: 'SKU-MED-050', observedSku: 'EMPTY_BIN', confidence: 94.1 },
  { code: 'A1-R3-S1-B1', status: 'VERIFIED', expectedSku: 'SKU-TOY-101', observedSku: 'SKU-TOY-101', confidence: 99.7 },
  { code: 'A1-R3-S2-B1', status: 'VERIFIED', expectedSku: 'SKU-CONS-001', observedSku: 'SKU-CONS-001', confidence: 99.5 },
  { code: 'A1-R4-S1-B2', status: 'VERIFIED', expectedSku: 'SKU-CONS-002', observedSku: 'SKU-CONS-002', confidence: 99.6 },
];

export const InteractiveDigitalTwinPreview: React.FC = () => {
  const [selectedBin, setSelectedBin] = useState<BinNode>(SAMPLE_BINS[2]);
  const navigate = useNavigate();

  return (
    <section id="spatial-twin" className="relative z-10 py-24 px-4 max-w-6xl mx-auto space-y-8">
      {/* Title */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-mono font-semibold uppercase tracking-[0.2em]">
          <Database className="h-3.5 w-3.5" /> Spatial Digital Twin Engine
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
          Real-Time 3D Spatial Reconstruction
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Every AMR observation continuously reconciles expected WMS records against physical shelf state.
        </p>
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Spatial Grid Visualizer */}
        <div className="lg:col-span-2 rounded-3xl p-1 bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl">
          <div className="rounded-[calc(1.5rem-0.25rem)] bg-slate-950/90 p-6 space-y-6">
            
            <div className="flex items-center justify-between border-b border-white/06 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-mono font-bold text-slate-200">Zone A • Shelf Matrix View</span>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-mono">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Verified
                </span>
                <span className="flex items-center gap-1.5 text-red-400">
                  <span className="w-2 h-2 rounded-full bg-red-500" /> Mismatch
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Missing
                </span>
              </div>
            </div>

            {/* Interactive Grid Map */}
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white/[0.015] border border-white/04">
              {SAMPLE_BINS.map((bin) => {
                const isSelected = selectedBin.code === bin.code;
                const colorBg = 
                  bin.status === 'VERIFIED' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
                  bin.status === 'MISMATCH' ? 'bg-red-500/10 border-red-500/40 text-red-300 animate-pulse' :
                  'bg-amber-500/10 border-amber-500/30 text-amber-300';

                return (
                  <button
                    key={bin.code}
                    onClick={() => setSelectedBin(bin)}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all duration-300 group ${colorBg} ${
                      isSelected ? 'ring-2 ring-indigo-500 scale-105 shadow-xl' : 'hover:scale-[1.02]'
                    }`}
                  >
                    <span className="text-[10px] font-mono font-bold">{bin.code}</span>
                    <span className="text-[9px] font-mono mt-1 opacity-70 truncate w-full">{bin.expectedSku}</span>
                  </button>
                );
              })}
            </div>

          </div>
        </div>

        {/* Right: Bin Inspector Panel */}
        <div className="rounded-3xl p-1 bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl">
          <div className="rounded-[calc(1.5rem-0.25rem)] bg-slate-950/90 p-6 space-y-5">
            
            <div className="flex items-center justify-between border-b border-white/06 pb-3">
              <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Search className="h-4 w-4" /> Node Telemetry Inspector
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/05 text-slate-400">
                {selectedBin.code}
              </span>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/04 space-y-1">
                <span className="text-[9px] text-slate-500 uppercase tracking-widest block">Audit Status</span>
                <span className={`text-sm font-bold flex items-center gap-1.5 ${
                  selectedBin.status === 'VERIFIED' ? 'text-emerald-400' :
                  selectedBin.status === 'MISMATCH' ? 'text-red-400' : 'text-amber-400'
                }`}>
                  {selectedBin.status === 'VERIFIED' && <ShieldCheck className="h-4 w-4" />}
                  {selectedBin.status === 'MISMATCH' && <AlertTriangle className="h-4 w-4" />}
                  {selectedBin.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/04 space-y-1">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest block">Expected SKU</span>
                  <span className="font-bold text-slate-200 text-[11px]">{selectedBin.expectedSku}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/04 space-y-1">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest block">Observed SKU</span>
                  <span className="font-bold text-indigo-300 text-[11px]">{selectedBin.observedSku}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/04 space-y-1">
                <div className="flex justify-between">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest">LiDAR Decode Confidence</span>
                  <span className="text-cyan-400 font-bold">{selectedBin.confidence}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/05 overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${selectedBin.confidence}%` }} />
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Industrial Security Access Banner */}
      <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Enterprise RBAC Session Protection</h4>
            <p className="text-[11px] text-slate-400">Full digital twin manipulation & node overrides require an authenticated operational token.</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/auth/login')}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shrink-0"
        >
          <span>Sign In to Unlock Live Controls</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
};

