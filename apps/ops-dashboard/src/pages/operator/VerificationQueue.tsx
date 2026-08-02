import React, { useState, useEffect } from 'react';
import { CheckCircle2, RefreshCw, AlertTriangle, Image as ImageIcon, Download } from 'lucide-react';
import { exportToCsv } from '../../utils/exportCsv';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { observationsApi } from '../../api/observations';
import { inventoryApi, alertsApi } from '../../api/client';
import type { PendingObservation } from '../../types';

export default function VerificationQueue() {
  const [observations, setObservations] = useState<PendingObservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const queue = await observationsApi.getPendingQueue();
      setObservations(queue);
    } catch (err) {
      console.error('Failed to load pending queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (
    obs: PendingObservation,
    action: 'ACCEPT_AS_CORRECT' | 'REQUEST_RESCAN' | 'FLAG_DISCREPANCY'
  ) => {
    try {
      await observationsApi.resolveObservation(obs.id, action);

      if (action === 'REQUEST_RESCAN') {
        await inventoryApi.requestRescan(obs.binCode);
        setActionMessage(`Dispatched AMR rescan mission for bin ${obs.binCode}`);
      } else if (action === 'FLAG_DISCREPANCY') {
        await alertsApi.createAlert({
          type: 'MISPLACED',
          severity: 'HIGH',
          bin_code: obs.binCode,
          expected_sku: obs.expectedSku,
          observed_sku: obs.observedSku,
          title: `Operator Discrepancy Flag: ${obs.binCode}`,
          description: `Flagged during verification. Reason: ${obs.reason}. Expected ${obs.expectedSku}, observed ${obs.observedSku}`,
          image_url: obs.image_url,
        });
        setActionMessage(`Flagged discrepancy for bin ${obs.binCode} and created high-priority alert.`);
      } else {
        setActionMessage(`Accepted observation for bin ${obs.binCode}. WMS record updated.`);
      }

      setObservations((prev) => prev.filter((o) => o.id !== obs.id));

      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.error('Failed to resolve observation:', err);
      alert('Error updating observation status.');
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-400">Loading observation queue from DB...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Verification Queue</h1>
          <p className="text-sm text-slate-400">Review flagged low-confidence observations and solve inventory discrepancies.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400">
            {observations.length} Pending
          </span>
          <Button
            variant="secondary"
            onClick={() => {
              const headers = ['ID', 'Bin Code', 'Expected SKU', 'Observed SKU', 'Confidence %', 'Flagged Time', 'Reason'];
              const rows = observations.map((o) => [o.id, o.binCode, o.expectedSku, o.observedSku, o.confidence, o.time, o.reason]);
              exportToCsv('verification_queue_export', headers, rows);
            }}
            className="flex items-center gap-1.5 text-xs py-2 px-3"
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-indigo-400" />
          <span>{actionMessage}</span>
        </div>
      )}

      {observations.length > 0 ? (
        <div className="space-y-5">
          {observations.map((obs) => (
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
                    <span
                      className={`font-semibold ${
                        obs.confidence > 70 ? 'text-yellow-400' : 'text-red-400 animate-pulse'
                      }`}
                    >
                      {obs.confidence}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle Side: Camera Frame Extracted from DB */}
              <div className="flex flex-col items-center justify-center bg-slate-950 rounded-xl border border-white/06 p-2 min-h-[180px] overflow-hidden">
                {obs.image_url ? (
                  <div className="relative w-full h-full flex flex-col items-center justify-center">
                    <img src={obs.image_url} alt="DB Camera Frame" className="w-full h-36 object-contain rounded-lg" />
                    <span className="text-[10px] text-slate-400 font-mono mt-1">DB Extracted Frame: {obs.id}</span>
                  </div>
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-8 h-8 text-slate-600 mb-2" />
                    <span className="text-xs text-slate-500 font-semibold mb-1">RAW IMAGE FRAME</span>
                    <span className="text-[10px] text-slate-500 font-mono">Frame UUID: {obs.id}-frame-raw</span>
                  </div>
                )}
              </div>

              {/* Right Side: Action Triage */}
              <div className="flex flex-col justify-center space-y-3.5 lg:pl-6 lg:border-l border-white/06">
                <Button
                  onClick={() => handleResolve(obs, 'ACCEPT_AS_CORRECT')}
                  variant="primary"
                  className="w-full flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Accept Observation
                </Button>
                <Button
                  onClick={() => handleResolve(obs, 'REQUEST_RESCAN')}
                  variant="secondary"
                  className="w-full flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" /> Dispatch Rescan
                </Button>
                <Button
                  onClick={() => handleResolve(obs, 'FLAG_DISCREPANCY')}
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

