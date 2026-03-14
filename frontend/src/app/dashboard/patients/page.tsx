'use client';

import React, { useState, useEffect } from 'react';
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
  MoreVertical,
  UploadCloud,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  BrainCircuit
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RoleGuard } from '@/components/guards/RoleGuard';
import api from '@/lib/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // New Patient Form State
  const [newPatient, setNewPatient] = useState({
    name: '',
    patient_id_manual: '',
    age: '',
    gender: 'Male',
    phone: '',
    address: '',
    current_symptoms: '',
    diagnosis_notes: '',
    blood_pressure: '',
    sugar_level: '',
    heart_rate: '',
    temperature: '',
    medical_history: ''
  });
  
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [datasetFile, setDatasetFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. Create Patient Record
      const res = await api.post('/patients/', {
        ...newPatient,
        age: parseInt(newPatient.age),
        heart_rate: newPatient.heart_rate ? parseInt(newPatient.heart_rate) : undefined,
        temperature: newPatient.temperature ? parseFloat(newPatient.temperature) : undefined,
        medical_history: newPatient.medical_history.split(',').map(s => s.trim()).filter(s => s),
      });
      
      const patientId = res.data.id;

      // 2. Upload Report if exists
      if (reportFile) {
        const reportData = new FormData();
        reportData.append('file', reportFile);
        await api.post(`/patients/${patientId}/upload-report`, reportData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      // 3. Upload Dataset if exists (Integrated with Federated Learning data pipeline)
      if (datasetFile) {
        const datasetData = new FormData();
        datasetData.append('file', datasetFile);
        await api.post('/data/upload-csv', datasetData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setShowAddModal(false);
      setNewPatient({ 
        name: '', patient_id_manual: '', age: '', gender: 'Male', phone: '', address: '',
        current_symptoms: '', diagnosis_notes: '', blood_pressure: '', sugar_level: '',
        heart_rate: '', temperature: '', medical_history: '' 
      });
      setReportFile(null);
      setDatasetFile(null);
      fetchPatients();
      alert('Patient and associated data saved successfully');
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to save patient data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.patient_id_manual && p.patient_id_manual.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleGenerateReport = (id: string) => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <RoleGuard allowedRoles={['doctor']}>
    <div className="space-y-10 relative">
      {/* Generating Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md">
           <Card className="w-96 p-10 flex flex-col items-center gap-6 border-none shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="relative">
                 <div className="h-20 w-20 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
                 <FileText className="absolute inset-0 m-auto text-blue-600" size={32} />
              </div>
              <div className="text-center space-y-2">
                 <h4 className="text-xl font-black italic">Generating <span className="text-blue-600 underline">Clinical Report</span></h4>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed text-center">Aggregating predictive weights and patient history...</p>
              </div>
           </Card>
        </div>
      )}

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-4xl border-none shadow-2xl my-8">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4 px-8 pt-8">
              <div>
                <CardTitle className="text-2xl font-black">Register <span className="text-blue-600">Clinical Data</span></CardTitle>
                <CardDescription className="text-xs font-bold text-slate-400 tracking-widest uppercase">Comprehensive patient onboarding workflow</CardDescription>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setShowAddModal(false)}><X size={24}/></Button>
            </CardHeader>
            <form onSubmit={handleAddPatient}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
                {/* Left Side: Personal Info */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 border-b pb-2">Basic Identification</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</label>
                      <input required className="w-full h-11 px-4 bg-slate-50 border rounded-xl text-xs font-bold" value={newPatient.name} onChange={e => setNewPatient({...newPatient, name: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Patient ID (Manual)</label>
                      <input className="w-full h-11 px-4 bg-slate-50 border rounded-xl text-xs font-bold" value={newPatient.patient_id_manual} onChange={e => setNewPatient({...newPatient, patient_id_manual: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Age</label>
                      <input required type="number" className="w-full h-11 px-4 bg-slate-50 border rounded-xl text-xs font-bold" value={newPatient.age} onChange={e => setNewPatient({...newPatient, age: e.target.value})} />
                    </div>
                    <div className="space-y-1 col-span-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gender</label>
                       <select className="w-full h-11 px-4 bg-slate-50 border rounded-xl text-xs font-bold" value={newPatient.gender} onChange={e => setNewPatient({...newPatient, gender: e.target.value})}>
                         <option>Male</option>
                         <option>Female</option>
                         <option>Other</option>
                       </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Number</label>
                    <input className="w-full h-11 px-4 bg-slate-50 border rounded-xl text-xs font-bold" value={newPatient.phone} onChange={e => setNewPatient({...newPatient, phone: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Home Address</label>
                    <textarea className="w-full h-20 p-4 bg-slate-50 border rounded-xl text-xs font-bold" value={newPatient.address} onChange={e => setNewPatient({...newPatient, address: e.target.value})} />
                  </div>
                </div>

                {/* Right Side: Medical Details */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 border-b pb-2">Medical Status</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Blood Pressure</label>
                      <input placeholder="e.120/80" className="w-full h-11 px-4 bg-slate-50 border rounded-xl text-xs font-bold" value={newPatient.blood_pressure} onChange={e => setNewPatient({...newPatient, blood_pressure: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sugar Level</label>
                      <input placeholder="e.g. 110 mg/dL" className="w-full h-11 px-4 bg-slate-50 border rounded-xl text-xs font-bold" value={newPatient.sugar_level} onChange={e => setNewPatient({...newPatient, sugar_level: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Heart Rate (BPM)</label>
                      <input type="number" className="w-full h-11 px-4 bg-slate-50 border rounded-xl text-xs font-bold" value={newPatient.heart_rate} onChange={e => setNewPatient({...newPatient, heart_rate: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Temp (°C)</label>
                      <input type="number" step="0.1" className="w-full h-11 px-4 bg-slate-50 border rounded-xl text-xs font-bold" value={newPatient.temperature} onChange={e => setNewPatient({...newPatient, temperature: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Symptoms</label>
                    <input placeholder="e.g. Fever, Cough" className="w-full h-11 px-4 bg-slate-50 border rounded-xl text-xs font-bold" value={newPatient.current_symptoms} onChange={e => setNewPatient({...newPatient, current_symptoms: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Diagnosis Notes</label>
                    <textarea className="w-full h-20 p-4 bg-slate-50 border rounded-xl text-xs font-bold" value={newPatient.diagnosis_notes} onChange={e => setNewPatient({...newPatient, diagnosis_notes: e.target.value})} />
                  </div>
                </div>

                {/* Full Width Bottom: Files & History */}
                <div className="md:col-span-2 space-y-6 pt-4 border-t border-slate-50">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Attached Documentation</h4>
                         <div className="space-y-1">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Medical Report (PDF/Scan)</label>
                           <input type="file" accept=".pdf,image/*" className="w-full text-xs" onChange={e => setReportFile(e.target.files?.[0] || null)} />
                         </div>
                         <div className="space-y-1">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical Dataset (CSV/JSON)</label>
                           <input type="file" accept=".csv,.json" className="w-full text-xs" onChange={e => setDatasetFile(e.target.files?.[0] || null)} />
                         </div>
                      </div>
                      <div className="space-y-4">
                         <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Pre-existing History</h4>
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">History items (comma separated)</label>
                         <textarea placeholder="e.g. Asthma, Hypertension" className="w-full h-24 p-4 bg-slate-50 border rounded-xl text-xs font-bold" value={newPatient.medical_history} onChange={e => setNewPatient({...newPatient, medical_history: e.target.value})} />
                      </div>
                   </div>
                </div>
              </div>

              <div className="p-8 border-t bg-slate-50/50 flex gap-4 justify-end">
                <Button variant="outline" className="h-12 px-8 font-black uppercase tracking-widest text-[10px]" type="button" onClick={() => setShowAddModal(false)}>Discard</Button>
                <Button className="h-12 px-12 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-200" type="submit" disabled={isSubmitting}>
                   {isSubmitting ? <><Loader2 className="animate-spin mr-2" size={14}/> Processing...</> : 'Save Patient Data' }
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-tight">Patient <span className="text-blue-600">Direct Registry</span></h1>
          <p className="mt-2 text-base font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <ShieldCheck size={16} className="text-blue-600" /> Secure Phygital Records Management
          </p>
        </div>
        <div className="flex gap-4">
           <Button className="h-12 px-8 shadow-xl shadow-blue-200" onClick={() => setShowAddModal(true)}>
              Register Patient <Plus size={18} className="ml-2" />
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {[
          { label: 'Total Patients', value: isLoading ? '...' : patients.length.toString(), icon: Users, color: 'text-slate-900', bg: 'bg-white' },
          { label: 'Consent Approved', value: patients.length > 0 ? patients.length.toString() : '—', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Risk Flags', value: '0', icon: ShieldQuestion, color: 'text-amber-600', bg: 'bg-amber-50' },
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
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="bg-slate-50/50 border-b border-slate-50">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Patient Profile</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">History</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Internal Risk</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Registered</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {filteredPatients.length === 0 ? (
                    <tr><td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-bold">No patients matching criteria.</td></tr>
                 ) : (
                  filteredPatients.map(patient => (
                    <tr key={patient._id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                       <td className="px-8 py-6">
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
                       <td className="px-8 py-6">
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
                       <td className="px-8 py-6">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                             {patient.medical_history?.slice(0, 2).map((h: string, i: number) => (
                               <span key={i} className="px-2 py-0.5 bg-slate-100 rounded text-[8px] font-bold uppercase text-slate-500">{h}</span>
                             ))}
                             {patient.medical_history?.length > 2 && <span className="text-[8px] font-black text-slate-300">+{patient.medical_history.length - 2} More</span>}
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className={cn(
                             "text-[10px] font-black uppercase tracking-widest",
                             patient.medical_history?.length > 2 ? "text-amber-600" : "text-emerald-500"
                          )}>
                             {patient.medical_history?.length > 2 ? "Moderate" : "Low"} Risk Profile
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase italic">
                             <Clock size={12} /> {patient.created_at ? new Date(patient.created_at).toLocaleDateString() : 'N/A'}
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                             <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-9 w-9 text-slate-300 hover:text-blue-600 hover:bg-blue-50"
                                onClick={(e) => { e.stopPropagation(); handleGenerateReport(patient._id); }}
                             >
                                <FileText size={18} />
                             </Button>
                             <Button size="icon" variant="ghost" className="h-9 w-9 text-slate-300 hover:text-blue-600 hover:bg-blue-50">
                                <ShieldCheck size={18} />
                             </Button>
                             <Button size="icon" variant="ghost" className="h-9 w-9 text-slate-300 hover:text-red-500 hover:bg-red-50">
                                <MoreVertical size={18} />
                             </Button>
                          </div>
                       </td>
                    </tr>
                  ))
                 )}
              </tbody>
           </table>
           )}
        </CardContent>
      </Card>
      
      {/* Sovereignty Info remains same but text updated for consistency */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 pb-10">
        <Card className="border-none shadow-2xl shadow-slate-100 bg-slate-900 text-white p-8 overflow-hidden relative">
           <div className="absolute top-0 right-0 p-12 text-blue-600/10 transform translate-x-1/4 -translate-y-1/4">
              <ShieldCheck size={280} />
           </div>
           <div className="relative space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-600/30">
                 HIPA Shield Active
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
