import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Layers, Info, RefreshCw, Download, Filter, Shield, Bot,
  Compass, Radio,
} from 'lucide-react';
import { exportToCsv } from '../utils/exportCsv';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { WarehouseFloorPlan, type TwinBinState, type TwinRobotPosition } from '../components/twin/WarehouseFloorPlan';
import { robotsApi, inventoryApi, missionsApi, warehousesApi } from '../api/client';
import useWebSocket from '../hooks/useWebSocket';
import { useTwinStore } from '../store/useTwinStore';

// Real default warehouse ID — matches init.sql and seed_warehouse_data.py
const DEFAULT_WAREHOUSE_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

export default function DigitalTwin() {
  const [searchParams] = useSearchParams();
  const binParam = searchParams.get('bin');
  const skuParam = searchParams.get('sku');
  const warehouseId = searchParams.get('warehouseId') || DEFAULT_WAREHOUSE_ID;

  const [selectedBinId, setSelectedBinId] = useState<string | null>(null);
  const [showRobots, setShowRobots] = useState(true);
  const [showBinStates, setShowBinStates] = useState(true);
  const [showScanCones, setShowScanCones] = useState(false);
  const [activePreset, setActivePreset] = useState<'OVERVIEW' | 'AMR_TRACKING'>('OVERVIEW');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterZone, setFilterZone] = useState<string>('ALL');

  const [bins, setBins] = useState<TwinBinState[]>([]);
  const [robots, setRobots] = useState<TwinRobotPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescanTriggered, setRescanTriggered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // WebSocket for live updates — uses real warehouse UUID
  const { isConnected } = useWebSocket({ warehouseId });
  const storeRobotsMap = useTwinStore((s) => s.robotPositions);
  const storeBinsMap = useTwinStore((s) => s.binStates);

  // ── Map real twin snapshot to TwinBinState[] for the floor plan ─────────────
  const mapSnapshotToBins = useCallback((snapshot: any): TwinBinState[] => {
    if (!snapshot) return [];

    // snapshot.bins is a dict { bin_id: { bin_id, warehouse_id, sku, status, confidence, ... } }
    const binsDict: Record<string, any> = snapshot.bins || {};
    const result: TwinBinState[] = [];
    let idx = 0;

    Object.entries(binsDict).forEach(([binId, b]: [string, any]) => {
      // Spread bins across a simple grid layout for rendering.
      // Real coordinates come from the bin record if available.
      const col = idx % 12;
      const row = Math.floor(idx / 12);
      result.push({
        bin_id: binId,
        bin_code: b.bin_code || binId,
        zone_id: b.zone_id || 'Main Zone',
        aisle_id: b.aisle_id || '',
        rack_id: b.rack_id || '',
        row_id: b.row_id || '',
        shelf_id: b.shelf_id || '',
        product_slot: b.product_slot || '',
        current_sku: b.sku || null,
        expected_sku: b.expected_sku || b.sku || null,
        bin_state: (b.status as TwinBinState['bin_state']) || 'UNSCANNED',
        x: b.coord_x != null ? Number(b.coord_x) : 50 + col * 55,
        y: b.coord_y != null ? Number(b.coord_y) : 70 + row * 25,
        confidence: b.confidence || 0,
      });
      idx++;
    });
    return result;
  }, []);

  // ── Map twin robots list to TwinRobotPosition[] ──────────────────────────────
  const mapSnapshotToRobots = useCallback((robotsList: any[]): TwinRobotPosition[] => {
    if (!Array.isArray(robotsList) || robotsList.length === 0) return [];
    return robotsList.map((r: any) => ({
      robot_id: r.robot_id || r.robotId || 'AMR-01',
      name: r.name || r.robot_id || 'AMR-01',
      x: r.x ?? 230,
      y: r.y ?? 175,
      battery: r.battery ?? r.battery_pct ?? 100,
      status: (r.status as any) || 'IDLE',
      heading: r.yaw ?? r.heading ?? 0,
    }));
  }, []);

  // ── Initial data fetch ───────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [snapshotData, robotsListData] = await Promise.allSettled([
          warehousesApi.getTwinSnapshot(warehouseId),
          warehousesApi.getTwinRobots(warehouseId),
        ]);

        // Process snapshot bins
        if (snapshotData.status === 'fulfilled' && snapshotData.value) {
          const mappedBins = mapSnapshotToBins(snapshotData.value);
          setBins(mappedBins);

          // If URL has a bin/sku param, auto-select the matching bin
          if (binParam || skuParam) {
            const matched = mappedBins.find((b) =>
              (binParam && b.bin_code.toLowerCase().includes(binParam.toLowerCase())) ||
              (skuParam && (
                b.expected_sku?.toLowerCase() === skuParam.toLowerCase() ||
                b.current_sku?.toLowerCase() === skuParam.toLowerCase()
              ))
            );
            if (matched) setSelectedBinId(matched.bin_id);
          }
        } else {
          setBins([]);
          setError('No twin data available. Run a scan mission to populate the digital twin.');
        }

        // Process robots — from robots list endpoint
        const robotsSource =
          robotsListData.status === 'fulfilled' && robotsListData.value
            ? robotsListData.value
            : null;

        if (robotsSource) {
          const robotsArr = robotsSource.robots || (Array.isArray(robotsSource) ? robotsSource : []);
          setRobots(mapSnapshotToRobots(robotsArr));
        } else {
          // Fall back to mission-service robots list
          try {
            const missionRobots = await robotsApi.getRobots();
            setRobots(missionRobots.map((r: any) => ({
              robot_id: r.id || r.robot_id,
              name: r.name || r.serial_number,
              x: r.current_coord_x ?? 230,
              y: r.current_coord_y ?? 175,
              battery: r.battery_pct ?? 100,
              status: (r.status as any) || 'IDLE',
              heading: r.current_yaw ?? 0,
            })));
          } catch {
            setRobots([]);
          }
        }
      } catch (err) {
        console.error('Digital twin fetch failed:', err);
        setError('Failed to load digital twin data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [warehouseId, binParam, skuParam, mapSnapshotToBins, mapSnapshotToRobots]);

  // ── Live WebSocket updates → merge into component state ──────────────────────
  useEffect(() => {
    if (storeRobotsMap.size === 0) return;
    setRobots(Array.from(storeRobotsMap.values()).map((r) => ({
      robot_id: r.robotId,
      name: r.robotId,
      x: r.x,
      y: r.y,
      battery: r.battery,
      status: (r.status as any) || 'IDLE',
      heading: r.yaw,
    })));
  }, [storeRobotsMap]);

  useEffect(() => {
    if (storeBinsMap.size === 0) return;
    setBins((prev) => prev.map((b) => {
      const live = storeBinsMap.get(b.bin_id);
      if (!live) return b;
      return {
        ...b,
        bin_state: (live.state as TwinBinState['bin_state']) || b.bin_state,
        expected_sku: live.expectedSku || b.expected_sku,
        current_sku: live.observedSku || b.current_sku,
        confidence: live.confidence ?? b.confidence,
      };
    }));
  }, [storeBinsMap]);

  // ── Derived counts ────────────────────────────────────────────────────────────
  const counts = useMemo(() => ({
    total: bins.length,
    verified: bins.filter((b) => b.bin_state === 'VERIFIED').length,
    mismatch: bins.filter((b) => b.bin_state === 'MISMATCH').length,
    missing: bins.filter((b) => b.bin_state === 'MISSING').length,
    unscanned: bins.filter((b) => b.bin_state === 'UNSCANNED').length,
  }), [bins]);

  const filteredBins = useMemo(() => bins.filter((b) => {
    const matchStatus = filterStatus === 'ALL' || b.bin_state === filterStatus;
    const matchZone = filterZone === 'ALL' || b.zone_id === filterZone;
    return matchStatus && matchZone;
  }), [bins, filterStatus, filterZone]);

  const selectedBin = useMemo(
    () => (selectedBinId ? bins.find((b) => b.bin_id === selectedBinId) : null),
    [bins, selectedBinId],
  );

  const zoneOptions = useMemo(() => {
    const zones = [...new Set(bins.map((b) => b.zone_id).filter(Boolean))];
    return zones;
  }, [bins]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleRescan = async () => {
    if (!selectedBin) return;
    setRescanTriggered(true);
    try {
      await inventoryApi.requestRescan(selectedBin.bin_id);
      setBins((prev) =>
        prev.map((b) =>
          b.bin_id === selectedBin.bin_id ? { ...b, bin_state: 'UNSCANNED' } : b
        )
      );
    } catch (err) {
      console.error('Rescan dispatch failed:', err);
    } finally {
      setRescanTriggered(false);
    }
  };

  const handlePresetSelect = (preset: 'OVERVIEW' | 'AMR_TRACKING') => {
    setActivePreset(preset);
    setShowRobots(preset === 'AMR_TRACKING');
    setShowScanCones(preset === 'AMR_TRACKING');
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
        Connecting to Digital Twin Engine...
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-80px)] -m-6 h-[calc(100vh-64px)] overflow-hidden bg-[#030611] text-slate-100 font-sans">

      {/* ── Left Control Panel ─────────────────────────────────────────────── */}
      <div className="w-full lg:w-[380px] bg-[#070b16] border-r border-white/10 p-5 flex flex-col gap-5 overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 tracking-tight">Digital Twin Spatial OS</h2>
              <p className="text-[11px] text-slate-400">Live warehouse state · {counts.total} bins tracked</p>
            </div>
          </div>
          <Badge variant="indigo" className="font-mono text-[10px] px-2 py-0.5">
            {counts.total} BINS
          </Badge>
        </div>

        {/* Error banner */}
        {error && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
            {error}
          </div>
        )}

        {/* Export button */}
        <Button
          variant="secondary"
          onClick={() => {
            const headers = ['Bin ID', 'Bin Code', 'Zone', 'State', 'Expected SKU', 'Observed SKU', 'Confidence %'];
            const rows = bins.map((b) => [
              b.bin_id, b.bin_code, b.zone_id, b.bin_state,
              b.expected_sku ?? '', b.current_sku ?? '',
              Math.round((b.confidence || 0) * 100),
            ]);
            exportToCsv('twin_snapshot', headers, rows);
          }}
          className="w-full text-xs flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 text-indigo-300 hover:border-indigo-500/50"
        >
          <Download className="w-4 h-4 text-indigo-400" /> Export Twin Snapshot (.CSV)
        </Button>

        {/* View presets */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest block">View Presets</label>
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            {([['OVERVIEW', 'Overview', Layers], ['AMR_TRACKING', 'AMR Track', Bot]] as const).map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => handlePresetSelect(id as any)}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                  activePreset === id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Live metrics */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block tracking-wider">Total Bins</span>
            <span className="text-lg font-extrabold text-slate-100 font-mono">{counts.total}</span>
          </div>
          <div className="p-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] space-y-1">
            <span className="text-[10px] text-emerald-400 font-semibold uppercase block tracking-wider">Verified</span>
            <span className="text-lg font-extrabold text-emerald-400 font-mono">
              {counts.verified}{counts.total > 0 ? ` (${Math.round((counts.verified / counts.total) * 100)}%)` : ''}
            </span>
          </div>
          <div className="p-3 rounded-2xl border border-red-500/20 bg-red-500/[0.04] space-y-1">
            <span className="text-[10px] text-red-400 font-semibold uppercase block tracking-wider">Mismatches</span>
            <span className="text-lg font-extrabold text-red-400 font-mono">{counts.mismatch}</span>
          </div>
          <div className="p-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] space-y-1">
            <span className="text-[10px] text-amber-400 font-semibold uppercase block tracking-wider">Missing</span>
            <span className="text-lg font-extrabold text-amber-400 font-mono">{counts.missing}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-1.5">
          <div className="rounded-xl border border-white/[0.06] bg-[#080d1a] p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-indigo-400" />
                <h3 className="font-semibold text-xs text-slate-200">Filters</h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">{filteredBins.length} visible</span>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-400">Filter by State</label>
              <div className="grid grid-cols-2 gap-1.5">
                {['ALL', 'VERIFIED', 'MISMATCH', 'MISSING', 'UNSCANNED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all text-left border ${
                      filterStatus === st
                        ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                        : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.05]'
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
                className="w-full px-3 py-2 rounded-xl text-xs text-slate-200 outline-none bg-slate-900 border border-white/[0.08] focus:border-indigo-500/50"
              >
                <option value="ALL">All Zones</option>
                {zoneOptions.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>

            <div className="border-t border-white/[0.06] pt-3 space-y-2.5 text-xs text-slate-400">
              <label className="flex items-center gap-2.5 cursor-pointer hover:text-slate-200">
                <input type="checkbox" checked={showRobots} onChange={() => setShowRobots(!showRobots)}
                  className="rounded bg-white/[0.04] border-white/10 text-indigo-500" />
                <Bot className="h-3.5 w-3.5 text-indigo-400" /> Show Robot Positions
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer hover:text-slate-200">
                <input type="checkbox" checked={showScanCones} onChange={() => setShowScanCones(!showScanCones)}
                  className="rounded bg-white/[0.04] border-white/10 text-indigo-500" />
                <Shield className="h-3.5 w-3.5 text-emerald-400" /> Scan Fan Overlay
              </label>
            </div>
          </div>
        </div>

        {/* Bin inspector */}
        {selectedBin ? (
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/[0.03] p-1.5 shadow-2xl">
            <div className="rounded-xl border border-indigo-500/20 bg-[#080d1a] p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-slate-100 font-mono text-sm">{selectedBin.bin_code}</h3>
                  <span className="text-[10px] text-slate-500 block font-mono mt-0.5">{selectedBin.bin_id}</span>
                </div>
                <Badge variant={
                  selectedBin.bin_state === 'VERIFIED' ? 'success' :
                  selectedBin.bin_state === 'MISMATCH' ? 'danger' :
                  selectedBin.bin_state === 'MISSING' ? 'warning' : 'gray'
                }>
                  {selectedBin.bin_state}
                </Badge>
              </div>
              <div className="space-y-1.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-mono">
                {selectedBin.zone_id && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Zone:</span>
                    <span className="text-slate-200">{selectedBin.zone_id}</span>
                  </div>
                )}
                {selectedBin.rack_id && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rack:</span>
                    <span className="text-indigo-300">{selectedBin.rack_id}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-white/[0.06] pt-1.5">
                  <span className="text-slate-400">Expected SKU:</span>
                  <span className="text-slate-200">{selectedBin.expected_sku || 'EMPTY'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Observed QR:</span>
                  <span className="text-slate-200">{selectedBin.current_sku || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Confidence:</span>
                  <span className="text-slate-200">{Math.round((selectedBin.confidence || 0) * 100)}%</span>
                </div>
              </div>
              <Button
                onClick={handleRescan} disabled={rescanTriggered} variant="primary"
                className="w-full btn-sm flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${rescanTriggered ? 'animate-spin' : ''}`} />
                {rescanTriggered ? 'Dispatching...' : 'Request Priority Rescan'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-6 text-center">
            <Info className="w-8 h-8 text-indigo-400 mx-auto mb-2 opacity-80" />
            <h4 className="text-xs font-semibold text-slate-300">Bin Inspector Idle</h4>
            <p className="text-[11px] text-slate-500 max-w-[210px] mx-auto mt-1 leading-relaxed">
              Click any bin on the floor map to inspect its WMS reconciliation state.
            </p>
          </div>
        )}
      </div>

      {/* ── Main Map Canvas ────────────────────────────────────────────────── */}
      <div className="flex-1 bg-[#02050c] relative flex flex-col justify-between overflow-hidden">

        {/* Top telemetry bar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 bg-[#080d1a]/90 px-5 py-3 rounded-2xl border border-white/10 backdrop-blur-2xl shadow-2xl text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              LIVE DIGITAL TWIN
            </div>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 font-mono text-[11px]">
              WS: <strong className={isConnected ? 'text-emerald-400' : 'text-amber-400'}>
                {isConnected ? 'CONNECTED' : 'RECONNECTING...'}
              </strong>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 font-mono text-[11px]">
              Fleet: <strong className="text-indigo-400">{robots.length} robot(s)</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <Radio className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
            <span>WH: <strong className="text-indigo-300 font-mono text-[10px]">{warehouseId.slice(0, 8)}...</strong></span>
          </div>
        </div>

        {/* Floor plan */}
        <div className="flex-1 flex items-center justify-center overflow-auto p-4 pt-20 select-none">
          <WarehouseFloorPlan
            robots={robots}
            bins={bins}
            selectedBinId={selectedBinId}
            showRobots={showRobots}
            showBinStates={showBinStates}
            showScanCones={showScanCones}
            filterStatus={filterStatus}
            filterZone={filterZone}
            onBinClick={(b) => setSelectedBinId(b.bin_id)}
            onRobotClick={(r) => alert(`Robot: ${r.name || r.robot_id} | Battery: ${r.battery}% | Status: ${r.status}`)}
          />
        </div>

        {/* Legend */}
        <div className="border-t border-white/10 bg-[#070b16] px-6 py-3.5 flex gap-6 justify-between items-center flex-wrap z-10 shadow-2xl">
          <div className="flex gap-5 flex-wrap items-center">
            {[
              { color: 'bg-emerald-500', text: 'Verified' },
              { color: 'bg-red-500 animate-pulse', text: 'SKU Mismatch' },
              { color: 'bg-amber-500', text: 'Missing' },
              { color: 'bg-slate-700', text: 'Unscanned' },
              { color: 'bg-indigo-500', text: 'AMR Robot' },
            ].map((l, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className={`w-3 h-3 rounded-md ${l.color}`} />
                <span className="text-slate-300 font-medium text-[11px]">{l.text}</span>
              </div>
            ))}
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            {counts.total} bins tracked · {counts.verified} verified · {counts.mismatch} alerts
          </div>
        </div>
      </div>
    </div>
  );
}
