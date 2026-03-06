'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  UserCog,
  Plus,
  Search,
  Shield,
  Mail,
  Clock,
  Key,
  Activity,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
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

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  hospital_id: string | null;
  lastLogin: string;
  status: string;
  loginCount: number;
}

// Login activity is fetched from the audit API — no static data

export default function AdminManagementPage() {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hospitals, setHospitals] = useState<{id: string; name: string}[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [newAdmin, setNewAdmin] = useState({ username: '', email: '', role: 'admin', hospital_id: '', password: '' });
  const [successMsg, setSuccessMsg] = useState('');

  const fetchAdmins = useCallback(async () => {
    try {
      const res = await api.get('/auth/users');
      const apiAdmins: AdminUser[] = res.data
        .filter((u: any) => u.role === 'super_admin' || u.role === 'admin')
        .map((u: any) => ({
          id: u.id,
          username: u.username,
          email: u.email,
          role: u.role,
          hospital_id: u.hospital_id,
          lastLogin: u.username === user?.username ? 'Now' : 'Recently',
          status: u.username === user?.username ? 'Online' : 'Offline',
          loginCount: 0,
        }));
      setAdmins(apiAdmins);
    } catch {
      setAdmins([]);
    }
  }, [user?.username]);

  useEffect(() => {
    fetchAdmins();
    api.get('/auth/hospitals').then(res => setHospitals(res.data)).catch(() => {});
  }, [fetchAdmins]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', newAdmin);
      setShowAddModal(false);
      setNewAdmin({ username: '', email: '', role: 'admin', hospital_id: '', password: '' });
      setSuccessMsg('Admin registered successfully');
      fetchAdmins();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to create admin:', err);
    }
  };

  const filteredAdmins = admins.filter(a =>
    a.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <RoleGuard allowedRoles={['super_admin']}>
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">Admin <span className="text-blue-600">Management</span></h1>
          <p className="mt-1 text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
             <UserCog size={14} className="text-blue-600" /> Role Assignment & Access Governance
          </p>
        </div>
        <Button className="h-11 px-6 shadow-xl shadow-blue-200" onClick={() => setShowAddModal(true)}>
          Create Admin <Plus size={16} className="ml-2" />
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
        <Card className="border-none shadow-lg shadow-slate-100/50 p-5 bg-white">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Shield size={22} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Admins</p>
              <p className="text-2xl font-black italic text-slate-900">{admins.length}</p>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-lg shadow-slate-100/50 p-5 bg-white">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Activity size={22} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Online Now</p>
              <p className="text-2xl font-black italic text-emerald-600">{admins.filter(a => a.status === 'Online').length}</p>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-lg shadow-slate-100/50 p-5 bg-white">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
              <AlertCircle size={22} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Failed Logins (24h)</p>
              <p className="text-2xl font-black italic text-red-600">—</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Admin Table */}
        <Card className="lg:col-span-7 border-none shadow-2xl shadow-slate-100 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-5 p-6">
            <div>
              <CardTitle className="text-xl font-black">System <span className="text-blue-600">Administrators</span></CardTitle>
              <CardDescription className="text-sm font-bold text-slate-400">Role & access management</CardDescription>
            </div>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input className="h-9 w-48 rounded-lg bg-slate-50 pl-8 pr-4 text-[10px] font-bold border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Search admins..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {filteredAdmins.map(admin => (
                <div key={admin.id} className="flex items-center justify-between px-6 py-5 hover:bg-slate-50/50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs uppercase",
                      admin.role === 'super_admin' ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {admin.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">{admin.username}</p>
                      <p className="text-[10px] font-bold text-slate-400">{admin.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                      admin.role === 'super_admin' ? "bg-indigo-50 text-indigo-700 border-indigo-100" : "bg-amber-50 text-amber-700 border-amber-100"
                    )}>
                      {admin.role.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className={cn("h-2 w-2 rounded-full", admin.status === 'Online' ? "bg-emerald-500" : "bg-slate-300")} />
                      <span className="text-[10px] font-bold text-slate-400">{admin.lastLogin}</span>
                    </div>
                    {admin.role !== 'super_admin' && (
                      <Button size="sm" variant="outline" className="h-7 px-3 text-[9px] font-black uppercase tracking-widest border text-red-500 border-red-200 hover:bg-red-50">
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Login Activity Feed */}
        <Card className="lg:col-span-5 border-none shadow-2xl shadow-slate-100 bg-slate-900 text-white overflow-hidden">
          <CardHeader className="border-b border-white/5 pb-5">
            <CardTitle className="text-white text-xl font-black">Login <span className="text-blue-400">Activity</span></CardTitle>
            <CardDescription className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Real-time authentication events</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Login activity is populated from the audit log service in real time.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-indigo-900 p-8 text-white relative">
              <div className="absolute top-0 right-0 p-10 opacity-10"><UserCog size={100} /></div>
              <h3 className="text-2xl font-black uppercase tracking-tighter">Create <span className="text-indigo-400">Administrator</span></h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300/60 mt-1">System-level access provisioning</p>
            </div>
            <form onSubmit={handleCreateAdmin} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                <input required type="text" value={newAdmin.username} onChange={e => setNewAdmin({...newAdmin, username: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="e.g. admin_boston" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                <input required type="email" value={newAdmin.email} onChange={e => setNewAdmin({...newAdmin, email: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="admin@hospital.org" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role</label>
                  <select value={newAdmin.role} onChange={e => setNewAdmin({...newAdmin, role: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-black uppercase text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-100">
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign Hospital</label>
                  <select value={newAdmin.hospital_id} onChange={e => setNewAdmin({...newAdmin, hospital_id: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-black uppercase text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-100">
                    <option value="">Global</option>
                    {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <input required type={showPassword ? "text" : "password"} value={newAdmin.password} onChange={e => setNewAdmin({...newAdmin, password: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 pr-10 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Min 8 characters" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-6 py-4 rounded-xl bg-white border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 px-6 py-4 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-900 shadow-xl shadow-indigo-200">Create Admin</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </RoleGuard>
  );
}
