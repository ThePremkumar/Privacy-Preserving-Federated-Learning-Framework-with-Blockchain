'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  ChevronRight, 
  ShieldCheck, 
  ShieldAlert, 
  ShieldQuestion, 
  FileText, 
  Calendar,
  Clock,
  ArrowUpRight,
  UploadCloud,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  BrainCircuit,
  Download,
  FileJson,
  FileSpreadsheet,
  Send,
  MoreVertical,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
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

export default function PatientsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [sendToAdminPatient, setSendToAdminPatient] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'patients' | 'doctors'>('doctors');
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
      
    // Enforce role-based export restriction: doctors can only export their own patients
    if (user?.role === 'doctor') {
      dataToExport = dataToExport.filter(p => p.created_by === user?.id);
      if (dataToExport.length === 0) {
        alert('You do not have permission to export the selected patient records. Doctors can only export records they registered.');
        return;
      }
    }
    
    if (format === 'pdf') exportPDF(dataToExport, user?.username || 'Doctor', user?.hospital_name || 'HealthConnect Central', filters);
    if (format === 'csv') exportCSV(dataToExport, filters);
    if (format === 'json') exportJSON(dataToExport, filters);
  };

  const handleViewPatient = (id: string) => {
    router.push(`/dashboard/patients/${id}`);
  };

  const handleDeletePatient = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}'s record?`)) return;
    try {
      await api.delete(`/patients/${id}`);
      fetchPatients();
    } catch (err) {
      alert('Failed to delete patient');
    }
  };

  return (
    <RoleGuard allowedRoles={['doctor', 'hospital']}>
    <div className="space-y-12 pb-20 relative">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-emerald-100/20 rounded-full blur-[100px] pointer-events-none" />

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

      {/* --- HEADER SECTION ----------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-lg">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest italic">Clinical Data Ledger v4.0</span>
            </div>
            <div className="h-1 w-1 bg-slate-200 rounded-full"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic flex items-center gap-2">
              <Clock size={12} className="text-slate-300" /> Auto-sync: 5m
            </span>
          </div>
          <h1 className="text-5xl font-black italic tracking-tighter text-slate-900 leading-none">
            Patient <span className="text-blue-600 underline decoration-blue-100 underline-offset-[12px]">Direct Registry</span>
          </h1>
          <div className="flex items-center gap-4 pt-2">
            <div className="flex -space-x-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                  {String.fromCharCode(64+i)}
                </div>
              ))}
              <div className="h-8 w-8 rounded-full border-2 border-white bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
                +{patients.length}
              </div>
            </div>
            <p className="text-sm font-bold text-slate-400 italic max-w-lg mt-4 leading-relaxed flex items-center gap-2">
               <ShieldCheck size={16} className="text-emerald-500" /> Secure Phygital Records Management
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <Button 
            variant="outline" 
            className="h-14 px-8 rounded-2xl border-slate-200 bg-white/50 backdrop-blur-md font-black uppercase tracking-widest text-[10px] text-slate-700 hover:bg-white hover:border-blue-200 hover:text-blue-600 transition-all shadow-xl shadow-slate-200/50"
            onClick={() => setShowFilterPanel(true)}
          >
            <Filter size={16} className="mr-3" />
            Insights & Filters {activeFilterCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white rounded-full text-[8px]">
                {activeFilterCount}
              </span>
            )}
          </Button>

          <Button 
            className="h-14 px-8 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 transition-all shadow-2xl shadow-blue-200 group"
            onClick={() => router.push('/dashboard/patients/new')}
          >
            Register Patient
            <div className="ml-3 h-6 w-6 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <Plus size={14} />
            </div>
          </Button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="bg-slate-900/95 backdrop-blur-xl text-white px-8 py-4 rounded-[32px] flex items-center justify-between shadow-2xl shadow-blue-900/20 border border-white/10">
            <div className="flex items-center gap-6">
              <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-xl italic shadow-lg shadow-blue-500/20">
                {selectedIds.length}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 italic">Batch Management</p>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Records ready for secure extraction</p>
              </div>
            </div>
            <div className="flex gap-4">
              <button className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors" onClick={() => setSelectedIds([])}>
                Cancel
              </button>
              <Button size="sm" className="bg-white text-slate-900 hover:bg-blue-50 font-black text-[10px] uppercase tracking-widest rounded-xl px-6" onClick={() => handleExport('csv')}>
                Export Ledger
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- KPI SECTION ------------------------------------- */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 relative z-10">
        {[
          { label: 'Total Patients', value: isLoading ? '...' : patients.length.toString(), sub: 'Registered to Node', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Risk Indices', value: patients.filter(p => (p.medical_history?.length || 0) > 3).length.toString(), sub: 'High Complexity Cases', icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Ledger Status', value: 'SYNCED', sub: 'Blockchain Integrity ✓', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Data Density', value: patients.length > 0 ? (patients.reduce((acc, p) => acc + (p.reports?.length || 0), 0)).toString() : '0', sub: 'Clinical Documents', icon: FileText, color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map((stat, i) => (
          <div key={i} className="group relative">
            <div className="absolute inset-0 bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 group-hover:shadow-blue-200/40 transition-all duration-500" />
            <div className="relative p-8 flex flex-col gap-6">
              <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center border border-white/5 shadow-lg", stat.bg, stat.color)}>
                <stat.icon size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className={cn("text-4xl font-black italic tracking-tighter leading-none", stat.color)}>{stat.value}</p>
                  <span className="text-[10px] font-bold text-slate-400 italic uppercase">{stat.sub}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- DATABASE SECTION -------------------------------- */}
      <div className="relative z-10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="h-14 w-1 bg-blue-600 rounded-full" />
            <div>
              <h2 className="text-3xl font-black italic text-slate-900 tracking-tight">Clinical <span className="text-blue-600 underline underline-offset-8 decoration-blue-100">Database</span></h2>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Quantum-secure Ledger Protocol</p>
            </div>
          </div>
          
          <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40">
            {[
              { id: 'doctors', label: 'Doctor Load', icon: Users },
              { id: 'patients', label: 'Direct Registry', icon: FileText },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id as any)}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                  viewMode === tab.id 
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" 
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                )}
              >
                <tab.icon size={14} />
                <span className="italic">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
          <div className="p-8 border-b border-slate-50 bg-slate-50/30">
            <div className="relative group max-w-2xl">
               <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
               <input 
                 className="h-16 w-full rounded-2xl bg-white pl-14 pr-6 text-sm font-black italic tracking-tight border border-slate-100 transition-all focus:ring-4 focus:ring-blue-100 focus:outline-none shadow-sm" 
                 placeholder="Locate patient by name, biometric ID or UUID..." 
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
               />
               <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                 <ActiveFilterChips filters={filters} updateFilter={updateFilter} clearFilters={clearFilters} doctors={doctors} />
               </div>
            </div>
          </div>

          <div className="p-0 overflow-x-auto custom-scrollbar">
           {isLoading ? (
             <div className="p-20 flex flex-col items-center justify-center text-slate-300 gap-4">
                <Loader2 size={40} className="animate-spin" />
                <span className="text-xs font-black uppercase tracking-widest italic">Accessing Ledger...</span>
             </div>
           ) : (
              viewMode === 'patients' ? (
                <table className="w-full text-left border-collapse min-w-[1000px]">
                   <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-50">
                         <th className="px-6 py-5">
                            <div 
                              className={cn(
                                "h-5 w-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all",
                                selectedIds.length === finalFilteredPatients.length && finalFilteredPatients.length > 0
                                  ? "bg-blue-600 border-blue-600 text-white" 
                                  : "bg-white border-slate-200"
                              )}
                              onClick={handleToggleSelectAll}
                            >
                              {selectedIds.length === finalFilteredPatients.length && finalFilteredPatients.length > 0 && <Check size={14} strokeWidth={4} />}
                            </div>
                         </th>
                         <th className="px-8 py-5 text-xs font-black uppercase tracking-[0.2em] text-slate-400">Patient Profile</th>
                         <th className="px-8 py-5 text-xs font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                         <th className="px-8 py-5 text-xs font-black uppercase tracking-[0.2em] text-slate-400">History</th>
                         <th className="px-8 py-5 text-xs font-black uppercase tracking-[0.2em] text-slate-400">Internal Risk</th>
                         <th className="px-8 py-5 text-xs font-black uppercase tracking-[0.2em] text-slate-400">Registered</th>
                         <th className="px-8 py-5 text-xs font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
                      </tr>
                   </thead>
                    <tbody className="divide-y divide-slate-50">
                       {finalFilteredPatients.length === 0 ? (
                          <tr><td colSpan={7} className="px-8 py-20 text-center text-slate-400 font-black italic uppercase tracking-[0.2em]">Zero records found in local ledger.</td></tr>
                       ) : (
                        finalFilteredPatients.map(patient => (
                          <tr 
                            key={patient._id} 
                            className={cn(
                              "hover:bg-blue-50/20 transition-all group cursor-pointer",
                              selectedIds.includes(patient._id) && "bg-blue-50/50"
                            )}
                            onClick={() => handleToggleSelect(patient._id)}
                          >
                            <td className="px-8 py-6" onClick={(e) => e.stopPropagation()}>
                              <div 
                                className={cn(
                                  "h-6 w-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all",
                                  selectedIds.includes(patient._id)
                                    ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20" 
                                    : "bg-white border-slate-200"
                                )}
                                onClick={() => handleToggleSelect(patient._id)}
                              >
                                {selectedIds.includes(patient._id) && <Check size={14} strokeWidth={4} />}
                              </div>
                            </td>
                            <td className="px-8 py-6" onClick={() => handleViewPatient(patient._id)}>
                               <div className="flex items-center gap-5">
                                  <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-white border border-slate-100 shadow-lg shadow-slate-200/50 text-blue-600 font-black text-xl italic group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                     {patient.name.charAt(0)}
                                  </div>
                                  <div className="flex flex-col">
                                     <span className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight italic">{patient.name}</span>
                                     <div className="flex items-center gap-2 mt-1">
                                       <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                                          {patient.patient_id_manual || patient._id.slice(-8)}
                                       </span>
                                       <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                         {patient.gender} • {patient.age}y
                                       </span>
                                     </div>
                                  </div>
                               </div>
                            </td>
                            <td className="px-8 py-6">
                               <div className="flex flex-col gap-1.5">
                                 <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border bg-emerald-50 text-emerald-700 border-emerald-100 w-fit">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Active
                                 </div>
                                 {patient.reports?.length > 0 && (
                                   <div className="flex items-center gap-1.5 text-blue-600">
                                      <FileText size={12} />
                                      <span className="text-xs font-black uppercase tracking-widest italic">{patient.reports.length} Reports</span>
                                   </div>
                                 )}
                               </div>
                            </td>
                            <td className="px-8 py-6">
                               <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                                  {patient.medical_history?.slice(0, 2).map((h: string, i: number) => (
                                    <span key={i} className="px-3 py-1 bg-slate-100 rounded-lg text-[11px] font-black uppercase text-slate-600 border border-slate-200/50">{h}</span>
                                  ))}
                                  {patient.medical_history?.length > 2 && <span className="text-[10px] font-black text-slate-300 italic">+{patient.medical_history.length - 2} More</span>}
                               </div>
                            </td>
                            <td className="px-8 py-6">
                               <div className={cn(
                                  "px-4 py-1.5 rounded-xl inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest border",
                                  (patient.medical_history?.length || 0) > 3 
                                    ? "bg-rose-50 text-rose-600 border-rose-100" 
                                    : patient.medical_history?.length > 1 
                                      ? "bg-amber-50 text-amber-600 border-amber-100" 
                                      : "bg-emerald-50 text-emerald-600 border-emerald-100"
                               )}>
                                  <ShieldAlert size={12} />
                                  {(patient.medical_history?.length || 0) > 3 ? "Critical" : patient.medical_history?.length > 1 ? "Moderate" : "Low"} Risk
                               </div>
                            </td>
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase italic tracking-tighter">
                                  <Clock size={12} /> {patient.created_at ? new Date(patient.created_at).toLocaleDateString() : 'N/A'}
                               </div>
                            </td>
                            <td className="px-8 py-6 text-right">
                               <div className="flex items-center justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                  <Button 
                                     size="icon" 
                                     variant="ghost" 
                                     className="h-12 w-12 rounded-2xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all"
                                     onClick={(e) => { e.stopPropagation(); setSendToAdminPatient(patient); }}
                                  >
                                     <Send size={18} />
                                  </Button>
                                  <Button 
                                     size="icon" 
                                     variant="ghost" 
                                     className="h-12 w-12 rounded-2xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all"
                                     onClick={(e) => { e.stopPropagation(); handleViewPatient(patient._id); }}
                                  >
                                     <ChevronRight size={22} />
                                  </Button>
                               </div>
                            </td>
                          </tr>
                        ))
                       )}
                    </tbody>
                </table>
              ) : (
                <table className="w-full text-left border-collapse min-w-[1000px]">
                   <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-50">
                         <th className="px-10 py-6 text-xs font-black uppercase tracking-[0.2em] text-slate-400">Doctor Profile</th>
                         <th className="px-10 py-6 text-xs font-black uppercase tracking-[0.2em] text-slate-400">Patient Load</th>
                         <th className="px-10 py-6 text-xs font-black uppercase tracking-[0.2em] text-slate-400 text-center">Risk Indices</th>
                         <th className="px-10 py-6 text-xs font-black uppercase tracking-[0.2em] text-slate-400">Normal Cases</th>
                         <th className="px-10 py-6 text-xs font-black uppercase tracking-[0.2em] text-slate-400">Risk Ratio</th>
                         <th className="px-10 py-6 text-xs font-black uppercase tracking-[0.2em] text-slate-400 text-right">Activity</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {doctors.map(doctor => {
                        const drPatients = patients.filter(p => 
                          (p.created_by?.toString() === doctor.id?.toString()) || 
                          (p.created_by?.toString() === doctor._id?.toString())
                        );
                        const riskPatients = drPatients.filter(p => (p.medical_history?.length || 0) > 1);
                        const normalPatients = drPatients.length - riskPatients.length;
                        const ratio = drPatients.length > 0 ? (riskPatients.length / drPatients.length) * 100 : 0;
                        
                        return (
                          <tr key={doctor.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-10 py-8">
                               <div className="flex items-center gap-5">
                                  <div className="h-16 w-16 flex items-center justify-center rounded-3xl bg-slate-900 text-white font-black text-2xl italic shadow-xl shadow-slate-900/10">
                                     {doctor.name.charAt(0)}
                                  </div>
                                  <div className="flex flex-col">
                                     <span className="text-xl font-black text-slate-900 italic tracking-tight">{doctor.name}</span>
                                     <span className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] mt-1">
                                       {doctor.specialization || 'General Practitioner'}
                                     </span>
                                  </div>
                               </div>
                            </td>
                            <td className="px-10 py-8">
                               <div className="flex flex-col">
                                 <span className="text-4xl font-black italic text-slate-900 tracking-tighter">{drPatients.length}</span>
                                 <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">Registered</span>
                               </div>
                            </td>
                            <td className="px-10 py-8">
                               <div className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-rose-50/50 border border-rose-100">
                                  <span className="text-2xl font-black text-rose-600 italic tracking-tighter">{riskPatients.length}</span>
                                  <span className="text-[11px] font-black text-rose-400 uppercase tracking-widest">Complex Cases</span>
                               </div>
                            </td>
                            <td className="px-10 py-8">
                               <div className="flex flex-col">
                                  <span className="text-2xl font-black text-emerald-600 italic tracking-tighter">{normalPatients}</span>
                                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">Standard Records</span>
                               </div>
                            </td>
                            <td className="px-10 py-8">
                               <div className="w-full max-w-[140px]">
                                  <div className="flex justify-between items-center mb-2">
                                     <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Concentration</span>
                                     <span className="text-[11px] font-black text-rose-600 italic">{ratio.toFixed(0)}%</span>
                                  </div>
                                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                     <div className="bg-rose-500 h-full transition-all duration-1000" style={{ width: `${ratio}%` }} />
                                  </div>
                               </div>
                            </td>
                            <td className="px-10 py-8 text-right">
                               <Button 
                                  className="h-12 px-8 rounded-2xl bg-white border-2 border-slate-100 text-slate-900 font-black text-[10px] uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-xl shadow-slate-100"
                                  onClick={() => {
                                    updateFilter('doctor_id', doctor.id);
                                    setViewMode('patients');
                                  }}
                               >
                                  View Records <ChevronRight size={18} className="ml-2" />
                                </Button>
                            </td>
                          </tr>
                        );
                      })}
                   </tbody>
                </table>
              )
            )}
           </div>
        </div>
      </div>
      
      {/* --- FOOTER CARDS ----------------------------------- */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 mt-12 relative z-10">
        <div className="group relative">
           <div className="absolute inset-0 bg-slate-900 rounded-[40px] shadow-2xl shadow-slate-900/20" />
           <div className="relative p-10 overflow-hidden">
              <div className="absolute top-0 right-0 p-12 text-blue-600/10 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-700">
                 <ShieldCheck size={320} />
              </div>
              <div className="relative space-y-6">
                 <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600/20 text-blue-400 rounded-full text-xs font-black uppercase tracking-[0.2em] border border-blue-600/30 italic">
                    HIPAA Shield Active v2.0
                 </div>
                 <h3 className="text-4xl font-black italic text-white leading-tight">Universal <span className="text-blue-500">Clinical Ledger</span></h3>
                 <p className="text-white/50 text-base font-medium leading-relaxed max-w-md">
                    Enterprise-grade patient records management with zero-leakage guarantees. Every entry is end-to-end encrypted and ready for privacy-preserving federated training.
                 </p>
                 <Button className="h-12 px-8 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-blue-600/20"
                    onClick={() => setShowAuditModal(true)}
                  >
                    Audit Integrity Log
                 </Button>
              </div>
           </div>
        </div>
        
        <div className="p-10 rounded-[40px] bg-white border border-slate-100 shadow-2xl shadow-slate-200/50 flex flex-col justify-between group">
           <div className="space-y-4">
              <div className="h-16 w-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-lg shadow-blue-100/50 group-hover:shadow-blue-200/50">
                 <BrainCircuit size={36} />
              </div>
              <h4 className="text-2xl font-black italic text-slate-900">Training <span className="text-blue-600 underline decoration-blue-100 underline-offset-4">Contribution</span></h4>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-sm">
                 Your clinical database fuels the collective intelligence of the global healthcare model. Every record helps optimize prediction accuracy across the network.
              </p>
           </div>
           
           <div className="flex items-center justify-between mt-8 pt-8 border-t border-slate-50">
              <div className="flex flex-col">
                 <span className="text-xs font-black text-slate-900 italic">Network Connectivity</span>
                 <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Status: OPTIMIZED</span>
              </div>
              <ArrowUpRight size={24} className="text-slate-200 group-hover:text-blue-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
           </div>
        </div>
      </div>
      {/* --- BLOCKCHAIN AUDIT MODAL --- */}
      {showAuditModal && (
        <BlockchainAuditModal onClose={() => setShowAuditModal(false)} />
      )}
    </div>
    </RoleGuard>
  );
}
