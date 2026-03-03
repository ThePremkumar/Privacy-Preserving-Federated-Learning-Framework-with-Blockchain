'use client';

import React from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
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
  Printer
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { useAuth } from '@/hooks/useAuth';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  AreaChart, Area
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const monthlyData = [
  { month: 'Sep', predictions: 1240, patients: 842 },
  { month: 'Oct', predictions: 1420, patients: 918 },
  { month: 'Nov', predictions: 1680, patients: 1042 },
  { month: 'Dec', predictions: 1520, patients: 980 },
  { month: 'Jan', predictions: 1890, patients: 1180 },
  { month: 'Feb', predictions: 2140, patients: 1340 },
];

const diseaseDistribution = [
  { name: 'Diabetes', value: 35, color: '#3b82f6' },
  { name: 'Cardiovascular', value: 28, color: '#ef4444' },
  { name: 'Hypertension', value: 22, color: '#f59e0b' },
  { name: 'Respiratory', value: 10, color: '#10b981' },
  { name: 'Other', value: 5, color: '#94a3b8' },
];

const nodeContributions = [
  { node: 'Mayo', samples: 12400 },
  { node: 'Hopkins', samples: 18200 },
  { node: 'Stanford', samples: 8100 },
  { node: 'Cleveland', samples: 5400 },
  { node: 'MGH', samples: 9800 },
  { node: 'UCSF', samples: 4200 },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  return (
    <RoleGuard allowedRoles={['super_admin', 'admin', 'hospital']}>
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">
            {isAdmin ? 'Reports &' : 'Local'} <span className="text-blue-600">{isAdmin ? 'Analytics' : 'Reports'}</span>
          </h1>
          <p className="mt-1 text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
             <BarChart3 size={14} className="text-blue-600" /> {isAdmin ? 'Platform-wide performance metrics' : 'Organization-level statistics'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="h-11 px-6 border-2">
            <Printer size={16} className="mr-2" /> Print
          </Button>
          <Button className="h-11 px-6 shadow-xl shadow-blue-200">
            <Download size={16} className="mr-2" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Predictions', value: '9,890', trend: '+12%', up: true, icon: BrainCircuit },
          { label: 'Active Patients', value: '6,302', trend: '+8%', up: true, icon: Users },
          { label: 'Risk Alerts', value: '124', trend: '-5%', up: true, icon: Activity },
          { label: 'Compliance Score', value: '99.8%', trend: 'Verified', up: true, icon: ShieldCheck },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-lg shadow-slate-100/50 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <stat.icon size={18} />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
                stat.up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              )}>
                {stat.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {stat.trend}
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
            <p className="text-2xl font-black italic text-slate-900 mt-1">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Prediction Trends */}
        <Card className="lg:col-span-8 border-none shadow-2xl shadow-slate-100">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-5">
            <div>
              <CardTitle className="text-xl font-black">Prediction <span className="text-blue-600">Trends</span></CardTitle>
              <CardDescription className="text-sm font-bold text-slate-400">Monthly prediction volume & patient reach</CardDescription>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-600" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Predictions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Patients</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[300px] pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 700, fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 700, fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -8px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 700 }} />
                <Bar dataKey="predictions" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={24} />
                <Bar dataKey="patients" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Disease Distribution */}
        <Card className="lg:col-span-4 border-none shadow-2xl shadow-slate-100">
          <CardHeader className="border-b border-slate-50 pb-5">
            <CardTitle className="text-xl font-black">Disease <span className="text-blue-600">Distribution</span></CardTitle>
            <CardDescription className="text-sm font-bold text-slate-400">Risk category breakdown</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={diseaseDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={6} dataKey="value" stroke="none">
                    {diseaseDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {diseaseDistribution.map(item => (
                <div key={item.name} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-bold text-slate-600">{item.name}</span>
                  </div>
                  <span className="text-xs font-black text-slate-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Node Contributions (Admin only) */}
      {isAdmin && (
        <Card className="border-none shadow-2xl shadow-slate-100">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-5">
            <div>
              <CardTitle className="text-xl font-black">Node <span className="text-blue-600">Contributions</span></CardTitle>
              <CardDescription className="text-sm font-bold text-slate-400">Data samples contributed by each organization</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-[250px] pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={nodeContributions} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 700, fontSize: 11 }} />
                <YAxis dataKey="node" type="category" axisLine={false} tickLine={false} tick={{ fill: '#0f172a', fontWeight: 800, fontSize: 12 }} width={80} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -8px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="samples" fill="#3b82f6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
    </RoleGuard>
  );
}
