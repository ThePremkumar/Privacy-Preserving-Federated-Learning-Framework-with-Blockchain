'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Stethoscope,
  Plus,
  Search,
  Shield,
  Mail,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Users,
  Activity,
  Clock,
  ChevronRight,
  Hospital,
  ChevronDown,
  X,
  Lock,
  Building2,
  BrainCircuit,
  Info,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DoctorUser {
  id: string;
  username: string;
  email: string;
  role: string;
  hospital_id: string | null;
  is_active: boolean;
  specializations?: string[];
  department_ids?: string[];
}

export default function DoctorManagementPage() {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newDoctor, setNewDoctor] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    specializations: [] as string[],
    department_ids: [] as string[]
  });
  
  const [successMsg, setSuccessMsg] = useState('');
  const [doctors, setDoctors] = useState<DoctorUser[]>([]);
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [nodeCatalog, setNodeCatalog] = useState<{ specializations: string[], departments: string[] } | null>(null);
  const [specMap, setSpecMap] = useState<Record<string, string[]>>({});
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await api.get('/auth/users');
      const doctorUsers: DoctorUser[] = res.data
        .filter((u: any) => u.role === 'doctor' && u.hospital_id === user?.hospital_id)
        .map((u: any) => ({
          ...u,
          is_active: u.is_active !== false,
        }));
      setDoctors(doctorUsers);

      const reqRes = await api.get('/access-requests');
      setAccessRequests(reqRes.data);
    } catch {
      setDoctors([]);
    }
  }, [user?.hospital_id]);

  const fetchCatalog = useCallback(async () => {
    if (!user?.hospital_id) return;
    try {
      const [nodeRes, mapRes] = await Promise.all([
        api.get(`/catalog/node-active?hospital_id=${user.hospital_id}`),
        api.get('/catalog/specialization-map')
      ]);
      setNodeCatalog(nodeRes.data);
      setSpecMap(mapRes.data);
    } catch (err) {
      console.error('Failed to fetch catalog:', err);
    } finally {
      setIsLoadingCatalog(false);
    }
  }, [user?.hospital_id]);

  useEffect(() => { 
    fetchDoctors();
    fetchCatalog();
  }, [fetchDoctors, fetchCatalog]);

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/auth/register', {
        ...newDoctor,
        role: 'doctor',
        hospital_id: user?.hospital_id,
      });
      setSuccessMsg('Doctor registered successfully');
      setShowAddModal(false);
      setNewDoctor({ username: '', email: '', password: '', specializations: [], department_ids: [] });
      fetchDoctors();
      
      // If we are fulfilling a request, mark it as completed
      const pendingReq = accessRequests.find(r => r.email === newDoctor.email);
      if (pendingReq) {
        await api.put(`/access-requests/${pendingReq.id}`, { status: 'completed' });
      }

      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to register doctor:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSelection = (field: 'specializations' | 'department_ids', value: string) => {
    setNewDoctor(prev => {
      const current = (prev as any)[field] as string[];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(v => v !== value) };
      } else {
        const next = [...current, value];
        
        // Cascade logic: if selecting a specialization, auto-suggest departments
        if (field === 'specializations' && specMap[value]) {
          const suggested = specMap[value];
          const nextDepts = Array.from(new Set([...prev.department_ids, ...suggested]));
          return { ...prev, [field]: next, department_ids: nextDepts };
        }
        
        return { ...prev, [field]: next };
      }
    });
  };

  const filteredDoctors = doctors.filter(d =>
    d.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = doctors.filter(d => d.is_active).length;

  return (
    <RoleGuard allowedRoles={['hospital']}>
    <div className="space-y-10 pb-24 relative min-h-screen">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-5%] right-[-5%] w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* --- PREMIUM HEADER SECTION --------------------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="h-2 w-12 bg-blue-600 rounded-full" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Personnel Management</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
            Staff <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Onboarding.</span>
          </h1>
          <p className="text-sm font-bold text-slate-400 max-w-lg leading-relaxed">
            Manage your hospital's clinical staff, specialties, and departmental access controls in real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="hidden sm:flex items-center gap-6 px-6 py-3 bg-white/50 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm mr-2">
             <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Doctors</span>
                <div className="flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                   <span className="text-xs font-black text-slate-900">{activeCount} / {doctors.length}</span>
                </div>
             </div>
             <div className="h-8 w-px bg-slate-200" />
             <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Departments</span>
                <span className="text-xs font-black text-slate-900">{nodeCatalog?.departments.length || 0} Total</span>
             </div>
          </div>

          <Button 
            className="h-14 px-8 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 group"
            onClick={() => setShowAddModal(true)}
          >
            Register Doctor
            <Plus size={18} className="ml-3 group-hover:rotate-90 transition-transform duration-300" />
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-[2rem] flex items-center gap-4 text-emerald-700 shadow-xl shadow-emerald-100/50 animate-in slide-in-from-top-4 duration-500 relative z-10">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
             <CheckCircle2 size={20} />
          </div>
          <div>
             <p className="text-xs font-black uppercase tracking-widest leading-none">Success Protocol</p>
             <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest mt-1">{successMsg}</p>
          </div>
        </div>
      )}

      {/* --- KPI TILES ---------------------------------------- */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 relative z-10">
        {[
          { label: 'Total Personnel', value: doctors.length, icon: Users, color: 'blue', detail: 'Onboarded Doctors' },
          { label: 'Network Presence', value: activeCount, icon: Activity, color: 'emerald', detail: 'Real-time Active' },
          { label: 'Catalog Depts', value: nodeCatalog?.departments.length || 0, icon: Stethoscope, color: 'indigo', detail: 'Configured Specializations' },
        ].map((stat, i) => (
          <Card key={i} className="group border-none shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-200/40 transition-all duration-500 rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className={cn(
                  "h-14 w-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
                  stat.color === 'blue' ? "bg-blue-50 text-blue-600 border-blue-100" :
                  stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                  "bg-indigo-50 text-indigo-600 border-indigo-100"
                )}>
                  <stat.icon size={28} />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  <p className={cn("text-3xl font-black italic tracking-tighter leading-none", 
                    stat.color === 'blue' ? "text-blue-600" :
                    stat.color === 'emerald' ? "text-emerald-600" :
                    "text-indigo-600"
                  )}>{stat.value}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.detail}</span>
                 <div className="h-1.5 w-1.5 rounded-full bg-slate-200 group-hover:bg-blue-600 transition-colors" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* --- PENDING REQUESTS --------------------------------- */}
      {accessRequests.length > 0 && (
        <Card className="border-none shadow-2xl shadow-blue-100/50 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-900 to-indigo-900 text-white relative z-10 group">
          <div className="absolute top-0 right-0 p-12 text-white/5 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-1000">
             <Bell size={300} />
          </div>
          <CardHeader className="p-8 border-b border-white/5 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black flex items-center gap-3 italic">
                  <Bell size={24} className="text-blue-400 animate-bounce" /> Pending Credentials
                </CardTitle>
                <CardDescription className="text-blue-200/50 font-bold text-xs mt-1 uppercase tracking-widest">External personnel waiting for node access</CardDescription>
              </div>
              <div className="px-4 py-1.5 bg-blue-500/20 rounded-full border border-blue-400/20 text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">
                 {accessRequests.length} Active Requests
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 relative z-10">
             <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto custom-scrollbar">
               {accessRequests.map(req => (
                 <div key={req.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                   <div className="flex items-center gap-5">
                      <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center font-black text-blue-400 shadow-inner">
                         {req.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-white leading-none">{req.full_name}</p>
                        <p className="text-[10px] font-bold text-blue-200/40 uppercase tracking-widest mt-1">{req.email} • {req.designation}</p>
                      </div>
                   </div>
                   <Button 
                     size="sm" 
                     onClick={() => {
                       setNewDoctor({
                         ...newDoctor,
                         email: req.email,
                         username: req.full_name.toLowerCase().replace(/\s+/g, '_').substring(0, 15)
                       });
                       setShowAddModal(true);
                     }} 
                     className="h-10 px-6 bg-white text-slate-900 hover:bg-blue-400 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg transition-all"
                   >
                     Approve &amp; Onboard
                   </Button>
                 </div>
               ))}
             </div>
          </CardContent>
        </Card>
      )}

      {/* --- COMMAND CENTER ----------------------------------- */}
      <div className="relative z-10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 backdrop-blur-xl">
           <div className="relative w-full md:max-w-md group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
              <input 
                className="h-14 w-full rounded-2xl bg-slate-50 pl-14 pr-6 text-sm font-bold text-slate-900 border border-transparent focus:border-blue-100 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all" 
                placeholder="Search staff by name or UUID..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
           </div>

           <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                 <Shield size={20} />
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">RBAC Protocol</p>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Level 4 Clearance</p>
              </div>
           </div>
        </div>

        {/* --- PERSONNEL TABLE ---------------------------------- */}
        <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-50">
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Doctor Profile</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Node Status</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Identity Catalog</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredDoctors.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-10 py-24 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-30">
                        <Users size={64} className="text-slate-300" />
                        <div className="space-y-1">
                          <p className="text-lg font-black uppercase tracking-tighter text-slate-900">Zero personnel matches</p>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest italic">Check search query or onboarding status</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : filteredDoctors.map(doctor => (
                  <tr key={doctor.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-5">
                        <div className="h-16 w-16 rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-2xl italic group-hover:scale-110 transition-transform duration-500 shadow-xl shadow-blue-200">
                          {doctor.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-base font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors leading-none">{doctor.username}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mt-2 italic">{doctor.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className={cn(
                         "inline-flex items-center gap-3 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all",
                         doctor.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm shadow-emerald-50" : "bg-slate-50 text-slate-500 border-slate-100"
                      )}>
                        <div className={cn("h-2 w-2 rounded-full", doctor.is_active ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                        {doctor.is_active ? 'Online' : 'Offline'}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex flex-wrap gap-2 max-w-[300px]">
                        {doctor.specializations && doctor.specializations.length > 0 ? (
                          doctor.specializations.slice(0, 3).map((s, idx) => (
                            <span key={idx} className="px-3 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-black text-slate-600 uppercase tracking-tighter shadow-sm">
                               {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] font-black text-slate-300 italic uppercase">General Practice</span>
                        )}
                        {doctor.specializations && doctor.specializations.length > 3 && (
                           <span className="text-[10px] font-black text-blue-600 flex items-center px-2">+{doctor.specializations.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                        <Button variant="outline" className="h-10 px-6 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all">Manage</Button>
                        <Button variant="outline" className="h-10 px-6 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest text-rose-500 border-rose-50 hover:bg-rose-50 hover:border-rose-100 transition-all">Revoke</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-8 bg-slate-50/30 border-t border-slate-50 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <span className="h-2 w-2 bg-blue-600 rounded-full animate-pulse" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Clinical personnel registry integrity verified</p>
             </div>
             <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest italic">{doctors.length} Entries found</p>
          </div>
        </Card>
      </div>

      {/* Add Doctor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative w-full max-w-5xl bg-white rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-500 h-[85vh]">
            {/* Side Branding */}
            <div className="w-full md:w-[350px] bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 p-12 text-white flex flex-col relative overflow-hidden shrink-0">
               <div className="absolute top-0 right-0 p-12 text-blue-400/5 transform translate-x-1/4 -translate-y-1/4">
                  <Shield size={400} />
               </div>
               <div className="absolute bottom-0 left-0 p-12 text-indigo-400/5 transform -translate-x-1/4 translate-y-1/4">
                  <BrainCircuit size={300} />
               </div>
               
               <div className="relative z-10">
                  <div className="h-16 w-16 rounded-[1.5rem] bg-blue-500/10 border border-blue-400/20 backdrop-blur-sm flex items-center justify-center mb-10 shadow-xl shadow-blue-900/50">
                     <BrainCircuit size={32} className="text-blue-400" />
                  </div>
                  <h3 className="text-4xl font-black uppercase tracking-tighter leading-none italic">Node <br /><span className="text-blue-500">Personnel</span> <br /> Registry.</h3>
                  <p className="text-xs font-bold text-blue-200/60 mt-8 leading-relaxed max-w-[200px]">
                    Granting physician clearance for decentralized local training operations.
                  </p>
               </div>

               <div className="mt-auto relative z-10 space-y-6">
                  {[
                    { icon: Shield, label: 'E2E Encryption' },
                    { icon: Lock, label: 'Access Control' },
                    { icon: CheckCircle2, label: 'Identity Sync' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 text-blue-200/50">
                       <div className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center">
                          <item.icon size={16} />
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.label}</span>
                    </div>
                  ))}
               </div>
            </div>

            {/* Form Side */}
            <div className="flex-1 p-12 flex flex-col bg-white overflow-hidden">
              <div className="flex items-center justify-between mb-12">
                 <div>
                    <h4 className="text-2xl font-black text-slate-900 italic tracking-tight">Onboarding <span className="text-blue-600 underline decoration-blue-100 underline-offset-8">Protocol.</span></h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Initialize new physician identity credentials</p>
                 </div>
                 <button onClick={() => setShowAddModal(false)} className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm">
                    <X size={24} />
                 </button>
              </div>

              <form onSubmit={handleCreateDoctor} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 space-y-10 overflow-y-auto pr-6 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                        <Users size={12} className="text-blue-600" /> Username Alias
                      </label>
                      <input required type="text" value={newDoctor.username} onChange={e => setNewDoctor({...newDoctor, username: e.target.value})}
                        className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 text-sm font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 focus:bg-white transition-all shadow-sm" placeholder="e.g. dr_smith" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                        <Mail size={12} className="text-blue-600" /> Verified Email
                      </label>
                      <input required type="email" value={newDoctor.email} onChange={e => setNewDoctor({...newDoctor, email: e.target.value})}
                        className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 text-sm font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 focus:bg-white transition-all shadow-sm" placeholder="dr.smith@node.health" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                      <Lock size={12} className="text-blue-600" /> Authorization Key
                    </label>
                    <div className="relative">
                      <input required type={showPassword ? "text" : "password"} value={newDoctor.password} onChange={e => setNewDoctor({...newDoctor, password: e.target.value})}
                        className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 pr-14 text-sm font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 focus:bg-white transition-all shadow-sm" placeholder="Create a secure password..." />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors">
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Identity Catalog Part */}
                  <div className="space-y-8 pt-8 border-t border-slate-100">
                     <div className="flex items-center justify-between">
                        <h5 className="text-xs font-black text-slate-900 uppercase tracking-widest italic">Identity Assignments</h5>
                        <div className="h-px flex-1 mx-6 bg-slate-100" />
                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest border border-blue-100">Node Catalog V2.4</span>
                     </div>
                     
                     <div className="space-y-8">
                        {/* Specializations Multi-select */}
                        <div className="space-y-4">
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Clinical Specialties</label>
                           <div className="bg-slate-50/50 border-2 border-slate-100 rounded-[2rem] p-6 flex flex-wrap gap-2.5">
                              {isLoadingCatalog ? (
                                <div className="p-8 w-full flex items-center justify-center">
                                   <Loader2 size={32} className="animate-spin text-blue-600 opacity-20" />
                                </div>
                              ) : (
                                nodeCatalog?.specializations.map(spec => (
                                  <button
                                    key={spec}
                                    type="button"
                                    onClick={() => toggleSelection('specializations', spec)}
                                    className={cn(
                                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight border-2 transition-all flex items-center gap-3",
                                      newDoctor.specializations.includes(spec) 
                                        ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200" 
                                        : "bg-white border-slate-100 text-slate-400 hover:border-blue-200 hover:text-blue-600"
                                    )}
                                  >
                                    <Stethoscope size={14} /> {spec}
                                  </button>
                                ))
                              )}
                           </div>
                        </div>

                        {/* Departments Multi-select */}
                        <div className="space-y-4">
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Department Clearance</label>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {isLoadingCatalog ? (
                                <div className="p-8 w-full flex items-center justify-center col-span-2">
                                   <Loader2 size={32} className="animate-spin text-blue-600 opacity-20" />
                                </div>
                              ) : (
                                nodeCatalog?.departments.map(dept => (
                                  <button
                                    key={dept}
                                    type="button"
                                    onClick={() => toggleSelection('department_ids', dept)}
                                    className={cn(
                                      "px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-left border-2 transition-all flex items-center justify-between group/dept",
                                      newDoctor.department_ids.includes(dept) 
                                        ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xl shadow-emerald-100/20" 
                                        : "bg-white border-slate-100 text-slate-400 hover:border-blue-200 hover:text-blue-600"
                                    )}
                                  >
                                    <span className="truncate">{dept}</span>
                                    {newDoctor.department_ids.includes(dept) ? (
                                      <CheckCircle2 size={16} />
                                    ) : (
                                      <ChevronRight size={14} className="opacity-0 group-hover/dept:opacity-100 transition-opacity" />
                                    )}
                                  </button>
                                ))
                              )}
                           </div>
                        </div>
                     </div>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-slate-100 flex items-center gap-6">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)} 
                    className="h-14 px-10 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                      "flex-1 h-14 rounded-2xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-4 transition-all shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 active:translate-y-0",
                      isSubmitting && "opacity-70 cursor-not-allowed shadow-none translate-y-0"
                    )}
                  >
                    {isSubmitting ? (
                       <Loader2 size={24} className="animate-spin" />
                    ) : (
                       <>
                         <span>Complete Node Onboarding</span>
                         <ChevronRight size={18} />
                       </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
    </RoleGuard>
  );
}
