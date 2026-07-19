import React, { useState } from 'react';
import { CheckCircle2, RefreshCw, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const INITIAL_PENDING_OBSERVATIONS = [
  { id: 'obs-001', binCode: 'A1-R2-S3-B2', expectedSku: 'SKU-ELEC-002', observedSku: 'SKU-ELEC-001', confidence: 68, time: '3 min ago', reason: 'Low Scan Confidence' },
  { id: 'obs-002', binCode: 'A2-R3-S1-B1', expectedSku: 'SKU-FURN-001', observedSku: 'SKU-FURN-001', confidence: 72, time: '12 min ago', reason: 'Blurry Frame Detected' },
  { id: 'obs-003', binCode: 'A3-R1-S2-B2', expectedSku: 'SKU-BOOK-001', observedSku: 'None', confidence: 45, time: '40 min ago', reason: 'Missing Item Check' },
  { id: 'obs-004', binCode: 'A1-R4-S3-B1', expectedSku: 'SKU-ELEC-001', observedSku: 'SKU-WRONG-007', confidence: 55, time: '1 hour ago', reason: 'SKU Mismatch' },
];

export default function VerificationQueue() {
  const [observations, setObservations] = useState(INITIAL_PENDING_OBSERVATIONS);

  const handleResolve = (id: string, action: string) => {
    alert(`Observation ${id} resolved with action: ${action}`);
    setObservations(prev => prev.filter(obs => obs.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Verification Queue</h1>
          <p className="text-sm text-slate-400">Review flagged low-confidence observations and solve inventory discrepancies.</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400">
          {observations.length} Pending
        </span>
      </div>

      {observations.length > 0 ? (
        <div className="space-y-5">
          {observations.map(obs => (
            <Card key={obs.id} className="grid grid-cols-1 lg:grid-cols-3 gap-6 hover:border-white/10">
              
              {/* Left Side: Detail & Code */}
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                    {obs.reason}
                  </span>
                  <h3 className="text-lg font-bold text-slate-200 mt-2 font-mono">{obs.binCode}</h3>
                  <p className="text-xs text-slate-400">Observed {obs.time}</p>
                </div>

                <div className="space-y-2 p-3.5 rounded-xl bg-white/02 border border-white/04">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Expected SKU:</span>
                    <span className="font-mono text-slate-200">{obs.expectedSku}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Observed QR:</span>
                    <span className={`font-mono ${obs.observedSku === 'None' ? 'text-red-400 font-semibold' : 'text-slate-200'}`}>
                      {obs.observedSku}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Robot Confidence:</span>
                    <span className={`font-semibold ${
                      obs.confidence > 70 ? 'text-yellow-400' : 'text-red-400 animate-pulse'
                    }`}>
                      {obs.confidence}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle Side: Camera Frame Preview */}
              <div className="flex flex-col items-center justify-center bg-slate-950/60 rounded-xl border border-white/04 min-h-[160px] text-center p-4">
                <ImageIcon className="w-8 h-8 text-slate-600 mb-2" />
                <span className="text-xs text-slate-500 font-semibold mb-1">RAW IMAGE FRAME</span>
                <span className="text-[10px] text-slate-500 font-mono">Frame UUID: {obs.id}-frame-raw</span>
              </div>

              {/* Right Side: Action Triage */}
              <div className="flex flex-col justify-center space-y-3.5 lg:pl-6 lg:border-l border-white/06">
                <Button 
                  onClick={() => handleResolve(obs.id, 'ACCEPT_AS_CORRECT')}
                  variant="primary" 
                  className="w-full flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Accept Observation
                </Button>
                <Button 
                  onClick={() => handleResolve(obs.id, 'REQUEST_RESCAN')}
                  variant="secondary" 
                  className="w-full flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" /> Dispatch Rescan
                </Button>
                <Button 
                  onClick={() => handleResolve(obs.id, 'FLAG_DISCREPANCY')}
                  variant="danger" 
                  className="w-full flex items-center justify-center gap-1.5"
                >
                  <AlertTriangle className="w-4 h-4" /> Flag Discrepancy
                </Button>
              </div>

            </Card>
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-white/10 bg-white/01">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-4 animate-pulse" />
          <h4 className="font-semibold text-slate-200 mb-1">Queue is empty</h4>
          <p className="text-xs text-slate-400 max-w-[240px]">
            No low-confidence observations require operator verification at this time. Great job!
          </p>
        </Card>
      )}
    </div>
  );
}
