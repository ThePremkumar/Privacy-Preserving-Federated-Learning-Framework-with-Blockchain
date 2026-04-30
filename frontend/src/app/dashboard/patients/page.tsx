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

export default function PatientsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [sendToAdminPatient, setSendToAdminPatient] = useState<any | null>(null);

  const { filters, updateFilter, clearFilters, filteredPatients: hookFilteredPatients, activeFilterCount } = usePatientFilters(patients, user?.id);

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/patients/');
      setPatients(res.data);
    } catch (err) {
      console.error('Failed to fetch patients', err);
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
    <div className="space-y-10 relative">

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
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-tight">Patient <span className="text-blue-600">Direct Registry</span></h1>
          <p className="mt-2 text-base font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <ShieldCheck size={16} className="text-blue-600" /> Secure Phygital Records Management
          </p>
        </div>
        <div className="flex gap-4">
           <div className="relative">
              <Button 
                variant="outline" 
                className="h-12 px-6 border-2 border-slate-200 font-black uppercase tracking-widest text-[10px] bg-white text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                onClick={() => setShowFilterPanel(true)}
              >
                Filter & Export {activeFilterCount > 0 ? `(${activeFilterCount})` : ''} ↓
              </Button>
           </div>

           <Button className="h-12 px-8 shadow-xl shadow-blue-200" onClick={() => router.push('/dashboard/patients/new')}>
              Register Patient <Plus size={18} className="ml-2" />
           </Button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-blue-600 text-white px-6 py-4 rounded-2xl flex items-center justify-between shadow-xl shadow-blue-200 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center font-black text-sm">
              {selectedIds.length}
            </div>
            <span className="text-sm font-black italic uppercase tracking-widest">Patients selected for batch export</span>
          </div>
          <div className="flex gap-3">
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/10 font-black text-[10px] uppercase tracking-widest" onClick={() => setSelectedIds([])}>
              <X size={14} className="mr-2" /> Deselect All
            </Button>
            <Button size="sm" className="bg-white text-blue-600 hover:bg-blue-50 font-black text-[10px] uppercase tracking-widest" onClick={() => handleExport('csv')}>
              Export Selected
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {[
          { label: 'Total Patients', value: isLoading ? '...' : patients.length.toString(), icon: Users, color: 'text-slate-900', bg: 'bg-white' },
          { label: 'Consent Approved', value: patients.length > 0 ? patients.length.toString() : '—', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Risk Flags', value: patients.filter(p => (p.medical_history?.length || 0) > 3).length.toString(), icon: ShieldQuestion, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Privacy Active', value: 'YES', icon: ShieldAlert, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((stat, i) => (
          <Card key={i} className={cn("border-none shadow-xl shadow-slate-100/50 p-6", stat.bg)}>
            <div className="flex justify-between items-start">
               <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</span>
                  <span className={cn("text-3xl font-black italic", stat.color)}>{stat.value}</span>
               </div>
               <stat.icon size={24} className={stat.color} />
            </div>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-2xl shadow-slate-100 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-8 p-8">
           <div className="flex items-center gap-8 w-full">
              <div className="flex-shrink-0">
                <CardTitle className="text-2xl font-black italic">Clinical <span className="text-blue-600 underline underline-offset-8 decoration-blue-100">Database</span></CardTitle>
                <CardDescription className="text-base font-bold text-slate-400">Full audit trail enabled</CardDescription>
              </div>
              <div className="h-12 w-[1px] bg-slate-100 mx-4" />
              <div className="relative group flex-1">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-600 transition-colors" size={18} />
                 <input 
                   className="h-12 w-full rounded-xl bg-slate-50/50 pl-12 pr-4 text-xs font-black uppercase tracking-widest border border-slate-100 transition-all focus:bg-white focus:ring-4 focus:ring-blue-100 focus:outline-none" 
                   placeholder="Search names or Patient ID..." 
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                 />
                 <ActiveFilterChips filters={filters} updateFilter={updateFilter} clearFilters={clearFilters} />
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-0">
           {isLoading ? (
             <div className="p-20 flex flex-col items-center justify-center text-slate-300 gap-4">
                <Loader2 size={40} className="animate-spin" />
                <span className="text-xs font-black uppercase tracking-widest">Accessing Ledger...</span>
             </div>
           ) : (
           <div className="overflow-x-auto">
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
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Patient Profile</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">History</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Internal Risk</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Registered</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {finalFilteredPatients.length === 0 ? (
                      <tr><td colSpan={7} className="px-8 py-20 text-center text-slate-400 font-bold">No patients matching criteria.</td></tr>
                   ) : (
                    finalFilteredPatients.map(patient => (
                      <tr 
                        key={patient._id} 
                        className={cn(
                          "hover:bg-slate-50/50 transition-colors group cursor-pointer",
                          selectedIds.includes(patient._id) && "bg-blue-50/30"
                        )}
                        onClick={() => handleToggleSelect(patient._id)}
                      >
                         <td className="px-6 py-6" onClick={(e) => e.stopPropagation()}>
                           <div 
                             className={cn(
                               "h-5 w-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all",
                               selectedIds.includes(patient._id)
                                 ? "bg-blue-600 border-blue-600 text-white" 
                                 : "bg-white border-slate-200"
                             )}
                             onClick={() => handleToggleSelect(patient._id)}
                           >
                             {selectedIds.includes(patient._id) && <Check size={14} strokeWidth={4} />}
                           </div>
                         </td>
                         <td className="px-6 py-6" onClick={() => handleViewPatient(patient._id)}>
                            <div className="flex items-center gap-4">
                               <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-100 text-blue-600 font-black italic">
                                  {patient.name.charAt(0)}
                               </div>
                               <div className="flex flex-col">
                                  <span className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors">{patient.name}</span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {patient.patient_id_manual || patient._id.slice(-8)} • {patient.gender}, {patient.age}y
                                  </span>
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-6">
                            <div className="flex flex-col gap-1">
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border bg-emerald-50 text-emerald-700 border-emerald-100 w-fit">
                                 <CheckCircle2 size={10} /> Active
                              </div>
                              {patient.reports?.length > 0 && (
                                <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">
                                  {patient.reports.length} Reports Attached
                                </span>
                              )}
                            </div>
                         </td>
                         <td className="px-6 py-6">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                               {patient.medical_history?.slice(0, 2).map((h: string, i: number) => (
                                 <span key={i} className="px-2 py-0.5 bg-slate-100 rounded text-[8px] font-bold uppercase text-slate-500">{h}</span>
                               ))}
                               {patient.medical_history?.length > 2 && <span className="text-[8px] font-black text-slate-300">+{patient.medical_history.length - 2} More</span>}
                            </div>
                         </td>
                         <td className="px-6 py-6">
                            <div className={cn(
                               "text-[10px] font-black uppercase tracking-widest",
                               (patient.medical_history?.length || 0) > 3 ? "text-red-600" : patient.medical_history?.length > 1 ? "text-amber-600" : "text-emerald-500"
                            )}>
                               {(patient.medical_history?.length || 0) > 3 ? "High" : patient.medical_history?.length > 1 ? "Moderate" : "Low"} Risk
                            </div>
                         </td>
                         <td className="px-6 py-6">
                            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase italic">
                               <Clock size={12} /> {patient.created_at ? new Date(patient.created_at).toLocaleDateString() : 'N/A'}
                            </div>
                         </td>
                         <td className="px-6 py-6 text-right">
                            <div className="flex items-center justify-end gap-1">
                               <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-9 w-9 text-slate-300 hover:text-blue-600 hover:bg-blue-50"
                                  title="Send to Admin"
                                  onClick={(e) => { e.stopPropagation(); setSendToAdminPatient(patient); }}
                               >
                                  <Send size={16} />
                               </Button>
                               <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-9 w-9 text-slate-300 hover:text-blue-600 hover:bg-blue-50"
                                  title="View Details"
                                  onClick={(e) => { e.stopPropagation(); handleViewPatient(patient._id); }}
                               >
                                  <ChevronRight size={18} />
                               </Button>
                               <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-9 w-9 text-slate-300 hover:text-red-500 hover:bg-red-50"
                                  title="Delete"
                                  onClick={(e) => { e.stopPropagation(); handleDeletePatient(patient._id, patient.name); }}
                               >
                                  <XCircle size={18} />
                               </Button>
                            </div>
                         </td>
                      </tr>
                    ))
                   )}
                </tbody>
             </table>
           </div>
           )}
        </CardContent>
      </Card>
      
      {/* Bottom Info Cards */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 pb-10">
        <Card className="border-none shadow-2xl shadow-slate-100 bg-slate-900 text-white p-8 overflow-hidden relative">
           <div className="absolute top-0 right-0 p-12 text-blue-600/10 transform translate-x-1/4 -translate-y-1/4">
              <ShieldCheck size={280} />
           </div>
           <div className="relative space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-600/30">
                 HIPAA Shield Active
              </div>
              <h3 className="text-3xl font-black italic">Universal <span className="text-blue-500">Clinical Data</span></h3>
              <p className="text-white/50 text-base font-medium leading-relaxed max-w-md">
                 Manage patient records with zero-leakage guarantees. Every entry is end-to-end encrypted and ready for privacy-preserving federated training.
              </p>
           </div>
        </Card>
        
        <Card className="border-none shadow-2xl shadow-slate-100 p-8 flex items-center justify-between">
           <div className="flex flex-col gap-2">
              <h4 className="text-xl font-black italic text-slate-900">Training <span className="text-blue-600">Contribution</span></h4>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-xs">Your patient database fuels the collective intelligence of the global healthcare model.</p>
           </div>
           <div className="bg-blue-50 p-6 rounded-3xl text-blue-600">
              <BrainCircuit size={40} />
           </div>
        </Card>
      </div>
    </div>
    </RoleGuard>
  );
}
