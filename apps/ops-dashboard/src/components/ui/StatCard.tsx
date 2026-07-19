import React from 'react';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: number; // percentage change, positive = up, negative = down
  trendLabel?: string;
  variant?: 'default' | 'indigo' | 'success' | 'warning' | 'danger';
  unit?: string;
  className?: string;
  loading?: boolean;
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  trendLabel,
  variant = 'default',
  unit,
  className,
  loading = false,
}: StatCardProps) {
  const variantClass = variant === 'default' ? 'card' : `card-${variant}`;

  const trendColor =
    trend === undefined ? ''
    : trend > 0 ? 'text-emerald-400'
    : trend < 0 ? 'text-red-400'
    : 'text-slate-400';

  const TrendIcon =
    trend === undefined ? null
    : trend > 0 ? TrendingUp
    : trend < 0 ? TrendingDown
    : Minus;

  return (
    <div className={clsx(variantClass, 'relative overflow-hidden', className)}>
      {loading ? (
        <div className="space-y-3">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-8 w-20" />
          <div className="skeleton h-3 w-16" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider leading-relaxed">
              {label}
            </span>
            {icon && (
              <span className="flex-shrink-0 p-2 rounded-xl bg-white/5 border border-white/08 text-slate-400">
                {icon}
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-3xl font-bold tracking-tight text-slate-100">
              {value}
            </span>
            {unit && <span className="text-sm text-slate-500 font-medium">{unit}</span>}
          </div>

          {TrendIcon && (
            <div className={clsx('flex items-center gap-1 text-xs font-medium', trendColor)}>
              <TrendIcon className="w-3.5 h-3.5" />
              <span>
                {Math.abs(trend!)}% {trendLabel || (trend! > 0 ? 'vs last week' : 'vs last week')}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
