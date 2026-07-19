import React, { useState, useMemo } from 'react';
import { AlertTriangle, Filter, CheckCircle2, User, RefreshCw, X, Eye } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { MOCK_ALERTS } from '../../api/mockData';

export default function AlertCenter() {
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [notes, setNotes] = useState('');

  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      const matchSeverity = severityFilter === 'ALL' || a.severity === severityFilter;
      const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
      return matchSeverity && matchStatus;
    });
  }, [alerts, severityFilter, statusFilter]);

  const handleResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;

    setAlerts(prev => prev.map(a => {
      if (a.id === selectedAlert.id) {
        return { ...a, status: 'RESOLVED', resolution_notes: notes };
      }
      return a;
    }));
    
    alert(`Alert ${selectedAlert.id} marked as RESOLVED.`);
    setSelectedAlert(null);
    setNotes('');
  };

  const handleAcknowledge = (id: string) => {
    setAlerts(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, status: 'ACKNOWLEDGED' };
      }
      return a;
    }));
    if (selectedAlert?.id === id) {
      setSelectedAlert((prev: any) => ({ ...prev, status: 'ACKNOWLEDGED' }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Alert Triage Desk</h1>
        <p className="text-sm text-slate-400">Reconcile discrepancies, manage critical failures, and assign audits to floor staff.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Side: Sidebar Filters */}
        <Card className="space-y-5 lg:col-span-1">
          <div className="flex items-center space-x-2 text-slate-200 border-b border-white/06 pb-3">
            <Filter className="w-4 h-4 text-indigo-400" />
            <h3 className="font-semibold text-sm">Filters</h3>
          </div>

          {/* Severity */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400">Severity</label>
            <div className="flex flex-col gap-1.5">
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`text-left text-xs font-semibold px-3 py-2 rounded-lg border transition-all ${
                    severityFilter === sev
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                      : 'bg-transparent border-transparent text-slate-400 hover:bg-white/03 hover:text-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400">Status</label>
            <div className="flex flex-col gap-1.5">
              {['ALL', 'OPEN', 'ACKNOWLEDGED', 'RESOLVED'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`text-left text-xs font-semibold px-3 py-2 rounded-lg border transition-all ${
                    statusFilter === st
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                      : 'bg-transparent border-transparent text-slate-400 hover:bg-white/03 hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Middle/Right: Alerts list */}
        <div className="lg:col-span-3 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map(alert => (
                <Card 
                  key={alert.id} 
                  className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${
                    selectedAlert?.id === alert.id ? 'border-indigo-500/50 bg-indigo-500/02' : 'hover:border-white/10'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        alert.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400' :
                        alert.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-400' :
                        'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        alert.status === 'OPEN' ? 'bg-red-500/10 text-red-500' :
                        alert.status === 'ACKNOWLEDGED' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {alert.status}
                      </span>
                    </div>

                    <h3 className="font-semibold text-slate-200">{alert.title}</h3>
                    <p className="text-xs text-slate-400">
                      Bin: <span className="font-mono text-indigo-300 font-semibold">{alert.bin_code || 'N/A'}</span>
                    </p>
                  </div>

                  <div className="flex gap-2.5 self-end md:self-auto">
                    {alert.status === 'OPEN' && (
                      <Button 
                        onClick={() => handleAcknowledge(alert.id)}
                        variant="secondary" 
                        className="btn-sm"
                      >
                        Acknowledge
                      </Button>
                    )}
                    <Button 
                      onClick={() => setSelectedAlert(alert)} 
                      variant="primary" 
                      className="btn-sm flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" /> Inspect
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-white/10 bg-white/01">
                <AlertTriangle className="w-12 h-12 text-slate-500 mb-4" />
                <h4 className="font-semibold text-slate-200 mb-1">No alerts found</h4>
                <p className="text-xs text-slate-400 max-w-[240px]">
                  No alert reports match your current filter settings. All systems functional!
                </p>
              </Card>
            )}
          </div>
        </div>

      </div>

      {/* Alert Inspector Panel Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-[#080c14] border-l border-white/10 p-6 flex flex-col justify-between overflow-y-auto">
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-200">Alert Details</h3>
                <button onClick={() => setSelectedAlert(null)} className="btn-icon">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Alert Title</label>
                  <p className="text-sm text-slate-200 font-semibold">{selectedAlert.title}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Location Code</label>
                    <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-md">
                      {selectedAlert.bin_code || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Severity</label>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      selectedAlert.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {selectedAlert.severity}
                    </span>
                  </div>
                </div>

                {selectedAlert.expected_sku && (
                  <div className="p-3.5 rounded-xl bg-white/02 border border-white/04 space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Expected SKU:</span>
                      <span className="font-mono text-slate-200">{selectedAlert.expected_sku}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Observed SKU:</span>
                      <span className="font-mono text-red-400 font-semibold">{selectedAlert.observed_sku}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {selectedAlert.status !== 'RESOLVED' ? (
              <form onSubmit={handleResolve} className="space-y-4 pt-6 border-t border-white/06">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Resolution Action Notes</label>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter details of correction, e.g. Relocated to correct bin B2-R3..."
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-slate-100 outline-none bg-white/04 border border-white/08 focus:border-indigo-500/50 transition-all"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="flex-1"
                    onClick={() => {
                      alert('Rescan task added for location ' + selectedAlert.bin_code);
                      setSelectedAlert(null);
                    }}
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" /> Rescan
                  </Button>
                  <Button type="submit" variant="primary" className="flex-1">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark Resolved
                  </Button>
                </div>
              </form>
            ) : (
              <div className="pt-6 border-t border-white/06 text-xs space-y-2">
                <span className="text-slate-400 block">Resolution Details:</span>
                <p className="text-slate-300 font-semibold italic bg-white/02 p-3 rounded-lg border border-white/04">
                  {selectedAlert.resolution_notes || 'No resolution notes provided.'}
                </p>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
