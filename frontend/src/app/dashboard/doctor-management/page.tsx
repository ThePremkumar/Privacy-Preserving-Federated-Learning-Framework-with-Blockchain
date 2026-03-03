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

const demoDoctors = [
  { id: 'DOC-001', name: 'Dr. Valerie Chen', email: 'v.chen@mayo.edu', specialty: 'Endocrinology', access: 'Full Access', patients: 42, predictions: 218, lastActive: '10m ago', status: 'Online' },
  { id: 'DOC-002', name: 'Dr. James Miller', email: 'j.miller@mayo.edu', specialty: 'Cardiology', access: 'Full Access', patients: 38, predictions: 156, lastActive: '1h ago', status: 'Online' },
  { id: 'DOC-003', name: 'Dr. Sarah Kim', email: 's.kim@mayo.edu', specialty: 'Pulmonology', access: 'Prediction Only', patients: 24, predictions: 89, lastActive: '4h ago', status: 'Offline' },
  { id: 'DOC-004', name: 'Dr. Robert Shah', email: 'r.shah@mayo.edu', specialty: 'Neurology', access: 'Full Access', patients: 31, predictions: 134, lastActive: '2h ago', status: 'Offline' },
];

export default function DoctorManagementPage() {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newDoctor, setNewDoctor] = useState({ username: '', email: '', password: '' });
  const [successMsg, setSuccessMsg] = useState('');

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
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to register doctor:', err);
    }
  };

  const filteredDoctors = demoDoctors.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <p className="text-2xl font-black italic text-slate-900">{demoDoctors.length}</p>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-lg shadow-slate-100/50 p-5">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100"><Activity size={22} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Online Now</p>
              <p className="text-2xl font-black italic text-emerald-600">{demoDoctors.filter(d => d.status === 'Online').length}</p>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-lg shadow-slate-100/50 p-5">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100"><Stethoscope size={22} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Predictions</p>
              <p className="text-2xl font-black italic text-indigo-600">{demoDoctors.reduce((a, d) => a + d.predictions, 0)}</p>
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
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Specialty</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Access Level</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Patients</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredDoctors.map(doctor => (
                <tr key={doctor.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs">
                        {doctor.name.split(' ')[1]?.charAt(0) || doctor.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{doctor.name}</p>
                        <p className="text-[10px] font-bold text-slate-400">{doctor.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-bold text-slate-600">{doctor.specialty}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                      doctor.access === 'Full Access' ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-amber-50 text-amber-700 border-amber-100"
                    )}>
                      {doctor.access}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-black text-slate-900">{doctor.patients}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1.5">
                      <div className={cn("h-2 w-2 rounded-full", doctor.status === 'Online' ? "bg-emerald-500" : "bg-slate-300")} />
                      <span className="text-[10px] font-bold text-slate-400">{doctor.status}</span>
                    </div>
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
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="e.g. dr_chen" />
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
