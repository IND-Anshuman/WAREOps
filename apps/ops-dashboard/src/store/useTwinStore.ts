import { create } from 'zustand';
import type { WarehouseTwinSnapshot, TwinRobotPosition, TwinBinState, ScanEvent } from '../types';

interface TwinState {
  snapshot: WarehouseTwinSnapshot | null;
  robotPositions: Map<string, TwinRobotPosition>;
  binStates: Map<string, TwinBinState>;
  recentScans: ScanEvent[];
  lastUpdate: number | null;
  selectedBinId: string | null;

  // Actions
  setSnapshot: (snap: WarehouseTwinSnapshot) => void;
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

  setSnapshot: (snap) => {
    const robotPositions = new Map<string, TwinRobotPosition>();
    const binStates = new Map<string, TwinBinState>();

    snap.robots.forEach((r) => robotPositions.set(r.robotId, r));
    snap.bins.forEach((b) => binStates.set(b.binId, b));

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
      next.set(bin.binId, bin);
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
