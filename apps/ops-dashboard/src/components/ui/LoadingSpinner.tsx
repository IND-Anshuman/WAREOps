import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

// ─── Spinner ──────────────────────────────────────────────────────────────────
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };

export function LoadingSpinner({ size = 'md', className }: SpinnerProps) {
  return (
    <Loader2 className={clsx('animate-spin text-indigo-400', sizeMap[size], className)} />
  );
}

// ─── Full-page overlay ────────────────────────────────────────────────────────
interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = 'Loading...' }: PageLoaderProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4"
      style={{ background: 'var(--bg-deep)' }}>
      {/* Animated logo placeholder */}
      <div className="relative flex items-center justify-center w-16 h-16">
        <div className="absolute inset-0 rounded-2xl border-2 border-indigo-500/30 animate-ping" />
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl"
          style={{ background: 'var(--indigo)', boxShadow: 'var(--indigo-glow)' }}
        >
          W
        </div>
      </div>
      <LoadingSpinner size="md" />
      <p className="text-sm text-slate-500 font-medium">{message}</p>
    </div>
  );
}

// ─── Inline skeleton rows ─────────────────────────────────────────────────────
export function SkeletonRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-3/4" />
            <div className="skeleton h-2 w-1/2" />
          </div>
          <div className="skeleton h-6 w-16 rounded-full flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}
