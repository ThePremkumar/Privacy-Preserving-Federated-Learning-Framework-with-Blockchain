'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  Users,
  Database,
  MoreVertical,
  ArrowUpRight,
  Shield,
  Mail,
  MapPin,
  TrendingUp,
  Pause,
  Play,
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

interface HospitalNode {
  id: string;
  name: string;
  contact_email: string;
  address: string;
  is_active: boolean;
}

export default function OrganizationsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [hospitals, setHospitals] = useState<HospitalNode[]>([]);
  const [newHospital, setNewHospital] = useState({ name: '', contact_email: '', address: '' });

  const fetchHospitals = useCallback(async () => {
    try {
      const res = await api.get('/auth/hospitals');
      setHospitals(res.data);
    } catch {
      setHospitals([]);
    }
  }, []);

  useEffect(() => { fetchHospitals(); }, [fetchHospitals]);

  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/register-hospital', newHospital);
      setShowAddModal(false);
      setNewHospital({ name: '', contact_email: '', address: '' });
      fetchHospitals();
    } catch (err) {
      console.error('Failed to create hospital:', err);
    }
  };

  const filteredHospitals = hospitals.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = hospitals.filter(h => h.is_active).length;
  const inactiveCount = hospitals.filter(h => !h.is_active).length;

  return (
    <RoleGuard allowedRoles={['super_admin', 'admin']}>
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">Organization <span className="text-blue-600">Management</span></h1>
          <p className="mt-1 text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
             <Building2 size={14} className="text-blue-600" /> Hospital Node Onboarding & Governance
          </p>
        </div>
        <Button className="h-11 px-6 shadow-xl shadow-blue-200" onClick={() => setShowAddModal(true)}>
          Add Organization <Plus size={16} className="ml-2" />
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: 'Total Organizations', value: hospitals.length, icon: Building2, color: 'text-slate-900', bg: 'bg-white' },
          { label: 'Active Nodes', value: activeCount, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Inactive', value: inactiveCount, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((stat, i) => (
          <Card key={i} className={cn("border-none shadow-lg shadow-slate-100/50 p-5", stat.bg)}>
            <div className="flex justify-between items-start">
               <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</span>
                  <span className={cn("text-3xl font-black italic", stat.color)}>{stat.value}</span>
               </div>
               <stat.icon size={22} className={cn(stat.color, "opacity-40")} />
            </div>
          </Card>
        ))}
      </div>

      {/* Organizations Table */}
      <Card className="border-none shadow-2xl shadow-slate-100 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-6 p-6">
           <div className="flex items-center gap-6">
              <div>
                <CardTitle className="text-xl font-black">Registered <span className="text-blue-600">Organizations</span></CardTitle>
                <CardDescription className="text-sm font-bold text-slate-400">Federated learning network participants</CardDescription>
              </div>
              <div className="h-10 w-px bg-slate-100" />
              <div className="relative group">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-600 transition-colors" size={14} />
                 <input 
                   className="h-10 w-64 rounded-xl bg-slate-50/50 pl-9 pr-4 text-xs font-bold border border-slate-100 transition-all focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none" 
                   placeholder="Search organizations..." 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-0">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="bg-slate-50/50 border-b border-slate-50">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Organization</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Contact</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {filteredHospitals.length === 0 ? (
                   <tr>
                     <td colSpan={4} className="px-6 py-12 text-center text-sm font-bold text-slate-400">
                       No organizations registered yet. Click "Add Organization" to onboard a hospital node.
                     </td>
                   </tr>
                 ) : filteredHospitals.map(org => (
                    <tr key={org.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                       <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                             <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <Hospital size={18} />
                             </div>
                             <div className="flex flex-col">
                                <span className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{org.name}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{org.id} • {org.address}</span>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <div className={cn(
                             "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                             org.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                          )}>
                             {org.is_active ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                             {org.is_active ? 'Active' : 'Inactive'}
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <span className="text-xs font-bold text-slate-500">{org.contact_email}</span>
                       </td>
                       <td className="px-6 py-5">
                          <div className="flex items-center gap-1">
                             <Button size="sm" variant="outline" className="h-7 px-3 text-[9px] font-black uppercase tracking-widest border text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50">
                               Details
                             </Button>
                          </div>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
           <div className="p-6 border-t border-slate-50 flex items-center justify-between">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Showing {filteredHospitals.length} organizations</p>
           </div>
        </CardContent>
      </Card>

      {/* Add Organization Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-slate-900 p-8 text-white relative">
               <div className="absolute top-0 right-0 p-10 opacity-10">
                  <Hospital size={100} />
               </div>
               <h3 className="text-2xl font-black uppercase tracking-tighter">Register <span className="text-blue-400">Organization</span></h3>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Onboard new hospital node to federated network</p>
            </div>

            <form onSubmit={handleCreateHospital} className="p-8 space-y-5">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Organization Name</label>
                  <input 
                    required type="text" value={newHospital.name}
                    onChange={(e) => setNewHospital({...newHospital, name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                    placeholder="Hospital or research institution name"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Admin Email</label>
                  <input 
                    required type="email" value={newHospital.contact_email}
                    onChange={(e) => setNewHospital({...newHospital, contact_email: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                    placeholder="admin@hospital.org"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address</label>
                  <input 
                    required type="text" value={newHospital.address}
                    onChange={(e) => setNewHospital({...newHospital, address: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                    placeholder="City, State"
                  />
               </div>
               <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)}
                    className="flex-1 px-6 py-4 rounded-xl bg-white border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">
                    Cancel
                  </button>
                  <button type="submit"
                    className="flex-1 px-6 py-4 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-blue-200">
                    Register Node
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </RoleGuard>
  );
}
