'use client';

import React, { useState } from 'react';
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
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const initialPatients = [
  { id: 'PAT-1082', name: 'Sam Wilson', age: 58, gender: 'Male', consent: 'Approved', expiry: '2026-12-14', lastVisit: '2d ago', risk: 'High' },
  { id: 'PAT-1083', name: 'Sarah Lee', age: 42, gender: 'Female', consent: 'Pending', expiry: 'N/A', lastVisit: '5d ago', risk: 'Medium' },
  { id: 'PAT-1084', name: 'Michael Brown', age: 31, gender: 'Male', consent: 'Expired', expiry: '2024-01-20', lastVisit: '1w ago', risk: 'Low' },
  { id: 'PAT-1085', name: 'Emma Watson', age: 64, gender: 'Female', consent: 'Approved', expiry: '2027-05-10', lastVisit: '3h ago', risk: 'High' },
];

export default function PatientsPage() {
  const [patients] = useState(initialPatients);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = (id: string) => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      alert(`Institutional AI Clinical Report for ${id} generated successfully. MD5 Hash: ${Math.random().toString(36).substring(7)}`);
    }, 2500);
  };

  return (
    <div className="space-y-10 relative">
      {isGenerating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md">
           <Card className="w-96 p-10 flex flex-col items-center gap-6 border-none shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="relative">
                 <div className="h-20 w-20 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
                 <FileText className="absolute inset-0 m-auto text-blue-600" size={32} />
              </div>
              <div className="text-center space-y-2">
                 <h4 className="text-xl font-black italic italic">Generating <span className="text-blue-600 underline">Clinical Report</span></h4>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Aggregating predictive weights and patient history from 12 nodes...</p>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                 <div className="bg-blue-600 h-full w-[70%] animate-pulse" />
              </div>
           </Card>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-tight">Patient <span className="text-blue-600">Consent Management</span></h1>
          <p className="mt-2 text-base font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <ShieldCheck size={16} className="text-blue-600" /> HIPAA Compliance & Digital Sovereignty
          </p>
        </div>
        <div className="flex gap-4">
           <Button variant="outline" className="h-12 border-2 px-8 font-black uppercase tracking-widest text-[10px]">
              Bulk Consent Update <UploadCloud size={16} className="ml-2" />
           </Button>
           <Button className="h-12 px-8 shadow-xl shadow-blue-200">
              Add New Patient <Plus size={18} className="ml-2" />
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Statistics Cards */}
        {[
          { label: 'Total Patients', value: '1,240', icon: Users, color: 'text-slate-900', bg: 'bg-white' },
          { label: 'Consent Approved', value: '1,192', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Action Required', value: '48', icon: ShieldQuestion, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Privacy Breaches', value: '0', icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50' },
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
           <div className="flex items-center gap-8">
              <div>
                <CardTitle className="text-2xl font-black italic">Institutional <span className="text-blue-600 underline underline-offset-8 decoration-blue-100">Patient Ledger</span></CardTitle>
                <CardDescription className="text-base font-bold text-slate-400">Node-level access controlled data</CardDescription>
              </div>
              <div className="h-12 w-[1px] bg-slate-100" />
              <div className="relative group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-600 transition-colors" size={18} />
                 <input 
                   className="h-12 w-80 rounded-xl bg-slate-50/50 pl-12 pr-4 text-xs font-black uppercase tracking-widest border border-slate-100 transition-all focus:bg-white focus:ring-4 focus:ring-blue-100 focus:outline-none" 
                   placeholder="Search names or PAT ID..." 
                 />
              </div>
           </div>
           <Button variant="ghost" className="text-xs font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
              Advanced Filters <Filter size={16} />
           </Button>
        </CardHeader>
        <CardContent className="p-0">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="bg-slate-50/50 border-b border-slate-50">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Patient Information</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Consent Status</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Expiry Date</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Clinical Risk</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Interaction</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {patients.map(patient => (
                    <tr key={patient.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                             <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-100 text-blue-600 font-black italic">
                                {patient.name.charAt(0)}
                             </div>
                             <div className="flex flex-col">
                                <span className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors">{patient.name}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{patient.id} • {patient.gender}, {patient.age}y</span>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className={cn(
                             "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                             patient.consent === 'Approved' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                             patient.consent === 'Pending' ? "bg-amber-50 text-amber-700 border-amber-100" :
                             "bg-red-50 text-red-700 border-red-100"
                          )}>
                             {patient.consent === 'Approved' ? <CheckCircle2 size={10} /> : 
                              patient.consent === 'Pending' ? <ShieldQuestion size={10} /> : <XCircle size={10} />}
                             {patient.consent}
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-slate-600 font-bold text-xs uppercase italic">
                             <Calendar size={14} className="text-slate-300" />
                             {patient.expiry}
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className={cn(
                             "text-[10px] font-black uppercase tracking-widest",
                             patient.risk === 'High' ? "text-red-600" : "text-slate-400"
                          )}>
                             {patient.risk} Risk Profile
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase">
                             <Clock size={12} /> {patient.lastVisit}
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                             <Button 
                               size="icon" 
                               variant="ghost" 
                               className="h-9 w-9 text-slate-300 hover:text-blue-600 hover:bg-blue-50"
                               onClick={() => handleGenerateReport(patient.id)}
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
                 ))}
              </tbody>
           </table>
           <div className="p-8 border-t border-slate-50 flex items-center justify-between">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Showing {patients.length} out of 1,240 enterprise records</p>
              <div className="flex gap-2">
                 <Button variant="outline" size="sm" className="h-10 border-2 font-black text-[10px] uppercase">Previous</Button>
                 <Button variant="outline" size="sm" className="h-10 border-2 font-black text-[10px] uppercase text-blue-600 border-blue-100">Next Page</Button>
              </div>
           </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card className="border-none shadow-2xl shadow-slate-100 bg-slate-900 text-white p-8 overflow-hidden relative">
           <div className="absolute top-0 right-0 p-12 text-blue-600/10 transform translate-x-1/4 -translate-y-1/4">
              <ShieldCheck size={280} />
           </div>
           <div className="relative space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-600/30">
                 GDPR & HIPAA Shield Active
              </div>
              <h3 className="text-3xl font-black italic italic">Digital <span className="text-blue-500">Sovereignty Protocol</span></h3>
              <p className="text-white/50 text-base font-medium leading-relaxed max-w-md">
                 Our system ensures all patients retain full control over their clinical data. Federated learning gradients are transmitted with <span className="text-white italic font-bold">zero identification leakage</span>.
              </p>
              <div className="pt-4 flex gap-4">
                 <Button className="h-12 bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-900/40 font-black uppercase tracking-widest text-[10px]">Verify Chain Logs <ArrowUpRight size={18} className="ml-2" /></Button>
                 <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-[10px]">Data Policy</Button>
              </div>
           </div>
        </Card>
        
        <Card className="border-none shadow-2xl shadow-slate-100 p-8 flex flex-col justify-center items-center text-center space-y-6">
           <div className="h-20 w-20 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
              <ShieldQuestion size={44} />
           </div>
           <div>
              <h4 className="text-2xl font-black italic italic">Consent <span className="text-blue-600">Re-Certification</span></h4>
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mt-2 italic italic">48 Patient records require urgent review</p>
           </div>
           <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-sm">
              Multiple patient consents are nearing expiry or have changed status. Audit required to maintain node inclusion in federated round #482.
           </p>
           <Button className="w-full h-14 bg-slate-900 shadow-2xl shadow-slate-200 font-black uppercase tracking-[0.3em] text-[10px]">Start Audit Workflow</Button>
        </Card>
      </div>
    </div>
  );
}
