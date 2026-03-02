'use client';

import React from 'react';
import { 
  Heart, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  Zap, 
  ArrowUpRight, 
  Clock, 
  Dna,
  Server,
  Filter,
  RefreshCw,
  Search,
  ChevronRight,
  Database,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area 
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RoleGuard } from '@/components/guards/RoleGuard';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const accuracyData = [
  { name: 'Rd 470', accuracy: 0.912, loss: 0.231 },
  { name: 'Rd 471', accuracy: 0.918, loss: 0.215 },
  { name: 'Rd 472', accuracy: 0.925, loss: 0.201 },
  { name: 'Rd 473', accuracy: 0.922, loss: 0.208 },
  { name: 'Rd 474', accuracy: 0.931, loss: 0.185 },
  { name: 'Rd 475', accuracy: 0.938, loss: 0.172 },
  { name: 'Rd 476', accuracy: 0.948, loss: 0.155 },
];

const driftData = [
  { name: 'Jan', featureDrift: 0.05, labelDrift: 0.02 },
  { name: 'Feb', featureDrift: 0.08, labelDrift: 0.03 },
  { name: 'Mar', featureDrift: 0.12, labelDrift: 0.05 },
  { name: 'Apr', featureDrift: 0.15, labelDrift: 0.07 },
  { name: 'May', featureDrift: 0.14, labelDrift: 0.06 },
  { name: 'Jun', featureDrift: 0.18, labelDrift: 0.09 },
];

export default function ModelHealthPage() {
  return (
    <RoleGuard allowedRoles={['super_admin', 'admin']}>
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-tight">Global <span className="text-blue-600">Model Health</span></h1>
          <p className="mt-2 text-base font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <Heart size={16} className="text-blue-600 animate-pulse" /> Real-time MLOps & Drift Monitoring
          </p>
        </div>
        <div className="flex gap-4">
           <Button variant="outline" className="h-12 border-2 px-8 font-black uppercase tracking-widest text-[10px]">
              Trigger Drift Analysis <RefreshCw size={16} className="ml-2" />
           </Button>
           <Button className="h-12 px-8 shadow-xl shadow-blue-200">
              Update Global Model <Zap size={18} className="ml-2" />
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Key Health Metrics */}
        <Card className="lg:col-span-12 border-none shadow-2xl shadow-slate-100/50 p-8 bg-white">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-12 divide-x divide-slate-100">
              {[
                { label: 'Model Accuracy', value: '94.8%', icon: ShieldCheck, color: 'text-emerald-600', trend: '+2.4%', up: true },
                { label: 'Feature Drift Index', value: '0.18', icon: AlertTriangle, color: 'text-amber-600', trend: '+0.04', up: false },
                { label: 'Active Nodes', value: '182', icon: Server, color: 'text-blue-600', trend: '+12', up: true },
                { label: 'Latency (Agg)', value: '142ms', icon: Clock, color: 'text-slate-900', trend: '-8ms', up: true },
              ].map((stat, i) => (
                <div key={i} className={cn("flex flex-col items-center justify-center space-y-2 px-8", i === 0 ? "pl-0" : "")}>
                   <stat.icon size={28} className={stat.color} />
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</span>
                   <div className="flex items-center gap-3">
                      <span className={cn("text-4xl font-black italic tracking-tighter", stat.color)}>{stat.value}</span>
                      <div className={cn("flex items-center text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full", stat.up ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
                         {stat.up ? <TrendingUp size={10} className="mr-1" /> : <TrendingDown size={10} className="mr-1" />}
                         {stat.trend}
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </Card>

        {/* Global Accuracy/Loss Chart */}
        <Card className="lg:col-span-7 border-none shadow-2xl shadow-slate-100 bg-slate-900 text-white p-8">
           <CardHeader className="p-0 pb-8 flex flex-row items-center justify-between border-b border-white/5 mb-8">
              <div className="flex items-center gap-8">
                 <div className="flex flex-col">
                    <CardTitle className="text-white text-2xl font-black italic">Training <span className="text-blue-500 underline decoration-blue-900 underline-offset-8">Convergence</span></CardTitle>
                    <CardDescription className="text-white/40 font-bold uppercase tracking-widest text-[10px] mt-2">LSTM Architecture v2.4 (Round 470-476)</CardDescription>
                 </div>
                 <div className="h-10 w-[1px] bg-white/10" />
                 <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                       <div className="h-2 w-2 rounded-full bg-blue-500" />
                       <span className="text-[10px] font-bold text-white/50 uppercase">Accuracy</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="h-2 w-2 rounded-full bg-emerald-500" />
                       <span className="text-[10px] font-bold text-white/50 uppercase">Loss Rate</span>
                    </div>
                 </div>
              </div>
              <Button size="icon" variant="ghost" className="text-white/40"><RefreshCw size={18} /></Button>
           </CardHeader>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={accuracyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                       <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                       </linearGradient>
                       <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#ffffff20" fontSize={10} fontWeight="bold" />
                    <YAxis stroke="#ffffff20" fontSize={10} fontWeight="bold" />
                    <Tooltip 
                       contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                       labelStyle={{ fontWeight: 'black', textTransform: 'uppercase', fontSize: '12px', marginBottom: '8px' }}
                    />
                    <Area type="monotone" dataKey="accuracy" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAcc)" />
                    <Area type="monotone" dataKey="loss" stroke="#10b981" fillOpacity={1} fill="url(#colorLoss)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </Card>

        {/* Drift & Alert Panel */}
        <div className="lg:col-span-5 space-y-8">
           <Card className="border-none shadow-2xl shadow-slate-100 p-8 h-full flex flex-col">
              <CardHeader className="p-0 border-b border-slate-50 pb-6 mb-6">
                 <CardTitle className="text-xl font-black italic">Distribution <span className="text-blue-600">Drift Index</span></CardTitle>
                 <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Hospital-level feature shift analysis</CardDescription>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col gap-8">
                 <div className="h-[180px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <LineChart data={driftData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontWeight="bold" />
                          <YAxis stroke="#94a3b8" fontSize={9} fontWeight="bold" />
                          <Tooltip />
                          <Line type="monotone" dataKey="featureDrift" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, stroke: '#ef4444', strokeWidth: 2, fill: '#fff' }} />
                          <Line type="monotone" dataKey="labelDrift" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, stroke: '#3b82f6', strokeWidth: 2, fill: '#fff' }} />
                       </LineChart>
                    </ResponsiveContainer>
                 </div>
                 
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Critical Drift Alerts</h4>
                    {[
                      { msg: 'Significant drift detected in glucose distribution', severity: 'High', time: '12m ago' },
                      { msg: 'Age-related bias shift on Clinical Node 102', severity: 'Medium', time: '4h ago' },
                    ].map((alert, i) => (
                      <div key={i} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-blue-100 transition-all">
                         <div className={cn("h-10 w-10 flex items-center justify-center rounded-xl bg-white shadow-sm shrink-0 transition-transform group-hover:scale-110", alert.severity === 'High' ? "text-red-500" : "text-amber-500")}>
                            <AlertTriangle size={20} />
                         </div>
                         <div className="space-y-1">
                            <div className="flex items-center gap-2">
                               <p className="text-[11px] font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase italic italic tracking-tight">{alert.msg}</p>
                               <span className="h-1 w-1 rounded-full bg-slate-300" />
                               <span className="text-[9px] font-black text-slate-400 uppercase italic italic">{alert.time}</span>
                            </div>
                            <div className="flex gap-2">
                               <span className={cn("text-[8.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border", alert.severity === 'High' ? "bg-red-50 text-red-700 border-red-100" : "bg-amber-50 text-amber-700 border-amber-100")}>{alert.severity} Severity</span>
                               <span className="text-[8.5px] font-black uppercase tracking-widest text-blue-600 cursor-pointer hover:underline underline-offset-4 decoration-blue-200">Mitigate →</span>
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
              </CardContent>
           </Card>
        </div>

        {/* Advanced Diagnostics Grid */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-8 pb-10">
           {[
             { label: 'Layer Correlation', icon: Dna, desc: 'Synapse weight alignment across nodes' },
             { label: 'Privacy Budget Consumption', icon: Database, desc: 'ε-δ cumulative reach for round #476' },
             { label: 'Bias Stratification', icon: BarChart3, desc: 'Demographic parity and fairness metrics' }
           ].map((sub, i) => (
             <Card key={i} className="border-none shadow-xl shadow-slate-100 p-8 group cursor-pointer hover:bg-slate-50 transition-all border border-transparent hover:border-blue-100">
                <div className="flex items-center justify-between mb-4">
                   <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center transition-transform group-hover:scale-110">
                      <sub.icon size={24} />
                   </div>
                   <ArrowUpRight size={18} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                </div>
                <h4 className="text-lg font-black italic italic uppercase italic tracking-tight mb-2">{sub.label}</h4>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">{sub.desc}</p>
             </Card>
           ))}
        </div>
      </div>
    </div>
    </RoleGuard>
  );
}
