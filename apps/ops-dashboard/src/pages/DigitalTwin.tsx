import React, { useState, useMemo } from 'react';
import { Layers, Info, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { WarehouseFloorPlan } from '../components/twin/WarehouseFloorPlan';
import { MOCK_BINS, MOCK_ROBOTS } from '../api/mockData';

export default function DigitalTwin() {
  const [selectedBinId, setSelectedBinId] = useState<string | null>(null);
  
  // Layer toggles
  const [showRobots, setShowRobots] = useState(true);
  const [showBinStates, setShowBinStates] = useState(true);
  
  const bins = MOCK_BINS;
  const robots = MOCK_ROBOTS;

  // Selected bin detail lookup
  const selectedBin = useMemo(() => {
    if (!selectedBinId) return null;
    return bins.find(b => b.id === selectedBinId);
  }, [bins, selectedBinId]);

  // Map canonical types to WarehouseFloorPlan types
  const formattedRobots = useMemo(() => {
    if (!showRobots) return [];
    return robots.map(r => ({
      robot_id: r.id,
      x: r.coord_x / 10, // scaling coordinates down to match SVG bounds
      y: r.coord_y / 5,
      z: 0,
      yaw: 0,
      battery: r.battery_percent,
      status: r.status
    }));
  }, [robots, showRobots]);

  const formattedBins = useMemo(() => {
    return bins.map(b => ({
      bin_id: b.id,
      bin_code: b.code,
      current_sku: b.observed_sku || null,
      bin_state: showBinStates ? b.state : ('UNSCANNED' as const),
      x: b.coord_x / 10,
      y: b.coord_y / 5
    }));
  }, [bins, showBinStates]);

  const handleBinSelect = (bin: any) => {
    setSelectedBinId(bin.bin_id);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-80px)] -m-6 h-[calc(100vh-64px)] overflow-hidden">
      
      {/* Left panel: Layer selectors & inspector card */}
      <div className="w-full lg:w-[340px] bg-[#080c14] border-r border-white/06 p-5 flex flex-col gap-5 overflow-y-auto">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Digital Twin Options</h2>
          <p className="text-xs text-slate-400">Manage real-time layout rendering overlays and inspect physical bins.</p>
        </div>

        {/* Layer Checkboxes */}
        <Card className="space-y-3.5">
          <h3 className="font-semibold text-xs text-slate-300">Display Overlays</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-2.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer">
              <input 
                type="checkbox" 
                checked={showRobots} 
                onChange={() => setShowRobots(!showRobots)}
                className="rounded bg-white/04 border-white/10 text-indigo-500 focus:ring-0 focus:ring-offset-0"
              />
              Show Robot Fleet
            </label>
            <label className="flex items-center gap-2.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer">
              <input 
                type="checkbox" 
                checked={showBinStates} 
                onChange={() => setShowBinStates(!showBinStates)}
                className="rounded bg-white/04 border-white/10 text-indigo-500 focus:ring-0 focus:ring-offset-0"
              />
              Color-code Bins by State
            </label>
          </div>
        </Card>

        {/* Selected item details */}
        {selectedBin ? (
          <Card className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-slate-200 font-mono text-base">{selectedBin.code}</h3>
                <span className="text-[10px] text-slate-400 block font-mono">Bin ID: {selectedBin.id}</span>
              </div>
              <Badge variant={
                selectedBin.state === 'VERIFIED' ? 'success' :
                selectedBin.state === 'MISMATCH' ? 'danger' :
                selectedBin.state === 'MISSING' ? 'warning' :
                'gray'
              }>
                {selectedBin.state}
              </Badge>
            </div>

            <div className="space-y-2.5 p-3.5 rounded-xl bg-white/02 border border-white/04 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Expected Product:</span>
                <span className="font-mono text-slate-200 font-semibold">{selectedBin.expected_sku || 'EMPTY'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Observed QR:</span>
                <span className="font-mono text-slate-200">{selectedBin.observed_sku || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Confidence Score:</span>
                <span className="font-semibold text-emerald-400">{selectedBin.confidence ? `${Math.round(selectedBin.confidence * 100)}%` : 'N/A'}</span>
              </div>
            </div>

            <Button 
              onClick={() => alert(`Rescan scheduled for bin ${selectedBin.code}`)}
              variant="secondary" 
              className="w-full btn-sm flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Request Priority Rescan
            </Button>
          </Card>
        ) : (
          <Card className="flex flex-col items-center justify-center text-center p-6 border-dashed border-white/10 bg-white/01 py-10">
            <Info className="w-8 h-8 text-slate-600 mb-2" />
            <h4 className="text-xs font-semibold text-slate-300">No Item Selected</h4>
            <p className="text-[10px] text-slate-500 max-w-[180px] mt-1 leading-relaxed">
              Click on any bin in the layout map to view live WMS reconciliation details.
            </p>
          </Card>
        )}
      </div>

      {/* Main SVG Floor map layout view */}
      <div className="flex-1 bg-[#05070c] relative flex flex-col justify-between overflow-hidden">
        
        {/* Top bar indicators */}
        <div className="absolute top-4 left-4 z-10 flex gap-2.5 bg-slate-950/80 p-2 rounded-xl border border-white/06 backdrop-blur-md text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            Live Sync Connected
          </div>
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2.5 bg-slate-950/80 p-2 rounded-xl border border-white/06 backdrop-blur-md">
          <button className="btn-icon p-1.5" onClick={() => alert('Zooming in...')}><ZoomIn className="w-4 h-4 text-slate-300" /></button>
          <button className="btn-icon p-1.5" onClick={() => alert('Zooming out...')}><ZoomOut className="w-4 h-4 text-slate-300" /></button>
        </div>

        {/* SVG map canvas component */}
        <div className="flex-1 flex items-center justify-center overflow-auto p-10 select-none">
          <WarehouseFloorPlan 
            robots={formattedRobots} 
            bins={formattedBins} 
            onBinClick={handleBinSelect} 
          />
        </div>

        {/* Legend */}
        <div className="border-t border-white/06 bg-[#080c14] p-4 flex gap-5 justify-center flex-wrap">
          {[
            { color: 'bg-emerald-500', text: 'Verified Placement' },
            { color: 'bg-red-500 animate-pulse', text: 'SKU Mismatch' },
            { color: 'bg-orange-500', text: 'Missing SKU' },
            { color: 'bg-gray-500', text: 'Unscanned Bin' },
          ].map((l, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span className={`w-3 h-3 rounded-md ${l.color}`} />
              <span className="text-slate-400 font-medium">{l.text}</span>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}
