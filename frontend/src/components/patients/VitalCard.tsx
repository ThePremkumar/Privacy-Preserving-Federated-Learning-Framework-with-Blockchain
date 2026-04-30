import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VitalCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  onChange: (val: string) => void;
  unit: string;
  hint: string;
  color: string;
  isWarning?: boolean;
  placeholder?: string;
}

export const VitalCard: React.FC<VitalCardProps> = ({ 
  icon: Icon, label, value, onChange, unit, hint, color, isWarning, placeholder 
}) => {
  const colorClasses: Record<string, string> = {
    red: 'border-l-red-500',
    blue: 'border-l-blue-500',
    green: 'border-l-emerald-500',
    orange: 'border-l-orange-500',
  };

  return (
    <div className={cn(
      "bg-slate-50 p-4 rounded-xl border-l-4 transition-all",
      colorClasses[color] || 'border-l-slate-300',
      isWarning ? "ring-2 ring-amber-500 ring-offset-2" : "border border-slate-100"
    )}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <Icon size={16} className={cn(
            color === 'red' ? 'text-red-500' :
            color === 'blue' ? 'text-blue-500' :
            color === 'green' ? 'text-emerald-500' :
            'text-orange-500'
          )} />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        </div>
        {isWarning && (
          <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[8px] font-black">
            <AlertTriangle size={10} /> ABNORMAL
          </div>
        )}
      </div>
      
      <div className="relative">
        <input 
          className="w-full bg-transparent text-lg font-black text-slate-900 focus:outline-none placeholder:text-slate-300"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || '—'}
        />
        <span className="absolute right-0 bottom-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">{unit}</span>
      </div>
      
      <p className="mt-2 text-[9px] font-bold text-slate-400 italic">Normal: {hint}</p>
    </div>
  );
};
