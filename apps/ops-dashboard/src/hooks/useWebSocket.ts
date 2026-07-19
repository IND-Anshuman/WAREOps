import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppStore } from '../store/useAppStore';
import { useTwinStore } from '../store/useTwinStore';
import type { WsEvent } from '../types';

const WS_URL = (import.meta as any).env?.VITE_WS_URL ?? 'http://localhost:8001';

interface UseWebSocketOptions {
  warehouseId?: string | null;
  enabled?: boolean;
}

const MAX_BACKOFF_MS = 30_000;

export function useWebSocket({ warehouseId, enabled = true }: UseWebSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

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

  const getBackoffDelay = () => {
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), MAX_BACKOFF_MS);
    return delay;
  };

  const connect = useCallback(() => {
    if (!enabled || !mountedRef.current) return;

    const socket = io(WS_URL, {
      transports: ['websocket'],
      reconnection: false,
      timeout: 10_000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      if (!mountedRef.current) return;
      reconnectAttempts.current = 0;
      setWsConnected(true);
      setWsLastPing(Date.now());

      if (warehouseId) {
        socket.emit('join_warehouse', { warehouseId });
      }
    });

    socket.on('warehouse_snapshot', (data) => {
      if (!mountedRef.current) return;
      setSnapshot(data);
    });

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

    socket.on('pong', () => {
      if (!mountedRef.current) return;
      setWsLastPing(Date.now());
    });

    socket.on('disconnect', (reason) => {
      if (!mountedRef.current) return;
      setWsConnected(false);
      console.warn('[WS] Disconnected:', reason);

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
    console.info(`[WS] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);

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

  return { disconnect };
}
