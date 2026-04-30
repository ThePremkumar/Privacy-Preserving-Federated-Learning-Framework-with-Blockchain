import React, { useState } from 'react';
import { X, Search, FileText, Download, Filter, ChevronDown, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PatientFilters } from '@/lib/patientFilters';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { cn } from '@/lib/utils';
import { exportPDF, exportCSV, exportJSON } from '@/lib/exportPatients';

interface FilterExportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: PatientFilters;
  updateFilter: <K extends keyof PatientFilters>(key: K, value: PatientFilters[K]) => void;
  clearFilters: () => void;
  filteredPatients: any[];
  doctorName: string;
  hospitalName: string;
}

const COMMON_SYMPTOMS = ['Fever', 'Headache', 'Chest pain', 'Shortness of breath', 'Fatigue', 'Nausea', 'Dizziness'];

export function FilterExportPanel({ 
  isOpen, onClose, filters, updateFilter, clearFilters, filteredPatients, doctorName, hospitalName
}: FilterExportPanelProps) {
  const [symptomSearch, setSymptomSearch] = useState('');
  const [exportingAs, setExportingAs] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  if (!isOpen) return null;

  const setDateRange = (range: 'today' | 'week' | 'month' | '3month' | 'year') => {
    const to = new Date();
    const from = new Date();
    if (range === 'today') {
      // already today
    } else if (range === 'week') {
      const day = from.getDay() || 7; 
      if(day !== 1) from.setHours(-24 * (day - 1)); 
    } else if (range === 'month') {
      from.setDate(1);
    } else if (range === '3month') {
      from.setDate(from.getDate() - 90);
    } else if (range === 'year') {
      from.setMonth(0, 1);
    }
    updateFilter('dateFrom', from.toISOString().split('T')[0]);
    updateFilter('dateTo', to.toISOString().split('T')[0]);
  };

  const isQuickDate = (range: string) => {
    // Basic logic to highlight if it matches roughly. Just checking if from/to are set
    return false; // Could be implemented more robustly
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

  const addSymptomSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && symptomSearch.trim()) {
      e.preventDefault();
      if (!filters.symptoms.includes(symptomSearch.trim())) {
        updateFilter('symptoms', [...filters.symptoms, symptomSearch.trim()]);
      }
      setSymptomSearch('');
    }
  };

  const runExport = async (type: 'pdf' | 'csv' | 'json') => {
    setExportingAs(type);
    
    // Slight delay to allow UI to show loading state
    await new Promise(r => setTimeout(r, 500));
    
    try {
      if (type === 'pdf') {
        exportPDF(filteredPatients, doctorName, hospitalName, filters);
      } else if (type === 'csv') {
        exportCSV(filteredPatients, filters);
      } else if (type === 'json') {
        exportJSON(filteredPatients, filters);
      }
      
      setToastMessage(`Exported ${filteredPatients.length} records as ${type.toUpperCase()}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (e) {
      console.error(e);
      alert('Failed to export');
    } finally {
      setExportingAs(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={onClose} />
      
      {/* Panel */}
      <div className="relative w-full max-w-[420px] bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Filter size={18} className="text-blue-600" /> Filter & Export Records
            </h2>
            <p className="text-sm font-bold text-slate-500 mt-1">
              Showing: <span className="text-blue-600">{filteredPatients.length}</span> patients
            </p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900">
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Filters */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Date range */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              Date range <div className="h-px bg-slate-100 flex-1" />
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">From date</label>
                <input type="date" value={filters.dateFrom || ''} onChange={e => updateFilter('dateFrom', e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">To date</label>
                <input type="date" value={filters.dateTo || ''} onChange={e => updateFilter('dateTo', e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] font-bold text-slate-400 self-center">Quick:</span>
              {(['today', 'week', 'month', '3month'] as const).map(range => (
                <button key={range} type="button" onClick={() => setDateRange(range)}
                  className="px-2.5 py-1 text-[10px] font-bold border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50">
                  {range === 'today' ? 'Today' : range === 'week' ? 'This week' : range === 'month' ? 'This month' : 'Last 3 mo'}
                </button>
              ))}
            </div>
          </div>

          {/* Gender */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              Gender <div className="h-px bg-slate-100 flex-1" />
            </h3>
            <div className="flex gap-2">
              {(['Male', 'Female', 'Other'] as const).map(g => (
                <button key={g} onClick={() => toggleGender(g)}
                  className={cn("px-4 py-1.5 text-xs font-bold rounded-full border transition-colors",
                    filters.genders.includes(g) ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  )}>
                  {filters.genders.includes(g) && "✓ "} {g}
                </button>
              ))}
            </div>
          </div>

          {/* Age range */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              Age range <div className="h-px bg-slate-100 flex-1" />
            </h3>
            <div className="flex items-center gap-4 px-2 pt-2">
              <span className="text-xs font-bold text-slate-500 w-8">Min</span>
              <div className="flex-1">
                <Slider range min={0} max={120} value={[filters.ageMin, filters.ageMax]} 
                  onChange={(val: any) => { updateFilter('ageMin', val[0]); updateFilter('ageMax', val[1]); }}
                  styles={{ track: { backgroundColor: '#185FA5' }, handle: { borderColor: '#185FA5', backgroundColor: '#fff', opacity: 1 } }} />
              </div>
              <span className="text-xs font-bold text-slate-500 w-8 text-right">Max</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <input type="number" min={0} max={120} value={filters.ageMin} onChange={e => updateFilter('ageMin', Number(e.target.value))} className="w-16 text-xs px-2 py-1 border border-slate-200 rounded text-center" />
              <span className="text-xs font-bold text-slate-500">Ages {filters.ageMin} – {filters.ageMax}</span>
              <input type="number" min={0} max={120} value={filters.ageMax} onChange={e => updateFilter('ageMax', Number(e.target.value))} className="w-16 text-xs px-2 py-1 border border-slate-200 rounded text-center" />
            </div>
          </div>

          {/* Vitals / Risk */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              Risk / Vitals <div className="h-px bg-slate-100 flex-1" />
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                  Blood pressure {filters.bloodPressure !== 'any' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                </label>
                <select value={filters.bloodPressure} onChange={e => updateFilter('bloodPressure', e.target.value as any)}
                  className="w-full mt-1 text-xs py-2 px-2 border border-slate-200 rounded-lg">
                  <option value="any">Any</option>
                  <option value="normal">Normal (&lt; 120/80)</option>
                  <option value="elevated">Elevated (120-129)</option>
                  <option value="high">High (≥ 130)</option>
                  <option value="critical">Critical (≥ 180)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                  Sugar level {filters.sugarLevel !== 'any' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                </label>
                <select value={filters.sugarLevel} onChange={e => updateFilter('sugarLevel', e.target.value as any)}
                  className="w-full mt-1 text-xs py-2 px-2 border border-slate-200 rounded-lg">
                  <option value="any">Any</option>
                  <option value="normal">Normal (70-140)</option>
                  <option value="prediabetic">Pre-diabetic (140-200)</option>
                  <option value="diabetic">Diabetic (&gt; 200)</option>
                  <option value="low">Low (&lt; 70)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                  Heart rate {filters.heartRate !== 'any' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                </label>
                <select value={filters.heartRate} onChange={e => updateFilter('heartRate', e.target.value as any)}
                  className="w-full mt-1 text-xs py-2 px-2 border border-slate-200 rounded-lg">
                  <option value="any">Any</option>
                  <option value="normal">Normal (60-100)</option>
                  <option value="bradycardia">Bradycardia (&lt; 60)</option>
                  <option value="tachycardia">Tachycardia (&gt; 100)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                  Temperature {filters.temperature !== 'any' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                </label>
                <select value={filters.temperature} onChange={e => updateFilter('temperature', e.target.value as any)}
                  className="w-full mt-1 text-xs py-2 px-2 border border-slate-200 rounded-lg">
                  <option value="any">Any</option>
                  <option value="normal">Normal (36.1-37.2)</option>
                  <option value="lowgrade">Low-grade fever (37.3-38)</option>
                  <option value="fever">Fever (&gt; 38)</option>
                  <option value="hypothermia">Hypothermia (&lt; 36)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Diagnosis status */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              Diagnosis status <div className="h-px bg-slate-100 flex-1" />
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={filters.hasNotes} onChange={e => updateFilter('hasNotes', e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                <span className="text-sm font-bold text-slate-700">Has diagnosis notes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={filters.hasDocuments} onChange={e => updateFilter('hasDocuments', e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                <span className="text-sm font-bold text-slate-700">Has attached documents</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={filters.hasHistory} onChange={e => updateFilter('hasHistory', e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                <span className="text-sm font-bold text-slate-700">Has pre-existing history</span>
              </label>
            </div>
          </div>

          {/* Symptoms */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 flex-1">
                Symptoms <div className="h-px bg-slate-100 flex-1" />
              </h3>
              <select value={filters.symptomMode} onChange={e => updateFilter('symptomMode', e.target.value as any)}
                className="text-[10px] font-bold text-slate-500 border-none bg-transparent outline-none cursor-pointer p-0 ml-2">
                <option value="any">Match Any</option>
                <option value="all">Match All</option>
              </select>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input type="text" value={symptomSearch} onChange={e => setSymptomSearch(e.target.value)} onKeyDown={addSymptomSearch}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Search symptoms... (press Enter)" />
            </div>

            {filters.symptoms.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {filters.symptoms.map(s => (
                  <span key={s} className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded flex items-center gap-1">
                    {s} <button onClick={() => toggleSymptom(s)}><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] font-bold text-slate-400 self-center">Common:</span>
              {COMMON_SYMPTOMS.filter(s => !filters.symptoms.includes(s)).map(s => (
                <button key={s} onClick={() => toggleSymptom(s)}
                  className="px-2 py-1 bg-slate-50 border border-slate-100 text-slate-600 text-[10px] font-bold rounded hover:bg-slate-100 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Registration Source */}
          <div className="space-y-3 pb-8">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              Registration source <div className="h-px bg-slate-100 flex-1" />
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="source" checked={filters.registrationSource === 'me'} onChange={() => updateFilter('registrationSource', 'me')} className="text-blue-600 focus:ring-blue-500" />
                <span className="text-sm font-bold text-slate-700">Registered by me</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="source" checked={filters.registrationSource === 'all'} onChange={() => updateFilter('registrationSource', 'all')} className="text-blue-600 focus:ring-blue-500" />
                <span className="text-sm font-bold text-slate-700">All doctors in hospital</span>
              </label>
            </div>
          </div>
          
        </div>

        {/* Footer - Export Actions */}
        <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-4">
          <div className="flex justify-between items-center">
            <button onClick={clearFilters} className="text-xs font-bold text-slate-500 hover:text-blue-600 underline underline-offset-2 decoration-slate-300">
              Clear all filters
            </button>
          </div>

          <div>
            <p className="text-[11px] font-bold text-slate-500 mb-2">Export <span className="text-slate-900 font-black">{filteredPatients.length}</span> filtered records as:</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 text-xs border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-700 transition-colors"
                onClick={() => runExport('pdf')} disabled={!!exportingAs || filteredPatients.length === 0}>
                {exportingAs === 'pdf' ? '...' : '📄 PDF'}
              </Button>
              <Button variant="outline" className="flex-1 text-xs border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                onClick={() => runExport('csv')} disabled={!!exportingAs || filteredPatients.length === 0}>
                {exportingAs === 'csv' ? '...' : '📊 CSV'}
              </Button>
              <Button variant="outline" className="flex-1 text-xs border-slate-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                onClick={() => runExport('json')} disabled={!!exportingAs || filteredPatients.length === 0}>
                {exportingAs === 'json' ? '...' : '🗂 JSON'}
              </Button>
            </div>
          </div>
        </div>

        {/* Success Toast */}
        {showToast && (
          <div className="absolute bottom-24 left-4 right-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg animate-in slide-in-from-bottom-2">
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            <p className="text-xs font-bold">{toastMessage}</p>
          </div>
        )}

      </div>
    </div>
  );
}
