import React from 'react';
import { clsx } from 'clsx';

type CardVariant = 'default' | 'elevated' | 'bordered' | 'indigo' | 'success' | 'warning' | 'danger';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

const variantMap: Record<CardVariant, string> = {
  default: 'card',
  elevated: 'glass-elevated rounded-2xl p-5',
  bordered: 'card border-[rgba(255,255,255,0.1)]',
  indigo: 'card-indigo',
  success: 'card-success',
  warning: 'card-warning',
  danger: 'card-danger',
};

export function Card({ children, variant = 'default', className, onClick, hoverable = false }: CardProps) {
  return (
    <div
      className={clsx(
        variantMap[variant],
        hoverable && 'cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={clsx('text-sm font-semibold text-slate-200', className)}>
      {children}
    </h3>
  );
}
