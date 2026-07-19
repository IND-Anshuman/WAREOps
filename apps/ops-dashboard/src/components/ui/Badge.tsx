import React from 'react';
import { clsx } from 'clsx';
import type { AlertSeverity, AlertStatus, MissionStatus, RobotStatus, BinState, UserRole } from '../../types';

type BadgeVariant = 'indigo' | 'success' | 'warning' | 'danger' | 'critical' | 'gray';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

export function Badge({ children, variant = 'gray', className, dot }: BadgeProps) {
  return (
    <span className={clsx(`badge-${variant}`, className)}>
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', {
        'bg-indigo-400': variant === 'indigo',
        'bg-emerald-400': variant === 'success',
        'bg-amber-400': variant === 'warning',
        'bg-red-400': variant === 'danger' || variant === 'critical',
        'bg-slate-400': variant === 'gray',
      })} />}
      {children}
    </span>
  );
}

// Severity badge
export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  const map: Record<AlertSeverity, BadgeVariant> = {
    CRITICAL: 'critical',
    HIGH: 'danger',
    MEDIUM: 'warning',
    LOW: 'gray',
  };
  return <Badge variant={map[severity]} dot>{severity}</Badge>;
}

// Alert status badge
export function AlertStatusBadge({ status }: { status: AlertStatus }) {
  const map: Record<AlertStatus, BadgeVariant> = {
    OPEN: 'danger',
    ACKNOWLEDGED: 'warning',
    RESOLVED: 'success',
    DISMISSED: 'gray',
  };
  return <Badge variant={map[status]}>{status}</Badge>;
}

// Mission status badge
export function MissionStatusBadge({ status }: { status: MissionStatus }) {
  const map: Record<MissionStatus, BadgeVariant> = {
    IN_PROGRESS: 'indigo',
    SCHEDULED: 'gray',
    COMPLETED: 'success',
    CANCELLED: 'gray',
    FAILED: 'danger',
  };
  return <Badge variant={map[status]}>{status.replace('_', ' ')}</Badge>;
}

// Robot status badge
export function RobotStatusBadge({ status }: { status: RobotStatus }) {
  const map: Record<RobotStatus, BadgeVariant> = {
    ONLINE: 'success',
    OFFLINE: 'gray',
    CHARGING: 'warning',
    ERROR: 'danger',
  };
  return <Badge variant={map[status]} dot>{status}</Badge>;
}

// Bin state badge
export function BinStateBadge({ state }: { state: BinState }) {
  const map: Record<BinState, BadgeVariant> = {
    VERIFIED: 'success',
    MISMATCH: 'danger',
    MISSING: 'critical',
    UNKNOWN: 'warning',
    UNSCANNED: 'gray',
  };
  return <Badge variant={map[state]}>{state}</Badge>;
}

// Role badge
export function RoleBadge({ role }: { role: UserRole }) {
  const labels: Record<UserRole, string> = {
    ENTERPRISE_ADMIN: 'Admin',
    WAREHOUSE_MANAGER: 'Manager',
    WAREHOUSE_SUPERVISOR: 'Supervisor',
    WAREHOUSE_OPERATOR: 'Operator',
  };
  const vars: Record<UserRole, BadgeVariant> = {
    ENTERPRISE_ADMIN: 'critical',
    WAREHOUSE_MANAGER: 'indigo',
    WAREHOUSE_SUPERVISOR: 'warning',
    WAREHOUSE_OPERATOR: 'success',
  };
  return <Badge variant={vars[role]}>{labels[role]}</Badge>;
}
