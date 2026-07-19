import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  hint,
  prefixIcon,
  suffixIcon,
  containerClassName,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={clsx('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-slate-400 uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {prefixIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 flex items-center">
            {prefixIcon}
          </span>
        )}
        <input
          id={inputId}
          className={clsx(
            'input',
            prefixIcon && 'pl-10',
            suffixIcon && 'pr-10',
            error && 'input-error',
            className
          )}
          {...props}
        />
        {suffixIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 flex items-center">
            {suffixIcon}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export function Textarea({ label, error, hint, containerClassName, className, id, ...props }: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={clsx('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={clsx('input resize-none', error && 'input-error', className)}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
