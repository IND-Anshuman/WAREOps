import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppStore } from '../store/useAppStore';
import { useTwinStore } from '../store/useTwinStore';
import type { WsEvent } from '../types';

// In production (.env.production), VITE_WS_URL is empty → use same-origin (gateway serves socket.io/).
// In development (.env.development), VITE_WS_URL=http://localhost:8006 → connect directly to twin service.
const rawWsUrl = (import.meta as any).env?.VITE_WS_URL;
const WS_URL = rawWsUrl && rawWsUrl.trim() !== ''
  ? rawWsUrl
  : (typeof window !== 'undefined' ? window.location.origin : '');

// The digital-twin-sync service exposes the /digital-twin namespace.
const SOCKET_NAMESPACE = '/digital-twin';

interface UseWebSocketOptions {
  warehouseId?: string | null;
  enabled?: boolean;
}

const MAX_BACKOFF_MS = 30_000;

export function useWebSocket(options?: UseWebSocketOptions | string | null) {
  const opts: UseWebSocketOptions =
    typeof options === 'string' ? { warehouseId: options } : options || {};
  const warehouseId = opts.warehouseId;
  const enabled = opts.enabled ?? true;

  const socketRef = useRef<Socket | null>(null);
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const wsConnected = useAppStore((s) => s.wsConnected);
  const setWsConnected = useAppStore((s) => s.setWsConnected);
  const setWsLastPing = useAppStore((s) => s.setWsLastPing);
  const pushLiveAlert = useAppStore((s) => s.pushLiveAlert);
  const setLiveOpenAlerts = useAppStore((s) => s.setLiveOpenAlerts);
  const liveOpenAlerts = useAppStore((s) => s.liveOpenAlerts);
  const setStatsOverride = useAppStore((s) => s.setStatsOverride);
  const addNotification = useAppStore((s) => s.addNotification);

  const setSnapshot = useTwinStore((s) => s.setSnapshot);
  const updateRobotPosition = useTwinStore((s) => s.updateRobotPosition);
  const updateBinState = useTwinStore((s) => s.updateBinState);
  const pushScanEvent = useTwinStore((s) => s.pushScanEvent);

  const getBackoffDelay = () =>
    Math.min(1000 * Math.pow(2, reconnectAttempts.current), MAX_BACKOFF_MS);

  const connect = useCallback(() => {
    if (!enabled || !mountedRef.current) return;

    const baseUrl = WS_URL || window.location.origin;
    // Must connect to /digital-twin namespace — remote_shell.py and ssh_proxy.py listen there.
    const socket = io(`${baseUrl}/digital-twin`, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: false,
      timeout: 10_000,
    });

    socketRef.current = socket;
    setSocketInstance(socket);

    socket.on('connect', () => {
      if (!mountedRef.current) return;
      reconnectAttempts.current = 0;
      setWsConnected(true);
      setWsLastPing(Date.now());

      // Join the warehouse room so we receive targeted events
      if (warehouseId) {
        socket.emit('join_warehouse', { warehouse_id: warehouseId });
      }
    });

    // ── Snapshot: full warehouse state on join ───────────────────────────────
    socket.on('warehouse_snapshot', (data: any) => {
      if (!mountedRef.current) return;
      setWsLastPing(Date.now());
      setSnapshot(data);
    });

    // ── Robot position delta ─────────────────────────────────────────────────
    socket.on('robot_position_update', (data: any) => {
      if (!mountedRef.current) return;
      setWsLastPing(Date.now());
      const r = data.robot || data;
      const id = r.robot_id || r.robotId;
      if (!id) return;
      updateRobotPosition({
        robotId: id,
        x: r.x ?? 0,
        y: r.y ?? 0,
        z: r.z ?? 0,
        yaw: r.yaw ?? 0,
        battery: r.battery ?? r.battery_pct ?? 100,
        status: r.status || 'IDLE',
      });
    });

    // ── Bin state delta ──────────────────────────────────────────────────────
    socket.on('bin_state_update', (data: any) => {
      if (!mountedRef.current) return;
      setWsLastPing(Date.now());
      const b = data.bin || data;
      const id = b.bin_id || b.binId;
      if (!id) return;
      updateBinState({
        binId: id,
        code: b.bin_code || b.code || id,
        state: b.status || b.state || 'UNSCANNED',
        expectedSku: b.expected_sku || b.expectedSku,
        observedSku: b.sku || b.observedSku || b.current_sku,
        confidence: b.confidence,
      });
    });

    // ── Warehouse stats update (periodic broadcast) ──────────────────────────
    socket.on('warehouse_stats_update', (data: any) => {
      if (!mountedRef.current) return;
      setWsLastPing(Date.now());
      if (data.stats) {
        setStatsOverride(data.stats);
      }
    });

    // ── Alert created ────────────────────────────────────────────────────────
    socket.on('alert_created', (data: any) => {
      if (!mountedRef.current) return;
      pushLiveAlert(data);
      setLiveOpenAlerts(liveOpenAlerts + 1);
      addNotification({
        type: data.severity === 'CRITICAL' ? 'error' : 'warning',
        title: `Alert: ${data.title}`,
        message: data.description || '',
      });
    });

    // ── Scan event ──────────────────────────────────────────────────────────
    socket.on('scan_event', (data: any) => {
      if (!mountedRef.current) return;
      pushScanEvent(data);
    });

    // ── Legacy wrapped 'event' format (backwards compat) ────────────────────
    socket.on('event', (event: WsEvent) => {
      if (!mountedRef.current) return;
      setWsLastPing(Date.now());
      switch (event.type) {
        case 'robot_position_update':
          updateRobotPosition(event.payload);
          break;
        case 'bin_state_update':
          updateBinState(event.payload);
          break;
        case 'scan_event':
          pushScanEvent(event.payload);
          break;
        case 'alert_created':
          pushLiveAlert(event.payload);
          setLiveOpenAlerts(liveOpenAlerts + 1);
          addNotification({
            type: event.payload.severity === 'CRITICAL' ? 'error' : 'warning',
            title: `Alert: ${event.payload.title}`,
            message: event.payload.description,
          });
          break;
        case 'stats_update':
          setStatsOverride(event.payload);
          break;
      }
    });

    // ── Command output relay (for Pi remote shell) ───────────────────────────
    socket.on('command_output', (_data: any) => {
      // Handled by AdminOverview.tsx which attaches its own listener
    });

    socket.on('pong', () => {
      if (!mountedRef.current) return;
      setWsLastPing(Date.now());
    });

    socket.on('disconnect', (reason) => {
      if (!mountedRef.current) return;
      setWsConnected(false);
      if (reason !== 'io client disconnect') {
        scheduleReconnect();
      }
    });

    socket.on('connect_error', (err) => {
      if (!mountedRef.current) return;
      setWsConnected(false);
      console.warn('[WS] Connection error:', err.message);
      scheduleReconnect();
    });
  }, [
    enabled,
    warehouseId,
    setWsConnected,
    setWsLastPing,
    setSnapshot,
    updateRobotPosition,
    updateBinState,
    pushScanEvent,
    pushLiveAlert,
    setLiveOpenAlerts,
    setStatsOverride,
    addNotification,
  ]);

  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return;
    const delay = getBackoffDelay();
    reconnectAttempts.current += 1;
    reconnectTimer.current = setTimeout(() => {
      if (!mountedRef.current) return;
      socketRef.current?.disconnect();
      connect();
    }, delay);
  }, [connect]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      socketRef.current?.disconnect();
      setWsConnected(false);
    };
  }, [enabled, connect, setWsConnected]);

  const disconnect = useCallback(() => {
    mountedRef.current = false;
    socketRef.current?.disconnect();
  }, []);

  return { disconnect, isConnected: wsConnected, socket: socketInstance };
}

export default useWebSocket;
