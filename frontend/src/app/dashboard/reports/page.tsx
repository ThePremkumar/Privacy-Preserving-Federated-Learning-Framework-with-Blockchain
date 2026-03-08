'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Activity,
  Users,
  Hospital,
  BrainCircuit,
  ShieldCheck,
  Database,
  ArrowUpRight,
  FileText,
  Printer,
  Loader2,
  RefreshCw,
  Globe,
  Layers,
  Cpu,
  PieChartIcon
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  AreaChart, Area
} from 'recharts';
import { RoleGuard } from '@/components/guards/RoleGuard';
import api from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Analytics {
  total_users: number;
  total_hospitals: number;
  total_uploads: number;
  total_training_jobs: number;
  total_aggregation_rounds: number;
  total_records: number;
  users_by_role: Record<string, number>;
  training_by_status: Record<string, number>;
  latest_global_accuracy: string | null;
  latest_global_loss: string | null;
  latest_round: number;
}

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];

export default function ReportsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/analytics/overview');
      setAnalytics(res.data);
    } catch { setAnalytics(null); }
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (isLoading) {
    return (
      <RoleGuard allowedRoles={['super_admin', 'admin']}>
        <div className="flex items-center justify-center h-96"><Loader2 size={40} className="animate-spin text-blue-600" /></div>
      </RoleGuard>
    );
  }

  const d = analytics || {
    total_users: 0, total_hospitals: 0, total_uploads: 0,
    total_training_jobs: 0, total_aggregation_rounds: 0, total_records: 0,
    users_by_role: {}, training_by_status: {},
    latest_global_accuracy: null, latest_global_loss: null, latest_round: 0,
  };

  // Chart data
  const roleData = Object.entries(d.users_by_role).filter(([, v]) => v > 0).map(([name, value], i) => ({
    name: name.replace('_', ' ').toUpperCase(), value, color: COLORS[i % COLORS.length]
  }));

  const statusData = Object.entries(d.training_by_status).filter(([, v]) => v > 0).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1), value
  }));

  const handlePrint = () => { window.print(); };

  return (
    <RoleGuard allowedRoles={['super_admin', 'admin']}>
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">Reports & <span className="text-blue-600">Analytics</span></h1>
          <p className="mt-1 text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <BarChart3 size={14} className="text-blue-600" /> Platform-Wide Performance Dashboard
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="h-11 px-5 border-2" onClick={fetchData}>
            <RefreshCw size={16} className="mr-2" /> Refresh
          </Button>
          <Button variant="outline" className="h-11 px-5 border-2" onClick={handlePrint}>
            <Printer size={16} className="mr-2" /> Print Report
          </Button>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiSmall icon={Users} label="Total Users" value={d.total_users} color="blue" />
        <KpiSmall icon={Hospital} label="Hospitals" value={d.total_hospitals} color="emerald" />
        <KpiSmall icon={Database} label="Uploads" value={d.total_uploads} color="amber" />
        <KpiSmall icon={Cpu} label="Training Jobs" value={d.total_training_jobs} color="purple" />
        <KpiSmall icon={Globe} label="Aggregation Rounds" value={d.total_aggregation_rounds} color="indigo" />
        <KpiSmall icon={FileText} label="Total Records" value={d.total_records} color="pink" />
      </div>

      {/* Global Model Summary */}
      <Card className="border-none shadow-2xl shadow-slate-100 bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 text-white/5"><BrainCircuit size={250} /></div>
        <CardContent className="p-8 relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Global Model Status</p>
              <h2 className="text-3xl font-black italic mt-1">
                {d.latest_round > 0 ? `Round #${d.latest_round} Complete` : 'No Aggregation Yet'}
              </h2>
              <p className="text-white/40 text-xs font-bold mt-2">
                {d.total_training_jobs} training jobs processed • {d.total_records.toLocaleString()} total data records
              </p>
            </div>
            <div className="flex gap-8">
              {d.latest_global_accuracy && (
                <div className="text-center">
                  <p className="text-4xl font-black text-emerald-400 italic">{(parseFloat(d.latest_global_accuracy) * 100).toFixed(1)}%</p>
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Accuracy</p>
                </div>
              )}
              {d.latest_global_loss && (
                <div className="text-center">
                  <p className="text-4xl font-black text-blue-400 italic">{parseFloat(d.latest_global_loss).toFixed(4)}</p>
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Loss</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Users by Role Chart */}
        <Card className="border-none shadow-2xl shadow-slate-100">
          <CardHeader className="border-b border-slate-50 pb-5 p-6">
            <CardTitle className="text-lg font-black">Users by <span className="text-blue-600">Role</span></CardTitle>
            <CardDescription className="text-xs font-bold text-slate-400">Distribution of platform users</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-4">
            {roleData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={roleData} cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {roleData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -5px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty icon={Users} label="No users data" />
            )}
          </CardContent>
        </Card>

        {/* Training Jobs by Status */}
        <Card className="border-none shadow-2xl shadow-slate-100">
          <CardHeader className="border-b border-slate-50 pb-5 p-6">
            <CardTitle className="text-lg font-black">Training Jobs by <span className="text-blue-600">Status</span></CardTitle>
            <CardDescription className="text-xs font-bold text-slate-400">Pipeline distribution</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-4">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 700, fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 700, fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -5px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Jobs" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty icon={Cpu} label="No training jobs data" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Table */}
      <Card className="border-none shadow-2xl shadow-slate-100">
        <CardHeader className="border-b border-slate-50 pb-5 p-6">
          <CardTitle className="text-lg font-black">Platform <span className="text-blue-600">Summary</span></CardTitle>
          <CardDescription className="text-xs font-bold text-slate-400">Key metrics at a glance</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Metric</th>
                <th className="text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Value</th>
                <th className="text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                { metric: 'Registered Users', value: d.total_users, status: d.total_users > 0 ? 'Active' : 'None' },
                { metric: 'Hospital Nodes', value: d.total_hospitals, status: d.total_hospitals > 0 ? 'Connected' : 'None' },
                { metric: 'Data Uploads', value: d.total_uploads, status: d.total_uploads > 0 ? 'Complete' : 'Pending' },
                { metric: 'Total Records Processed', value: d.total_records.toLocaleString(), status: 'Verified' },
                { metric: 'Training Jobs', value: d.total_training_jobs, status: d.total_training_jobs > 0 ? 'Active' : 'None' },
                { metric: 'Aggregation Rounds', value: d.total_aggregation_rounds, status: d.total_aggregation_rounds > 0 ? 'Complete' : 'Pending' },
                { metric: 'Global Model Accuracy', value: d.latest_global_accuracy ? `${(parseFloat(d.latest_global_accuracy) * 100).toFixed(1)}%` : '—', status: d.latest_global_accuracy ? 'Healthy' : 'Not Available' },
                { metric: 'Global Model Loss', value: d.latest_global_loss ? parseFloat(d.latest_global_loss).toFixed(4) : '—', status: d.latest_global_loss ? 'Converging' : 'Not Available' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 text-sm font-bold text-slate-900">{row.metric}</td>
                  <td className="px-6 py-3 text-sm font-black text-blue-600">{row.value}</td>
                  <td className="px-6 py-3">
                    <span className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
                      row.status === 'Active' || row.status === 'Connected' || row.status === 'Complete' || row.status === 'Healthy' || row.status === 'Verified' || row.status === 'Converging'
                        ? "bg-emerald-50 text-emerald-700"
                        : row.status === 'Pending' ? "bg-amber-50 text-amber-700"
                        : "bg-slate-50 text-slate-500"
                    )}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
    </RoleGuard>
  );
}

function KpiSmall({ icon: Icon, label, value, color }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    pink: 'bg-pink-50 text-pink-600 border-pink-100',
  };
  return (
    <Card className="border-none shadow-lg shadow-slate-100 hover:shadow-xl transition-all">
      <CardContent className="p-4">
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center border mb-2", colors[color])}><Icon size={16} /></div>
        <p className="text-2xl font-black text-slate-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}

function Empty({ icon: Icon, label }: any) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <Icon size={32} className="mx-auto text-slate-200 mb-2" />
        <p className="text-sm font-bold text-slate-400">{label}</p>
      </div>
    </div>
  );
}

function CheckCircle2({ size, className }: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
}
