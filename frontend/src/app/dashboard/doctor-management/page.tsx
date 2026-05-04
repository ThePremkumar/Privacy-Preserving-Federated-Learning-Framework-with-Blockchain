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
  Info
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">Staff <span className="text-blue-600">Onboarding</span></h1>
          <p className="mt-1 text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
             <Building2 size={14} className="text-blue-600" /> Organization identity catalog integration active
          </p>
        </div>
        <Button className="h-11 px-6 shadow-xl shadow-blue-200 bg-blue-600 hover:bg-blue-700" onClick={() => setShowAddModal(true)}>
          Register Doctor <Plus size={16} className="ml-2" />
        </Button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex items-center gap-4 text-emerald-700 shadow-sm animate-in slide-in-from-top-2 duration-300">
          <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600"><CheckCircle2 size={18} /></div>
          <span className="text-xs font-black uppercase tracking-widest">{successMsg}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {[
          { label: 'Total Doctors', value: doctors.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Network Active', value: activeCount, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Catalog Depts', value: nodeCatalog?.departments.length || 0, icon: Stethoscope, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-lg shadow-slate-100/50 p-6 flex items-center gap-5">
            <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center border", stat.bg, stat.color, stat.bg.replace('50', '100'))}>
               <stat.icon size={26} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{stat.label}</p>
              <p className="text-3xl font-black italic text-slate-900 leading-none">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Doctor Table */}
      <Card className="border-none shadow-2xl shadow-slate-100 overflow-hidden rounded-3xl bg-white">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 p-8">
          <div>
            <CardTitle className="text-xl font-black flex items-center gap-3">
               Node <span className="text-blue-600">Personnel</span>
               <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
               <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Global Sync Enabled</span>
            </CardTitle>
            <CardDescription className="text-sm font-bold text-slate-400">Manage clinical staff and their departmental permissions</CardDescription>
          </div>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={14} />
            <input className="h-10 w-64 rounded-xl bg-slate-50/50 pl-10 pr-4 text-xs font-bold border border-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all" placeholder="Search by name or email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/30 border-b border-slate-50">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Doctor Profile</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Specializations</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-20">
                       <Users size={48} />
                       <p className="text-sm font-black uppercase tracking-widest text-slate-900">No matching records found</p>
                    </div>
                  </td>
                </tr>
              ) : filteredDoctors.map(doctor => (
                <tr key={doctor.id} className="hover:bg-slate-50/50 transition-all group cursor-default">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-sm border-2 border-white shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                        {doctor.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{doctor.username}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{doctor.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className={cn(
                       "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                       doctor.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-500 border-slate-100"
                    )}>
                      <div className={cn("h-1.5 w-1.5 rounded-full", doctor.is_active ? "bg-emerald-500" : "bg-slate-300")} />
                      {doctor.is_active ? 'Online' : 'Offline'}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-wrap gap-1.5">
                      {doctor.specializations && doctor.specializations.length > 0 ? (
                        doctor.specializations.slice(0, 2).map((s, idx) => (
                          <span key={idx} className="text-[9px] font-black uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded tracking-tighter border border-slate-200">
                             {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300 italic">General Medicine</span>
                      )}
                      {doctor.specializations && doctor.specializations.length > 2 && (
                         <span className="text-[9px] font-black text-blue-600">+{doctor.specializations.length - 2} more</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="outline" className="h-8 px-4 text-[9px] font-black uppercase tracking-widest border-2 hover:bg-blue-50">Manage</Button>
                      <Button size="sm" variant="outline" className="h-8 px-4 text-[9px] font-black uppercase tracking-widest text-red-500 border-red-100 hover:bg-red-50">Revoke</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-8 border-t border-slate-50 bg-slate-50/20 text-center">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">End of clinical personnel registry</p>
          </div>
        </CardContent>
      </Card>

      {/* Add Doctor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-200">
            {/* Side Branding */}
            <div className="w-full md:w-1/3 bg-blue-900 p-10 text-white flex flex-col relative overflow-hidden">
               <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-blue-800 opacity-20" />
               <div className="absolute bottom-10 -left-10 h-32 w-32 rounded-full bg-blue-700 opacity-10" />
               
               <div className="relative z-10">
                  <div className="h-14 w-14 rounded-2xl bg-blue-800 flex items-center justify-center mb-8 shadow-inner border border-blue-700">
                     <BrainCircuit size={28} className="text-blue-400" />
                  </div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">Register <br /><span className="text-blue-400">Clinical Staff</span></h3>
                  <p className="text-xs font-bold text-blue-300/80 mt-6 leading-relaxed">
                    Grant doctor-level access to your organization's decentralized training local node.
                  </p>
               </div>

               <div className="mt-auto relative z-10">
                  <div className="flex flex-col gap-5">
                    {[
                      { icon: Shield, label: 'HIPAA Compliant' },
                      { icon: Activity, label: 'RBAC Enforced' },
                      { icon: Lock, label: 'Audit Logged' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-blue-300">
                         <item.icon size={16} />
                         <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            {/* Form Side */}
            <div className="flex-1 p-10 h-[80vh] flex flex-col">
              <div className="flex items-center justify-between mb-10">
                 <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Personnel Details</h4>
                 <button onClick={() => setShowAddModal(false)} className="h-10 w-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-slate-200 hover:text-slate-600 transition-all">
                    <X size={20} />
                 </button>
              </div>

              <form onSubmit={handleCreateDoctor} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 space-y-8 overflow-y-auto pr-2 custom-scrollbar">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Username</label>
                      <input required type="text" value={newDoctor.username} onChange={e => setNewDoctor({...newDoctor, username: e.target.value})}
                        className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all" placeholder="dr_connor" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Clinical Email</label>
                      <input required type="email" value={newDoctor.email} onChange={e => setNewDoctor({...newDoctor, email: e.target.value})}
                        className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all" placeholder="sarah.c@hospital.com" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Password</label>
                    <div className="relative">
                      <input required type={showPassword ? "text" : "password"} value={newDoctor.password} onChange={e => setNewDoctor({...newDoctor, password: e.target.value})}
                        className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 pr-12 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all" placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Identity Catalog Part */}
                  <div className="space-y-6 pt-4 border-t border-slate-50">
                     <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Assignment</label>
                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-widest">Node-Active Catalog</span>
                     </div>
                     
                     <div className="space-y-5">
                        {/* Specializations Multi-select */}
                        <div>
                           <label className="block text-[11px] font-black text-slate-600 uppercase tracking-tight mb-3">Specializations</label>
                           <div className="bg-slate-50/50 border-2 border-slate-100 rounded-[1.5rem] p-4 min-h-[60px] flex flex-wrap gap-2">
                              {isLoadingCatalog ? <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent animate-spin rounded-full mx-auto" /> : 
                                nodeCatalog?.specializations.map(spec => (
                                  <button
                                    key={spec}
                                    type="button"
                                    onClick={() => toggleSelection('specializations', spec)}
                                    className={cn(
                                      "px-3 py-1.5 rounded-xl text-[11px] font-bold border-2 transition-all flex items-center gap-2",
                                      newDoctor.specializations.includes(spec) ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100" : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
                                    )}
                                  >
                                    <Stethoscope size={12} /> {spec}
                                  </button>
                                ))
                              }
                           </div>
                        </div>

                        {/* Departments Multi-select */}
                        <div>
                           <label className="block text-[11px] font-black text-slate-600 uppercase tracking-tight mb-3">Department Assignments</label>
                           <div className="grid grid-cols-2 gap-2">
                              {isLoadingCatalog ? <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent animate-spin rounded-full mx-auto" /> : 
                                nodeCatalog?.departments.map(dept => (
                                  <button
                                    key={dept}
                                    type="button"
                                    onClick={() => toggleSelection('department_ids', dept)}
                                    className={cn(
                                      "px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-tight text-left border-2 transition-all flex items-center justify-between",
                                      newDoctor.department_ids.includes(dept) ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm shadow-emerald-50" : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
                                    )}
                                  >
                                    <span className="truncate">{dept}</span>
                                    {newDoctor.department_ids.includes(dept) && <CheckCircle2 size={12} />}
                                  </button>
                                ))
                              }
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="bg-blue-50 p-5 rounded-2xl border-2 border-blue-100 flex items-start gap-4">
                     <Info size={18} className="text-blue-600 mt-0.5 shrink-0" />
                     <p className="text-[11px] font-bold text-blue-900 leading-relaxed">
                       This personnel will be bound to node <span className="text-blue-600 font-black">{user?.hospital_id}</span>. 
                       Account credentials will be sent to the registered email.
                     </p>
                  </div>
                </div>

                <div className="mt-auto pt-10 flex gap-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all">Cancel</button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                      "flex-1 h-14 rounded-2xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-100 hover:bg-blue-700 hover:-translate-y-1 active:translate-y-0",
                      isSubmitting && "opacity-70 cursor-not-allowed shadow-none"
                    )}
                  >
                    {isSubmitting ? <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Lock size={16} />}
                    Complete Onboarding
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
