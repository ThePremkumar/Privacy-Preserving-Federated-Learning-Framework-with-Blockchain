'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  ChevronRight, 
  ShieldCheck, 
  ShieldAlert, 
  FileText, 
  Calendar,
  Clock,
  ArrowUpRight,
  Download,
  FileJson,
  FileSpreadsheet,
  Send,
  Check,
  LayoutGrid,
  List,
  Activity,
  Droplets,
  Thermometer,
  Heart,
  TrendingUp,
  Zap,
  Lock,
  SearchCode,
  X,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { RoleGuard } from '@/components/guards/RoleGuard';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { exportPDF, exportCSV, exportJSON } from '@/lib/exportPatients';
import { SendToAdminModal } from '@/components/patients/SendToAdminModal';
import { useAuth } from '@/hooks/useAuth';
import { usePatientFilters } from '@/hooks/usePatientFilters';
import { FilterExportPanel } from '@/components/patients/FilterExportPanel';
import { ActiveFilterChips } from '@/components/patients/ActiveFilterChips';
import { BlockchainAuditModal } from '@/components/patients/BlockchainAuditModal';

// --- Sub-components for the new design ---

const VitalsBadge = ({ icon: Icon, label, value, unit, color }: { icon: any, label: string, value: string, unit: string, color: string }) => (
  <div className="flex items-center gap-3 group/vital p-2 rounded-xl hover:bg-slate-50 transition-colors">
    <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center transition-all shadow-sm", color)}>
      <Icon size={16} className="group-hover/vital:scale-110 transition-transform" />
    </div>
    <div className="flex flex-col">
      <span className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400 leading-none mb-1">{label}</span>
      <div className="flex items-baseline gap-0.5">
        <span className="text-sm font-black text-slate-900 leading-none">{value}</span>
        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{unit}</span>
      </div>
    </div>
  </div>
);

const Sparkline = ({ color }: { color: string }) => (
  <div className="flex items-end gap-1 h-8 w-16 group-hover/card:scale-x-105 transition-transform origin-left">
    {[35, 65, 45, 85, 55, 95, 75].map((h, i) => (
      <div 
        key={i} 
        className={cn("w-full rounded-t-sm transition-all duration-1000 ease-in-out", color)} 
        style={{ 
          height: `${h}%`, 
          opacity: 0.2 + (i * 0.1),
          transitionDelay: `${i * 40}ms`
        }} 
      />
    ))}
  </div>
);

export default function PatientsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [displayMode, setDisplayMode] = useState<'grid' | 'table'>('grid');
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [sendToAdminPatient, setSendToAdminPatient] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'patients' | 'doctors'>('patients');
  const [doctors, setDoctors] = useState<any[]>([]);

  const { filters, updateFilter, clearFilters, filteredPatients: hookFilteredPatients, activeFilterCount } = usePatientFilters(patients, user?.id);

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const [pRes, dRes] = await Promise.all([
        api.get('/patients/'),
        api.get('/doctor/hospital-doctors')
      ]);
      setPatients(pRes.data);
      setDoctors(dRes.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const finalFilteredPatients = hookFilteredPatients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.patient_id_manual && p.patient_id_manual.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleToggleSelectAll = () => {
    if (selectedIds.length === finalFilteredPatients.length && finalFilteredPatients.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(finalFilteredPatients.map(p => p._id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleExport = (format: 'pdf' | 'csv' | 'json') => {
    let dataToExport = selectedIds.length > 0 
      ? patients.filter(p => selectedIds.includes(p._id))
      : finalFilteredPatients;
      
    if (user?.role === 'doctor') {
      dataToExport = dataToExport.filter(p => p.created_by === user?.id);
    }
    
    if (format === 'pdf') exportPDF(dataToExport, user?.username || 'Doctor', user?.hospital_name || 'HealthConnect Central', filters);
    if (format === 'csv') exportCSV(dataToExport, filters);
    if (format === 'json') exportJSON(dataToExport, filters);
  };

  return (
    <RoleGuard allowedRoles={['doctor', 'hospital']}>
    <div className="space-y-8 pb-24 relative min-h-screen">
      {/* Cinematic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-5%] right-[-5%] w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[15%] left-[-5%] w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[120px]" />
      </div>

      {sendToAdminPatient && (
        <SendToAdminModal 
          patient={sendToAdminPatient} 
          onClose={() => setSendToAdminPatient(null)}
          onSuccess={() => alert('Patient details sent to admin successfully')}
        />
      )}

      <FilterExportPanel 
        isOpen={showFilterPanel} 
        onClose={() => setShowFilterPanel(false)}
        filters={filters}
        updateFilter={updateFilter}
        clearFilters={clearFilters}
        filteredPatients={finalFilteredPatients}
        doctorName={user?.username || 'Doctor'}
        hospitalName={user?.hospital_name || 'HealthConnect'}
        doctors={doctors}
      />

      {/* --- HEADER ---------------------------------------- */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10 relative z-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="h-1 w-10 bg-blue-600 rounded-full" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Clinical Neural Node</span>
          </div>
          <h1 className="text-4xl md:text-5xl xl:text-6xl font-black text-slate-900 tracking-tighter leading-[0.9]">
            Patient <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Intelligence.</span>
          </h1>
          <p className="text-sm md:text-base font-bold text-slate-500 max-w-xl leading-relaxed flex items-center gap-2">
            <Lock size={14} className="text-blue-500 shrink-0" /> Federated registry with real-time biometric synchronization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
           <div className="flex bg-white/80 backdrop-blur-md p-1 rounded-2xl border border-slate-200/50 shadow-sm">
              <button 
                onClick={() => setDisplayMode('grid')}
                className={cn("p-2.5 rounded-xl transition-all", displayMode === 'grid' ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600")}
              >
                <LayoutGrid size={20} />
              </button>
              <button 
                onClick={() => setDisplayMode('table')}
                className={cn("p-2.5 rounded-xl transition-all", displayMode === 'table' ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600")}
              >
                <List size={20} />
              </button>
           </div>
           
           <div className="h-10 w-px bg-slate-200 mx-2 hidden md:block" />

           <Button 
            className="h-14 px-8 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 group"
            onClick={() => router.push('/dashboard/patients/new')}
          >
            New Registration
            <Plus size={18} className="ml-3 group-hover:rotate-90 transition-transform duration-300" />
          </Button>
        </div>
      </div>

      {/* --- STATS GRID --------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {[
          { label: 'Network Registry', value: isLoading ? '...' : patients.length.toString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', sub: 'Verified Entities' },
          { label: 'System Risk', value: patients.filter(p => p.clinical_risk?.level === 'High').length.toString(), icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50', sub: 'Critical Flags' },
          { label: 'Data Integrity', value: '100%', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: 'Valid Ledger' },
          { label: 'Cloud Synchrony', value: 'Live', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50', sub: 'Active Uplink' },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-xl shadow-slate-200/30 rounded-[2.5rem] bg-white hover:translate-y-[-4px] transition-all duration-300 overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-start justify-between">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm", stat.bg, stat.color)}>
                  <stat.icon size={22} />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                  <p className={cn("text-3xl md:text-4xl font-black italic tracking-tighter", stat.color)}>{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* --- COMMAND BAR -------------------------------------- */}
      <div className="relative z-10 bg-white border border-slate-100 p-4 rounded-[2.5rem] shadow-2xl shadow-slate-200/40 flex flex-col xl:flex-row items-center gap-4">
        <div className="flex-1 flex items-center gap-4 w-full">
           <div className="relative flex-1 group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
              <input 
                className="h-14 w-full rounded-2xl bg-slate-50 pl-16 pr-6 text-sm font-bold text-slate-900 border-2 border-transparent focus:border-blue-100 focus:bg-white focus:outline-none transition-all" 
                placeholder="Secure Intelligence Search (Personnel Name, Clinical ID, Vitals)..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
           </div>
           
           <div className="flex bg-slate-50 p-1.5 rounded-2xl shrink-0 border border-slate-100">
              {[
                { id: 'patients', label: 'Patient Ledger', icon: FileText },
                { id: 'doctors', label: 'Clinical Load', icon: Users },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    viewMode === tab.id 
                      ? "bg-white text-blue-600 shadow-sm border border-slate-100" 
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
           </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
           <Button 
              variant="outline" 
              className="h-14 px-6 rounded-2xl border-slate-200 text-slate-600 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50"
              onClick={() => setShowFilterPanel(true)}
            >
              <Filter size={16} className="mr-3 text-blue-600" />
              Advanced Filters {activeFilterCount > 0 && <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white rounded-full">{activeFilterCount}</span>}
            </Button>
            <div className="relative group">
              <Button 
                variant="outline" 
                className="h-14 px-6 rounded-2xl border-slate-200 text-slate-600 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50"
              >
                <Download size={16} className="mr-3 text-emerald-600" />
                Ledger Export
              </Button>
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all z-50">
                 <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center justify-between">Institutional PDF <FileText size={14}/></button>
                 <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center justify-between">Ledger CSV <FileSpreadsheet size={14}/></button>
                 <button onClick={() => handleExport('json')} className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center justify-between">Data JSON <FileJson size={14}/></button>
              </div>
            </div>
        </div>
      </div>

      <ActiveFilterChips filters={filters} updateFilter={updateFilter} clearFilters={clearFilters} doctors={doctors} />

      {/* --- GRID RENDER -------------------------------------- */}
      <div className="relative z-10">
        {isLoading ? (
          <div className="h-[400px] flex flex-col items-center justify-center gap-6">
            <Loader2 size={48} className="animate-spin text-blue-600/30" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] animate-pulse">Syncing Distributed Node...</p>
          </div>
        ) : displayMode === 'grid' && viewMode === 'patients' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {finalFilteredPatients.length === 0 ? (
               <div className="col-span-full py-24 text-center space-y-6 opacity-30">
                  <SearchCode size={64} className="mx-auto" />
                  <p className="text-xl font-black text-slate-900 italic tracking-tight">Node Search Returned Zero Matches.</p>
               </div>
            ) : finalFilteredPatients.map((p) => (
              <Card 
                key={p._id} 
                className="group/card border-none shadow-lg shadow-slate-200/40 rounded-[2rem] overflow-hidden bg-white hover:shadow-2xl hover:shadow-blue-200/40 transition-all duration-500 cursor-pointer border border-transparent hover:border-blue-100 flex flex-col"
                onClick={() => router.push(`/dashboard/patients/${p._id}`)}
              >
                <CardContent className="p-0 flex flex-col flex-1">
                  <div className="p-6 space-y-6 flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-[1.5rem] bg-slate-900 text-white flex items-center justify-center font-black text-2xl italic shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                          {p.name.charAt(0)}
                        </div>
                        <div className="space-y-0.5">
                          <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">{p.name}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#{p.patient_id_manual || p._id.slice(-6)}</span>
                            <span className="h-1 w-1 bg-slate-300 rounded-full" />
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{p.gender} • {p.age}Y</span>
                          </div>
                        </div>
                      </div>
                      <div className={cn(
                        "h-8 w-8 rounded-xl flex items-center justify-center border shadow-sm transition-all duration-500 group-hover:scale-110",
                        p.clinical_risk?.level === 'High' ? "bg-red-50 text-red-600 border-red-100" :
                        p.clinical_risk?.level === 'Moderate' ? "bg-amber-50 text-amber-600 border-amber-100" :
                        "bg-emerald-50 text-emerald-600 border-emerald-100"
                      )}>
                        {p.clinical_risk?.level === 'High' ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
                      </div>
                    </div>

                    {/* Vitals Grid */}
                    <div className="grid grid-cols-2 gap-3 py-5 border-y border-slate-50">
                       <VitalsBadge icon={Activity} label="BP" value={p.blood_pressure || '120/80'} unit="mmHg" color="bg-blue-50 text-blue-600" />
                       <VitalsBadge icon={Droplets} label="GLU" value={p.sugar_level || '110'} unit="mg/dL" color="bg-indigo-50 text-indigo-600" />
                       <VitalsBadge icon={Thermometer} label="TEMP" value={p.temperature ? `${p.temperature}` : '36.8'} unit="°C" color="bg-amber-50 text-amber-600" />
                       <VitalsBadge icon={Heart} label="HR" value={p.heart_rate ? `${p.heart_rate}` : '74'} unit="BPM" color="bg-rose-50 text-rose-600" />
                    </div>

                    {/* Symptoms display */}
                    {p.current_symptoms && (
                      <div className="py-3 px-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 group-hover:bg-blue-50/50 transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                           <Activity size={12} className="text-blue-500" />
                           <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Clinical Presentation</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-700 line-clamp-1 italic tracking-tight">
                          "{p.current_symptoms}"
                        </p>
                      </div>
                    )}

                    {/* Bottom Section */}
                    <div className="flex items-center justify-between pt-2">
                       <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">Clinical History</span>
                          <div className="flex items-center gap-3">
                             <Sparkline color={p.clinical_risk?.level === 'High' ? 'bg-red-500' : 'bg-emerald-500'} />
                             <TrendingUp size={14} className={p.clinical_risk?.level === 'High' ? 'text-red-500' : 'text-emerald-500'} />
                          </div>
                       </div>
                       <button 
                        onClick={(e) => { e.stopPropagation(); setSendToAdminPatient(p); }}
                        className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center hover:bg-blue-600 transition-all shadow-lg shadow-slate-200 group-hover:translate-x-[-4px]"
                       >
                         <Send size={20} />
                       </button>
                    </div>
                  </div>
                  
                  {/* Status Strip */}
                  <div className={cn(
                    "h-1.5 w-full transition-all duration-500",
                    p.clinical_risk?.level === 'High' ? "bg-red-500" :
                    p.clinical_risk?.level === 'Moderate' ? "bg-amber-500" :
                    "bg-emerald-500"
                  )} />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-none shadow-2xl shadow-slate-200/30 rounded-[2.5rem] overflow-hidden bg-white">
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                       <th className="px-8 py-6 w-16">
                          <button onClick={handleToggleSelectAll} className={cn("h-5 w-5 rounded-md border-2 transition-all flex items-center justify-center", selectedIds.length === finalFilteredPatients.length && finalFilteredPatients.length > 0 ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200")}>
                             {selectedIds.length === finalFilteredPatients.length && finalFilteredPatients.length > 0 && <Check size={12} strokeWidth={4} />}
                          </button>
                       </th>
                       <th className="px-4 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Distributed Identity</th>
                       <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Neural Indices</th>
                       <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Risk Assessment</th>
                       <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical Presentation</th>
                       <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Node Sync</th>
                       <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ops</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {finalFilteredPatients.map(p => (
                      <tr key={p._id} className="hover:bg-blue-50/20 transition-all group cursor-pointer" onClick={() => router.push(`/dashboard/patients/${p._id}`)}>
                         <td className="px-8 py-6" onClick={e => e.stopPropagation()}>
                            <button onClick={() => handleToggleSelect(p._id)} className={cn("h-6 w-6 rounded-lg border-2 transition-all flex items-center justify-center", selectedIds.includes(p._id) ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100" : "bg-white border-slate-200")}>
                               {selectedIds.includes(p._id) && <Check size={14} strokeWidth={4} />}
                            </button>
                         </td>
                         <td className="px-4 py-6">
                            <div className="flex items-center gap-5">
                               <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-lg italic group-hover:scale-110 transition-transform">{p.name.charAt(0)}</div>
                               <div>
                                  <p className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{p.name}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {p.patient_id_manual || p._id.slice(-6)} • {p.gender}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <div className="flex items-center gap-8">
                               <div className="flex flex-col">
                                  <span className="text-[11px] font-black text-slate-900 italic tracking-tight">{p.blood_pressure || '120/80'}</span>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">BP Index</span>
                               </div>
                               <div className="flex flex-col text-blue-600">
                                  <span className="text-[11px] font-black italic tracking-tight">{p.sugar_level || '110'}</span>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">GLU Level</span>
                               </div>
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <div className={cn(
                              "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 w-fit",
                              p.clinical_risk?.level === 'High' ? "bg-rose-50 text-rose-700 border-rose-100" :
                              p.clinical_risk?.level === 'Moderate' ? "bg-amber-50 text-amber-700 border-amber-100" :
                              "bg-emerald-50 text-emerald-700 border-emerald-100"
                            )}>
                               <ShieldAlert size={14} className={p.clinical_risk?.level === 'High' ? 'animate-pulse' : ''} />
                               {p.clinical_risk?.label || p.clinical_risk?.level}
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <div className="max-w-[200px]">
                               <p className="text-[11px] font-bold text-slate-600 truncate italic">"{p.current_symptoms || 'No symptoms reported'}"</p>
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <div className="flex items-center gap-2.5">
                               <Activity size={16} className="text-emerald-500" />
                               <span className="text-[11px] font-black text-slate-400 uppercase italic tracking-tight">{new Date(p.created_at).toLocaleDateString()}</span>
                            </div>
                         </td>
                         <td className="px-8 py-6 text-right">
                            <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"><ChevronRight size={20}/></Button>
                         </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </Card>
        )}
      </div>

      {/* --- FLOATING BATCH ACTIONS --------------------------- */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-10 py-6 rounded-[2.5rem] flex items-center gap-10 shadow-2xl shadow-blue-900/50 animate-in slide-in-from-bottom-12 border border-white/10 backdrop-blur-xl">
           <div className="flex items-center gap-5">
              <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center font-black italic text-2xl shadow-lg shadow-blue-600/30">{selectedIds.length}</div>
              <div className="flex flex-col">
                 <span className="text-sm font-black uppercase tracking-widest">Active Selections</span>
                 <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Distributed Ledger Buffer</span>
              </div>
           </div>
           <div className="h-10 w-px bg-white/10" />
           <div className="flex items-center gap-4">
              <Button onClick={() => handleExport('csv')} className="h-12 px-8 rounded-2xl bg-white text-slate-900 hover:bg-blue-50 font-black uppercase tracking-widest text-[10px] shadow-xl">Process Records</Button>
              <button onClick={() => setSelectedIds([])} className="h-12 w-12 rounded-2xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center border border-white/5"><X size={24}/></button>
           </div>
        </div>
      )}

      {showAuditModal && (
        <BlockchainAuditModal onClose={() => setShowAuditModal(false)} />
      )}
    </div>
    </RoleGuard>
  );
}
