import React from 'react';
import { cn } from '@/lib/utils';

interface VitalStatusCardProps {
  label: string;
  value: string;
  unit: string;
  range: string;
  status: 'critical' | 'warning' | 'normal' | 'unknown';
}

export function VitalStatusCard({ label, value, unit, range, status }: VitalStatusCardProps) {
  const bgClass = {
    critical: 'bg-red-50 border-red-200 border-l-red-500',
    warning: 'bg-amber-50 border-amber-200 border-l-amber-500',
    normal: 'bg-emerald-50 border-emerald-200 border-l-emerald-500',
    unknown: 'bg-slate-50 border-slate-200 border-l-slate-400',
  }[status];

  const textClass = {
    critical: 'text-red-700',
    warning: 'text-amber-700',
    normal: 'text-emerald-700',
    unknown: 'text-slate-600',
  }[status];

  const badgeClass = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    normal: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    unknown: 'bg-slate-100 text-slate-500 border-slate-200',
  }[status];

  return (
    <div className={cn("flex flex-col p-4 border rounded-xl border-l-4", bgClass)}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
        <span className={cn("text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border", badgeClass)}>
          {status.toUpperCase()}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={cn("text-2xl font-black italic", textClass)}>{value || '--'}</span>
        <span className="text-xs font-bold text-slate-400">{unit}</span>
      </div>
      <span className="text-[10px] font-semibold text-slate-400 mt-2">Normal: {range}</span>
    </div>
  );
}
