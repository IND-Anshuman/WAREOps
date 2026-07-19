import React, { useState } from 'react';
import { clsx } from 'clsx';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface TableProps<T> {
  columns?: Column<T>[];
  data?: T[];
  rowKey?: (row: T) => string;
  headers?: string[];
  rows?: React.ReactNode[][];
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  rowKey,
  headers,
  rows,
  loading = false,
  emptyMessage = 'No data found',
  emptyIcon,
  onRowClick,
  className,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // Render headers/rows structure if provided
  if (headers && rows) {
    return (
      <div className={clsx('overflow-x-auto', className)}>
        <table className="ops-table">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {headers.map((_, j) => (
                    <td key={j}>
                      <div className="skeleton h-4 w-full max-w-[120px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length}>
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    {emptyIcon && <span className="text-slate-600">{emptyIcon}</span>}
                    <p className="text-sm text-slate-500">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((rowCells, i) => (
                <tr key={i}>
                  {rowCells.map((cell, j) => (
                    <td key={j}>{cell}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  }

  // Fallback to standard columns/data structure
  if (!columns || !data || !rowKey) {
    return null;
  }

  const sorted = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const av = (a as Record<string, unknown>)[sortKey];
    const bv = (b as Record<string, unknown>)[sortKey];
    if (av === bv) return 0;
    const cmp = String(av) < String(bv) ? -1 : 1;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  return (
    <div className={clsx('overflow-x-auto', className)}>
      <table className="ops-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={clsx(col.className, col.sortable && 'cursor-pointer hover:text-slate-300 select-none')}
                onClick={() => col.sortable && handleSort(String(col.key))}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    <span className="text-slate-600">
                      {sortKey === String(col.key) ? (
                        sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronsUpDown className="w-3 h-3" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map((col, j) => (
                  <td key={j}>
                    <div className="skeleton h-4 w-full max-w-[120px]" />
                  </td>
                ))}
              </tr>
            ))
          ) : sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  {emptyIcon && <span className="text-slate-600">{emptyIcon}</span>}
                  <p className="text-sm text-slate-500">{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : (
            sorted.map((row) => (
              <tr
                key={rowKey(row)}
                className={clsx(onRowClick && 'cursor-pointer')}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className={col.className}>
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[String(col.key)] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
