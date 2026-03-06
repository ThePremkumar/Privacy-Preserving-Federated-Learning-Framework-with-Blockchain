'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Hospital
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
}

export default function DoctorManagementPage() {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newDoctor, setNewDoctor] = useState({ username: '', email: '', password: '' });
  const [successMsg, setSuccessMsg] = useState('');
  const [doctors, setDoctors] = useState<DoctorUser[]>([]);

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await api.get('/auth/users');
      const doctorUsers: DoctorUser[] = res.data
        .filter((u: any) => u.role === 'doctor' && u.hospital_id === user?.hospital_id)
        .map((u: any) => ({
          id: u.id,
          username: u.username,
          email: u.email,
          role: u.role,
          hospital_id: u.hospital_id,
          is_active: u.is_active !== false,
        }));
      setDoctors(doctorUsers);
    } catch {
      setDoctors([]);
    }
  }, [user?.hospital_id]);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', {
        ...newDoctor,
        role: 'doctor',
        hospital_id: user?.hospital_id,
      });
      setSuccessMsg('Doctor registered successfully');
      setShowAddModal(false);
      setNewDoctor({ username: '', email: '', password: '' });
      fetchDoctors();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to register doctor:', err);
    }
  };

  const filteredDoctors = doctors.filter(d =>
    d.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = doctors.filter(d => d.is_active).length;

  return (
    <RoleGuard allowedRoles={['hospital']}>
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">Doctor <span className="text-blue-600">Management</span></h1>
          <p className="mt-1 text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
             <Stethoscope size={14} className="text-blue-600" /> Clinical Staff Access & Role Assignment
          </p>
        </div>
        <Button className="h-11 px-6 shadow-xl shadow-blue-200" onClick={() => setShowAddModal(true)}>
          Add Doctor <Plus size={16} className="ml-2" />
        </Button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3 text-emerald-700">
          <CheckCircle2 size={16} />
          <span className="text-xs font-black uppercase tracking-widest">{successMsg}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card className="border-none shadow-lg shadow-slate-100/50 p-5">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100"><Users size={22} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Doctors</p>
              <p className="text-2xl font-black italic text-slate-900">{doctors.length}</p>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-lg shadow-slate-100/50 p-5">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100"><Activity size={22} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active</p>
              <p className="text-2xl font-black italic text-emerald-600">{activeCount}</p>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-lg shadow-slate-100/50 p-5">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100"><Stethoscope size={22} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inactive</p>
              <p className="text-2xl font-black italic text-indigo-600">{doctors.length - activeCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Doctor Table */}
      <Card className="border-none shadow-2xl shadow-slate-100 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-5 p-6">
          <div>
            <CardTitle className="text-xl font-black">Registered <span className="text-blue-600">Doctors</span></CardTitle>
            <CardDescription className="text-sm font-bold text-slate-400">Clinical staff under your organization</CardDescription>
          </div>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input className="h-9 w-48 rounded-lg bg-slate-50 pl-8 pr-4 text-[10px] font-bold border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Search doctors..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Doctor</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Hospital Node</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm font-bold text-slate-400">
                    No doctors registered yet. Click "Add Doctor" to onboard clinical staff.
                  </td>
                </tr>
              ) : filteredDoctors.map(doctor => (
                <tr key={doctor.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs">
                        {doctor.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{doctor.username}</p>
                        <p className="text-[10px] font-bold text-slate-400">{doctor.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1.5">
                      <div className={cn("h-2 w-2 rounded-full", doctor.is_active ? "bg-emerald-500" : "bg-slate-300")} />
                      <span className="text-[10px] font-bold text-slate-400">{doctor.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-bold text-slate-500">{doctor.hospital_id || '—'}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-7 px-3 text-[9px] font-black uppercase tracking-widest">Edit</Button>
                      <Button size="sm" variant="outline" className="h-7 px-3 text-[9px] font-black uppercase tracking-widest text-red-500 border-red-200 hover:bg-red-50">Remove</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Add Doctor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-blue-900 p-8 text-white relative">
              <div className="absolute top-0 right-0 p-10 opacity-10"><Stethoscope size={100} /></div>
              <h3 className="text-2xl font-black uppercase tracking-tighter">Register <span className="text-blue-400">Doctor</span></h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300/60 mt-1">Onboard clinical staff to your node</p>
            </div>
            <form onSubmit={handleCreateDoctor} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Doctor Username</label>
                <input required type="text" value={newDoctor.username} onChange={e => setNewDoctor({...newDoctor, username: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Unique username for the doctor" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                <input required type="email" value={newDoctor.email} onChange={e => setNewDoctor({...newDoctor, email: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="doctor@hospital.org" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <input required type={showPassword ? "text" : "password"} value={newDoctor.password} onChange={e => setNewDoctor({...newDoctor, password: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 pr-10 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Min 8 characters" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest flex items-center gap-2">
                  <Hospital size={12} /> This doctor will be assigned to your hospital node: <span className="text-blue-600">{user?.hospital_id || 'Auto'}</span>
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-6 py-4 rounded-xl bg-white border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 px-6 py-4 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-900 shadow-xl shadow-blue-200">Register Doctor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </RoleGuard>
  );
}
