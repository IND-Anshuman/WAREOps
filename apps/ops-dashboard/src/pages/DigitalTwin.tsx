import React, { useState, useMemo, useEffect } from 'react';
import { 
  Layers, Info, RefreshCw, ZoomIn, ZoomOut, Download, 
  Filter, CheckCircle2, AlertTriangle, Shield, Bot, Eye,
  Activity, Flame, Compass, Maximize2, Radio, Sparkles
} from 'lucide-react';
import { exportToCsv } from '../utils/exportCsv';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { WarehouseFloorPlan, type TwinBinState, type TwinRobotPosition } from '../components/twin/WarehouseFloorPlan';
import { robotsApi, inventoryApi } from '../api/client';
import { MOCK_BINS, MOCK_ROBOTS } from '../api/mockData';

export default function DigitalTwin() {
  const [selectedBinId, setSelectedBinId] = useState<string | null>(null);
  
  // Tactical Overlays
  const [showRobots, setShowRobots] = useState(true);
  const [showBinStates, setShowBinStates] = useState(true);
  const [showScanCones, setShowScanCones] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  
  // Presets & Filters
  const [activePreset, setActivePreset] = useState<'OVERVIEW' | 'HEATMAP' | 'AMR_TRACKING'>('OVERVIEW');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterZone, setFilterZone] = useState<string>('ALL');

  const [bins, setBins] = useState<TwinBinState[]>([]);
  const [robots, setRobots] = useState<TwinRobotPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescanTriggered, setRescanTriggered] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          inventoryApi.searchInventory(''),
          robotsApi.getRobots()
        ]);

        // Exact Topology Requirements: 
        // 2 Zones -> 2 Aisles/Zone -> 2 Racks/Aisle -> 4 Rows/Rack -> 3 Products/Row = 96 Products
        const zoneConfigs = [
          { zone: 'Zone A', code: 'ZA', baseX: 50, baseY: 70 },
          { zone: 'Zone B', code: 'ZB', baseX: 490, baseY: 70 },
        ];

        const statesList: TwinBinState['bin_state'][] = ['VERIFIED', 'VERIFIED', 'VERIFIED', 'MISMATCH', 'MISSING', 'VERIFIED', 'VERIFIED', 'UNSCANNED'];
        const skusList = ['SKU-ELEC-001', 'SKU-ELEC-002', 'SKU-FURN-001', 'SKU-FURN-002', 'SKU-BOOK-001', 'SKU-TOOL-001', 'SKU-CONS-001', 'SKU-MED-050'];

        const mappedBins: TwinBinState[] = [];
        let count = 1;

        zoneConfigs.forEach((z) => {
          for (let aIdx = 0; aIdx < 2; aIdx++) { // 2 Aisles per zone
            const aisleY = z.baseY + (aIdx === 0 ? 0 : 235);
            const aisleName = `Aisle ${z.code.slice(-1)}${aIdx + 1}`;

            for (let rIdx = 0; rIdx < 2; rIdx++) { // 2 Racks per aisle
              const rackX = z.baseX + (rIdx === 0 ? 0 : 190);
              const rackName = `Rack ${z.code.slice(-1)}${aIdx + 1}-R${rIdx + 1}`;

              for (let rowIdx = 0; rowIdx < 4; rowIdx++) { // 4 Rows per rack
                const rowNum = 4 - rowIdx;
                const rowY = aisleY + 16 + rowIdx * 20;
                const rowName = `Row ${rowNum} (Shelf Tier)`;

                for (let pIdx = 0; pIdx < 3; pIdx++) { // 3 Products per row
                  const prodNum = pIdx + 1;
                  const state = statesList[(count - 1) % statesList.length];
                  const sku = skusList[(count - 1) % skusList.length];
                  const binCode = `${z.code.slice(-1)}${aIdx + 1}-R${rIdx + 1}-S${rowNum}-P${prodNum}`;

                  mappedBins.push({
                    bin_id: `bin-${String(count).padStart(3, '0')}`,
                    bin_code: binCode,
                    zone_id: z.zone,
                    aisle_id: aisleName,
                    rack_id: rackName,
                    row_id: rowName,
                    shelf_id: `Shelf S${rowNum}`,
                    product_slot: `Product ${prodNum}`,
                    current_sku: state === 'MISMATCH' ? 'SKU-WRONG-007' : state === 'MISSING' ? null : sku,
                    expected_sku: sku,
                    bin_state: state,
                    x: rackX + 6 + pIdx * 52,
                    y: rowY,
                    confidence: state === 'VERIFIED' ? 0.97 : state === 'MISMATCH' ? 0.81 : 0,
                  });
                  count++;
                }
              }
            }
          }
        });

        // Single AMR Bot on map as requested
        const mappedRobots: TwinRobotPosition[] = [
          {
            robot_id: 'AMR-01',
            name: 'Titan Alpha',
            x: 245,
            y: 175,
            battery: 94,
            status: 'AUDITING',
            heading: 90,
          },
        ];

        setBins(mappedBins);
        setRobots(mappedRobots);
      } catch (err) {
        console.error('Failed to fetch digital twin data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const counts = useMemo(() => {
    const total = bins.length;
    const verified = bins.filter(b => b.bin_state === 'VERIFIED').length;
    const mismatch = bins.filter(b => b.bin_state === 'MISMATCH').length;
    const missing = bins.filter(b => b.bin_state === 'MISSING').length;
    const unscanned = bins.filter(b => b.bin_state === 'UNSCANNED').length;
    return { total, verified, mismatch, missing, unscanned };
  }, [bins]);

  const filteredBins = useMemo(() => {
    return bins.filter(b => {
      const matchStatus = filterStatus === 'ALL' || b.bin_state === filterStatus;
      const matchZone = filterZone === 'ALL' || b.zone_id === filterZone;
      return matchStatus && matchZone;
    });
  }, [bins, filterStatus, filterZone]);

  const selectedBin = useMemo(() => {
    if (!selectedBinId) return null;
    return bins.find(b => b.bin_id === selectedBinId);
  }, [bins, selectedBinId]);

  const handleBinSelect = (bin: TwinBinState) => {
    setSelectedBinId(bin.bin_id);
  };

  const handleRescan = () => {
    if (!selectedBin) return;
    setRescanTriggered(true);
    setTimeout(() => {
      setBins(prev => prev.map(b => b.bin_id === selectedBin.bin_id ? { ...b, bin_state: 'VERIFIED', confidence: 0.99 } : b));
      setRescanTriggered(false);
      alert(`AMR-01 dispatched to ${selectedBin.bin_code}. Rescan completed with 99% confidence!`);
    }, 1200);
  };

  const handlePresetSelect = (preset: 'OVERVIEW' | 'HEATMAP' | 'AMR_TRACKING') => {
    setActivePreset(preset);
    if (preset === 'HEATMAP') {
      setShowHeatmap(true);
      setShowRobots(false);
    } else if (preset === 'AMR_TRACKING') {
      setShowHeatmap(false);
      setShowRobots(true);
      setShowScanCones(true);
    } else {
      setShowHeatmap(false);
      setShowRobots(true);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-400">Initializing Digital Twin Spatial Engine...</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-80px)] -m-6 h-[calc(100vh-64px)] overflow-hidden bg-[#030611] text-slate-100 font-sans">
      
      {/* Left panel: Control Hub & Inspector */}
      <div className="w-full lg:w-[380px] bg-[#070b16] border-r border-white/10 p-5 flex flex-col gap-5 overflow-y-auto shadow-2xl">
        
        {/* Title Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/20">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 tracking-tight">Digital Twin Spatial OS</h2>
              <p className="text-[11px] text-slate-400">2-Zone · 4-Aisle · 8-Rack Topology</p>
            </div>
          </div>
          <Badge variant="indigo" className="font-mono text-[10px] px-2 py-0.5">96 PRODUCTS</Badge>
        </div>

        {/* Quick Export Package Button */}
        <Button
          variant="secondary"
          onClick={() => {
            const headers = ['Bin ID', 'Bin Code', 'Zone', 'Aisle', 'Rack', 'Row', 'Product Slot', 'State', 'Expected SKU', 'Observed SKU', 'Confidence %'];
            const rows = bins.map(b => [b.bin_id, b.bin_code, b.zone_id, b.aisle_id, b.rack_id, b.row_id, b.product_slot, b.bin_state, b.expected_sku, b.current_sku, Math.round((b.confidence || 0) * 100)]);
            exportToCsv('2zone_96product_topology_snapshot', headers, rows);
          }}
          className="w-full text-xs flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 text-indigo-300 hover:border-indigo-500/50 shadow-lg"
        >
          <Download className="w-4 h-4 text-indigo-400" /> Export 96-Product Topology (.CSV)
        </Button>

        {/* Tactical Preset Views */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest block">Tactical View Presets</label>
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/06">
            {[
              { id: 'OVERVIEW', label: 'Overview', icon: Layers },
              { id: 'HEATMAP', label: 'Heatmap', icon: Flame },
              { id: 'AMR_TRACKING', label: 'AMR Track', icon: Bot },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => handlePresetSelect(p.id as any)}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                  activePreset === p.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/05'
                }`}
              >
                <p.icon className="h-3.5 w-3.5" />
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-2xl border border-white/08 bg-white/[0.02] space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block tracking-wider">Total Products</span>
            <span className="text-lg font-extrabold text-slate-100 font-mono">{counts.total} Slots</span>
          </div>
          <div className="p-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] space-y-1">
            <span className="text-[10px] text-emerald-400 font-semibold uppercase block tracking-wider">Verified Products</span>
            <span className="text-lg font-extrabold text-emerald-400 font-mono">
              {counts.verified} ({counts.total > 0 ? `${Math.round((counts.verified / counts.total) * 100)}%` : '0%'})
            </span>
          </div>
          <div className="p-3 rounded-2xl border border-red-500/20 bg-red-500/[0.04] space-y-1">
            <span className="text-[10px] text-red-400 font-semibold uppercase block tracking-wider">SKU Mismatches</span>
            <span className="text-lg font-extrabold text-red-400 font-mono">{counts.mismatch} Alerts</span>
          </div>
          <div className="p-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] space-y-1">
            <span className="text-[10px] text-amber-400 font-semibold uppercase block tracking-wider">Missing Products</span>
            <span className="text-lg font-extrabold text-amber-400 font-mono">{counts.missing} Items</span>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-1.5">
          <div className="rounded-xl border border-white/06 bg-[#080d1a] p-4 space-y-4">
            
            <div className="flex items-center justify-between border-b border-white/06 pb-2.5">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-indigo-400" />
                <h3 className="font-semibold text-xs text-slate-200">Zone & State Filters</h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">{filteredBins.length} Products</span>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-400">Filter by State</label>
              <div className="grid grid-cols-2 gap-1.5">
                {['ALL', 'VERIFIED', 'MISMATCH', 'MISSING'].map(st => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all text-left border ${
                      filterStatus === st 
                        ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' 
                        : 'bg-white/02 border-white/06 text-slate-400 hover:bg-white/05'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <label className="text-[11px] font-semibold text-slate-400">Filter by Zone</label>
              <select
                value={filterZone}
                onChange={(e) => setFilterZone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs text-slate-200 outline-none bg-slate-900 border border-white/08 focus:border-indigo-500/50"
              >
                <option value="ALL">All 2 Zones (96 Products)</option>
                <option value="Zone A">Zone A (Electronics)</option>
                <option value="Zone B">Zone B (Furniture)</option>
              </select>
            </div>

            <div className="border-t border-white/06 pt-3 space-y-2.5 text-xs text-slate-400">
              <label className="flex items-center gap-2.5 cursor-pointer hover:text-slate-200">
                <input 
                  type="checkbox" 
                  checked={showRobots} 
                  onChange={() => setShowRobots(!showRobots)}
                  className="rounded bg-white/04 border-white/10 text-indigo-500"
                />
                <Bot className="h-3.5 w-3.5 text-indigo-400" /> Show AMR Robot Position
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer hover:text-slate-200">
                <input 
                  type="checkbox" 
                  checked={showScanCones} 
                  onChange={() => setShowScanCones(!showScanCones)}
                  className="rounded bg-white/04 border-white/10 text-indigo-500"
                />
                <Shield className="h-3.5 w-3.5 text-emerald-400" /> Laser Scan Fan Sweep
              </label>
            </div>

          </div>
        </div>

        {/* Selected Bin Inspector Card */}
        {selectedBin ? (
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/[0.03] p-1.5 shadow-2xl">
            <div className="rounded-xl border border-indigo-500/20 bg-[#080d1a] p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-slate-100 font-mono text-base">{selectedBin.bin_code}</h3>
                  <span className="text-[10px] text-slate-400 block font-mono">Product ID: {selectedBin.bin_id}</span>
                </div>
                <Badge variant={
                  selectedBin.bin_state === 'VERIFIED' ? 'success' :
                  selectedBin.bin_state === 'MISMATCH' ? 'danger' :
                  selectedBin.bin_state === 'MISSING' ? 'warning' :
                  'gray'
                }>
                  {selectedBin.bin_state}
                </Badge>
              </div>

              <div className="space-y-2 p-3 rounded-xl bg-white/[0.03] border border-white/06 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Zone ➔ Aisle:</span>
                  <span className="text-slate-200 font-semibold">{selectedBin.zone_id} · {selectedBin.aisle_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Rack ➔ Row:</span>
                  <span className="text-indigo-300 font-semibold">{selectedBin.rack_id} · {selectedBin.row_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Product Compartment:</span>
                  <span className="text-emerald-400 font-semibold">{selectedBin.product_slot}</span>
                </div>
                <div className="flex justify-between border-t border-white/06 pt-1.5">
                  <span className="text-slate-400">Expected SKU:</span>
                  <span className="text-slate-200 font-semibold">{selectedBin.expected_sku || 'EMPTY'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Observed QR:</span>
                  <span className="text-slate-200">{selectedBin.current_sku || 'N/A'}</span>
                </div>
              </div>

              <Button 
                onClick={handleRescan}
                disabled={rescanTriggered}
                variant="primary" 
                className="w-full btn-sm flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${rescanTriggered ? 'animate-spin' : ''}`} /> 
                {rescanTriggered ? 'Dispatching AMR-01...' : 'Request Priority Rescan'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-6 text-center">
            <Info className="w-8 h-8 text-indigo-400 mx-auto mb-2 opacity-80" />
            <h4 className="text-xs font-semibold text-slate-300">Product Slot Inspector Idle</h4>
            <p className="text-[11px] text-slate-500 max-w-[210px] mx-auto mt-1 leading-relaxed">
              Click on any product slot on the floor map to inspect WMS reconciliation details & dispatch AMR-01.
            </p>
          </div>
        )}

      </div>

      {/* Main SVG Floor map layout view */}
      <div className="flex-1 bg-[#02050c] relative flex flex-col justify-between overflow-hidden">
        
        {/* Top Tactical Telemetry Bar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 bg-[#080d1a]/90 px-5 py-3 rounded-2xl border border-white/10 backdrop-blur-2xl shadow-2xl text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              ROS 2 TOPOLOGY ENGINE (96 PRODUCTS)
            </div>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 font-mono text-[11px]">Stream: <strong className="text-slate-200">120 Hz</strong></span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 font-mono text-[11px]">Active Fleet: <strong className="text-indigo-400">1 AMR (Titan Alpha)</strong></span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <Radio className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
            <span>Topic: <strong className="text-indigo-300">/amr/pose_stamped</strong></span>
          </div>
        </div>

        {/* SVG Map Canvas Component */}
        <div className="flex-1 flex items-center justify-center overflow-auto p-4 pt-20 select-none">
          <WarehouseFloorPlan 
            robots={robots} 
            bins={bins}
            selectedBinId={selectedBinId}
            showRobots={showRobots}
            showBinStates={showBinStates}
            showScanCones={showScanCones}
            showHeatmap={showHeatmap}
            filterStatus={filterStatus}
            filterZone={filterZone}
            onBinClick={handleBinSelect}
            onRobotClick={(r) => alert(`Selected Robot: ${r.name || r.robot_id} (${r.battery}% Battery, Status: ${r.status})`)}
          />
        </div>

        {/* Bottom Legend */}
        <div className="border-t border-white/10 bg-[#070b16] px-6 py-3.5 flex gap-6 justify-between items-center flex-wrap z-10 shadow-2xl">
          <div className="flex gap-5 flex-wrap items-center">
            {[
              { color: 'bg-emerald-500', text: 'Verified Product' },
              { color: 'bg-red-500 animate-pulse', text: 'SKU Discrepancy' },
              { color: 'bg-amber-500', text: 'Missing Product' },
              { color: 'bg-slate-700', text: 'Unscanned' },
              { color: 'bg-indigo-500', text: 'AMR Laser Scanner (Titan Alpha)' },
            ].map((l, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className={`w-3 h-3 rounded-md ${l.color}`} />
                <span className="text-slate-300 font-medium text-[11px]">{l.text}</span>
              </div>
            ))}
          </div>

          <div className="text-[11px] font-mono text-slate-500">
            Topology Specs: <span className="text-indigo-400 font-bold">2 Zones · 4 Aisles · 8 Racks · 32 Rows · 96 Products</span>
          </div>
        </div>

      </div>

    </div>
  );
}
