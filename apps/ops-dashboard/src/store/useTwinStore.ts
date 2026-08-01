import { create } from 'zustand';
import type { WarehouseTwinSnapshot, TwinRobotPosition, TwinBinState, ScanEvent } from '../types';

interface TwinState {
  snapshot: WarehouseTwinSnapshot | null;
  robotPositions: Map<string, TwinRobotPosition>;
  // binStates keyed by bin_id (string UUID)
  binStates: Map<string, TwinBinState>;
  recentScans: ScanEvent[];
  lastUpdate: number | null;
  selectedBinId: string | null;

  // Actions
  setSnapshot: (snap: any) => void;
  updateRobotPosition: (pos: TwinRobotPosition) => void;
  updateBinState: (bin: TwinBinState) => void;
  pushScanEvent: (event: ScanEvent) => void;
  setSelectedBinId: (id: string | null) => void;
  reset: () => void;
}

export const useTwinStore = create<TwinState>((set) => ({
  snapshot: null,
  robotPositions: new Map(),
  binStates: new Map(),
  recentScans: [],
  lastUpdate: null,
  selectedBinId: null,

  // setSnapshot handles both the real API shape and the Socket.IO snapshot shape:
  //   Real REST API  → { warehouse_id, robots: [...], bins: { bin_id: {...} }, stats, snapshot_ts }
  //   Socket.IO snap → { robots: [...], bins: [...], recentScans?: [...] }  (legacy array form)
  setSnapshot: (snap: any) => {
    const robotPositions = new Map<string, TwinRobotPosition>();
    const binStates = new Map<string, TwinBinState>();

    // ── Robots: always an array ──────────────────────────────────────────────
    const robotsArr: any[] = Array.isArray(snap.robots) ? snap.robots : [];
    robotsArr.forEach((r: any) => {
      const id = r.robot_id || r.robotId;
      if (!id) return;
      const pos: TwinRobotPosition = {
        robotId: id,
        x: r.x ?? 0,
        y: r.y ?? 0,
        z: r.z ?? 0,
        yaw: r.yaw ?? 0,
        battery: r.battery ?? r.battery_pct ?? 100,
        status: r.status || 'IDLE',
      };
      robotPositions.set(id, pos);
    });

    // ── Bins: real API returns a dict { bin_id: {...} }, WS may return array ─
    const binsRaw = snap.bins;
    if (binsRaw && typeof binsRaw === 'object' && !Array.isArray(binsRaw)) {
      // Dict form from REST API
      Object.entries(binsRaw).forEach(([binId, b]: [string, any]) => {
        const binState: TwinBinState = {
          binId,
          code: b.bin_id || binId,
          state: b.status || b.bin_state || 'UNSCANNED',
          expectedSku: b.sku || b.expected_sku,
          observedSku: b.sku || b.current_sku,
          confidence: b.confidence,
        };
        binStates.set(binId, binState);
      });
    } else if (Array.isArray(binsRaw)) {
      // Legacy array form from Socket.IO warehouse_snapshot
      binsRaw.forEach((b: any) => {
        const id = b.binId || b.bin_id;
        if (!id) return;
        const binState: TwinBinState = {
          binId: id,
          code: b.code || b.bin_code || id,
          state: b.state || b.bin_state || 'UNSCANNED',
          expectedSku: b.expectedSku || b.expected_sku,
          observedSku: b.observedSku || b.current_sku,
          confidence: b.confidence,
        };
        binStates.set(id, binState);
      });
    }

    set({
      snapshot: snap,
      robotPositions,
      binStates,
      recentScans: snap.recentScans ?? [],
      lastUpdate: Date.now(),
    });
  },

  updateRobotPosition: (pos) =>
    set((state) => {
      const next = new Map(state.robotPositions);
      next.set(pos.robotId, pos);
      return { robotPositions: next, lastUpdate: Date.now() };
    }),

  updateBinState: (bin) =>
    set((state) => {
      const next = new Map(state.binStates);
      const id = bin.binId || (bin as any).bin_id;
      next.set(id, bin);
      return { binStates: next, lastUpdate: Date.now() };
    }),

  pushScanEvent: (event) =>
    set((state) => ({
      recentScans: [event, ...state.recentScans].slice(0, 200),
      lastUpdate: Date.now(),
    })),

  setSelectedBinId: (id) => set({ selectedBinId: id }),

  reset: () =>
    set({
      snapshot: null,
      robotPositions: new Map(),
      binStates: new Map(),
      recentScans: [],
      lastUpdate: null,
      selectedBinId: null,
    }),
}));
