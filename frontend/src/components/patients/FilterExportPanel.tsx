'use client';

import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  FileText, 
  Download, 
  Filter, 
  ChevronDown, 
  CheckCircle2, 
  User, 
  Activity, 
  ShieldAlert,
  BarChart3,
  Stethoscope
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PatientFilters } from '@/lib/patientFilters';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { exportPDF, exportCSV, exportJSON } from '@/lib/exportPatients';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FilterExportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: PatientFilters;
  updateFilter: <K extends keyof PatientFilters>(key: K, value: PatientFilters[K]) => void;
  clearFilters: () => void;
  filteredPatients: any[];
  doctorName: string;
  hospitalName: string;
  doctors: any[];
}

const COMMON_SYMPTOMS = ['Fever', 'Headache', 'Chest pain', 'Shortness of breath', 'Fatigue', 'Nausea', 'Dizziness'];

export function FilterExportPanel({ 
  isOpen, onClose, filters, updateFilter, clearFilters, filteredPatients, doctorName, hospitalName, doctors
}: FilterExportPanelProps) {
  const [symptomSearch, setSymptomSearch] = useState('');
  const [exportingAs, setExportingAs] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [exportMode, setExportMode] = useState<'detailed' | 'doctor_summary'>('detailed');

  const doctorAnalytics = useMemo(() => {
    const analytics: Record<string, { name: string, count: number, highRisk: number, normal: number }> = {};
    
    filteredPatients.forEach(p => {
      const dId = p.doctor_id || 'unassigned';
      const dName = p.doctor_name || 'Unassigned';
      if (!analytics[dId]) {
        analytics[dId] = { name: dName, count: 0, highRisk: 0, normal: 0 };
      }
      analytics[dId].count++;
      if (p.risk_score > 7) analytics[dId].highRisk++;
      else analytics[dId].normal++;
    });
    
    return Object.values(analytics);
  }, [filteredPatients]);

  if (!isOpen) return null;

  const setDateRange = (range: 'today' | 'week' | 'month' | 'year') => {
    const to = new Date();
    const from = new Date();
    if (range === 'today') {
      // already today
    } else if (range === 'week') {
      from.setDate(from.getDate() - 7);
    } else if (range === 'month') {
      from.setMonth(from.getMonth() - 1);
    } else if (range === 'year') {
      from.setFullYear(from.getFullYear() - 1);
    }
    updateFilter('dateFrom', from.toISOString().split('T')[0]);
    updateFilter('dateTo', to.toISOString().split('T')[0]);
  };

  const toggleGender = (g: 'Male' | 'Female' | 'Other') => {
    const next = filters.genders.includes(g)
      ? filters.genders.filter(x => x !== g)
      : [...filters.genders, g];
    updateFilter('genders', next);
  };

  const toggleSymptom = (s: string) => {
    const next = filters.symptoms.includes(s)
      ? filters.symptoms.filter(x => x !== s)
      : [...filters.symptoms, s];
    updateFilter('symptoms', next);
  };

  const runExport = async (type: 'pdf' | 'csv' | 'json') => {
    setExportingAs(type);
    await new Promise(r => setTimeout(r, 600));
    
    try {
      const dataToExport = exportMode === 'detailed' ? filteredPatients : doctorAnalytics;
      
      if (type === 'pdf') {
        exportPDF(dataToExport, doctorName, hospitalName, filters);
      } else if (type === 'csv') {
        exportCSV(dataToExport, filters);
      } else if (type === 'json') {
        exportJSON(dataToExport, filters);
      }
      
      setToastMessage(`Exported ${dataToExport.length} items as ${type.toUpperCase()}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setExportingAs(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />
      
      {/* Panel */}
      <div className="relative w-full max-w-[450px] bg-white h-full shadow-2xl flex flex-col border-l border-slate-100 animate-in slide-in-from-right duration-500">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
              <Filter size={20} className="text-blue-600" /> Filter & <span className="text-blue-600">Export</span>
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
              {filteredPatients.length} Data points available
            </p>
          </div>
          <button onClick={onClose} className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Filters */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-10 custom-scrollbar">
          
          {/* Export Mode Toggle */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              Export Type <div className="h-px bg-slate-100 flex-1" />
            </h3>
            <div className="flex p-1 bg-slate-100 rounded-2xl">
              <button 
                onClick={() => setExportMode('detailed')}
                className={cn(
                  "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                  exportMode === 'detailed' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"
                )}
              >
                <User size={14} /> Patient Detail
              </button>
              <button 
                onClick={() => setExportMode('doctor_summary')}
                className={cn(
                  "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                  exportMode === 'doctor_summary' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"
                )}
              >
                <BarChart3 size={14} /> Doctor Analytics
              </button>
            </div>
          </div>

          {/* Date range */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              Clinical Period <div className="h-px bg-slate-100 flex-1" />
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">From</label>
                <input type="date" value={filters.dateFrom || ''} onChange={e => updateFilter('dateFrom', e.target.value)}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-100 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">To</label>
                <input type="date" value={filters.dateTo || ''} onChange={e => updateFilter('dateTo', e.target.value)}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-100 transition-all" />
              </div>
            </div>
            <div className="flex gap-2">
              {['today', 'week', 'month', 'year'].map(r => (
                <button key={r} onClick={() => setDateRange(r as any)} 
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-white hover:text-blue-600 transition-all">
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Doctor Filter */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              Physician Scope <div className="h-px bg-slate-100 flex-1" />
            </h3>
            <div className="relative group">
              <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600" size={16} />
              <select 
                value={filters.doctorId || ''} 
                onChange={e => updateFilter('doctorId', e.target.value)}
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 text-xs font-bold appearance-none focus:ring-4 focus:ring-blue-100 transition-all"
              >
                <option value="">All Organizations Doctors</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.username || d.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
          </div>

          {/* Gender Filter */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              Patient Profile <div className="h-px bg-slate-100 flex-1" />
            </h3>
            <div className="flex gap-3">
              {(['Male', 'Female', 'Other'] as const).map(g => (
                <button key={g} onClick={() => toggleGender(g)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                    filters.genders.includes(g) ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100" : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
                  )}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Risk Range */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              Risk Severity (1-10) <div className="h-px bg-slate-100 flex-1" />
            </h3>
            <div className="px-2">
              <Slider 
                range 
                min={1} 
                max={10} 
                defaultValue={[filters.riskMin || 1, filters.riskMax || 10]}
                onChange={(val: any) => { updateFilter('riskMin', val[0]); updateFilter('riskMax', val[1]); }}
                styles={{ 
                  track: { backgroundColor: '#2563eb', height: 4 }, 
                  handle: { borderColor: '#2563eb', backgroundColor: '#fff', opacity: 1, width: 16, height: 16, marginTop: -6 } 
                }} 
              />
              <div className="flex justify-between mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>Min: {filters.riskMin || 1}</span>
                <span>Max: {filters.riskMax || 10}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-slate-50 bg-slate-50/30 space-y-6">
          <div className="flex justify-between items-center">
            <button onClick={clearFilters} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">
              Reset Filters
            </button>
            <span className="text-[10px] font-black text-slate-900 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
              {exportMode === 'detailed' ? 'Exporting Rows' : 'Exporting Analytics'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'pdf', label: 'PDF', icon: '📄', color: 'hover:border-red-200 hover:bg-red-50 hover:text-red-700' },
              { id: 'csv', label: 'CSV', icon: '📊', color: 'hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700' },
              { id: 'json', label: 'JSON', icon: '🗂', color: 'hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700' }
            ].map(btn => (
              <Button 
                key={btn.id}
                variant="outline" 
                className={cn("h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all", btn.color)}
                onClick={() => runExport(btn.id as any)}
                disabled={!!exportingAs || filteredPatients.length === 0}
              >
                {exportingAs === btn.id ? <div className="h-4 w-4 border-2 border-slate-400 border-t-transparent animate-spin rounded-full" /> : `${btn.icon} ${btn.label}`}
              </Button>
            ))}
          </div>
        </div>

        {/* Success Notification */}
        {showToast && (
          <div className="absolute bottom-32 left-8 right-8 bg-emerald-600 text-white p-4 rounded-2xl flex items-center gap-3 shadow-2xl shadow-emerald-200 animate-in slide-in-from-bottom-4 duration-500">
            <CheckCircle2 size={20} className="text-emerald-100 shrink-0" />
            <p className="text-[11px] font-black uppercase tracking-widest">{toastMessage}</p>
          </div>
        )}

      </div>
    </div>
  );
}
