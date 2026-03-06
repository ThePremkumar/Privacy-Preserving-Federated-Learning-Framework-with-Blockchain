'use client';

import React from 'react';
import { 
  Activity, 
  ShieldCheck, 
  Database, 
  BrainCircuit, 
  Globe, 
  ChevronRight,
  TrendingUp,
  Hospital,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  Zap,
  AlertTriangle,
  FileSearch,
  Plus,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Dashboard data should be fetched from relevant APIs
const chartData: { name: string; accuracy: number; loss: number }[] = [];
// In production, populate from: GET /federated/training-history

const riskDistribution: { name: string; value: number; color: string }[] = [];
// In production, populate from: GET /predictions/risk-distribution

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  const isSuperAdmin = user.role === 'super_admin';
  const isAdmin = user.role === 'admin';
  const isHospital = user.role === 'hospital';
  const isDoctor = user.role === 'doctor';

  return (
    <div className="space-y-10">
      {/* Dynamic Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-[1.1]">
             {isDoctor && "Clinical "}
             {isHospital && "Facility "}
             {isAdmin && "Administrative "}
             {isSuperAdmin && "System "}
             <span className="text-blue-600 underline decoration-blue-100 underline-offset-8">Intelligence.</span>
          </h1>
          <p className="mt-4 text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
             <Calendar size={16} className="text-blue-600" /> {user.role.replace('_', ' ')} Portal
          </p>
        </div>
        <div className="flex gap-4">
           {isDoctor && <Button className="h-12 px-8 shadow-xl shadow-blue-200">New Patient <Plus size={18} className="ml-2" /></Button>}
           {isHospital && <Button className="h-12 px-8 shadow-xl shadow-blue-200">Upload Dataset <Layers size={18} className="ml-2" /></Button>}
           {(isSuperAdmin || isAdmin) && <Button className="h-12 px-8 shadow-xl shadow-blue-200">Global Training <Zap size={18} className="ml-2" /></Button>}
        </div>
      </div>

      {/* KPI Stats - Context Sensitive */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {(isSuperAdmin || isAdmin) ? (
          <>
            <StatCard label="Global Model Accuracy" value="—" icon={BrainCircuit} trend="—" />
            <StatCard label="Participating Nodes" value="—" icon={Hospital} trend="—" />
            <StatCard label="Blockchain Tx" value="—" icon={ShieldCheck} trend="—" />
            <StatCard label="Privacy Compliance" value="—" icon={ShieldCheck} trend="Pending" />
          </>
        ) : isHospital ? (
          <>
            <StatCard label="Local Model Accuracy" value="—" icon={Activity} trend="—" />
            <StatCard label="Hospital Records" value="—" icon={Database} trend="—" />
            <StatCard label="Updates Submitted" value="—" icon={BrainCircuit} trend="—" />
            <StatCard label="Privacy Budget" value="—" icon={ShieldCheck} trend="—" />
          </>
        ) : (
          <>
            <StatCard label="Clinical Risk Alerts" value="—" icon={AlertTriangle} trend="—" danger />
            <StatCard label="Diagnostic Predictions" value="—" icon={BrainCircuit} trend="—" />
            <StatCard label="Patient Anomalies" value="—" icon={Activity} trend="—" danger />
            <StatCard label="NLP Reports Sync" value="—" icon={FileSearch} trend="—" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Main Chart Section */}
        <Card className="lg:col-span-8 border-none shadow-2xl shadow-slate-100 overflow-hidden relative">
           <div className="absolute top-0 right-0 p-8 text-blue-100 opacity-20">
              <TrendingUp size={160} />
           </div>
           <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-6 relative">
              <div>
                <CardTitle className="text-2xl font-black">Performance <span className="text-blue-600">Analytics</span></CardTitle>
                <CardDescription className="text-base font-bold text-slate-400">
                   {isDoctor ? "Diagnostic accuracy and risk scoring" : "Federated model convergence trends"}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                 <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Real-time Feed</span>
              </div>
           </CardHeader>
           <CardContent className="h-[400px] w-full pt-8 -ml-8 relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 700, fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 700, fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 50px -12px rgb(0 0 0 / 0.1)', padding: '16px'}}
                  />
                  <Area type="monotone" dataKey="accuracy" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorAcc)" />
                </AreaChart>
              </ResponsiveContainer>
           </CardContent>
           <CardFooter className="bg-slate-50/50 p-6 flex justify-between">
              <div className="flex gap-8">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Converged Accuracy</span>
                    <span className="text-xl font-black italic">—</span>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aggregation Latency</span>
                    <span className="text-xl font-black italic">—</span>
                 </div>
              </div>
              <Button size="sm" variant="outline" className="h-10 border-2 font-black uppercase tracking-widest text-[9px]">Full Meta Report <ArrowRight size={14} className="ml-1" /></Button>
           </CardFooter>
        </Card>

        {/* Patient Risk Stratification Heatmap */}
        <div className="lg:col-span-4 space-y-8">
           <Card className="border-none shadow-2xl shadow-slate-100 p-8 flex flex-col items-center">
              <CardHeader className="p-0 border-b border-slate-50 pb-6 mb-6 w-full">
                 <CardTitle className="text-xl font-black italic tracking-tight uppercase italic">Risk <span className="text-blue-600">Stratification</span></CardTitle>
                 <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Patient Distribution Heatmap</CardDescription>
              </CardHeader>
              <CardContent className="p-0 w-full space-y-8">
                 <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie
                            data={riskDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                          >
                            {riskDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    {riskDistribution.map(item => (
                      <div key={item.name} className="flex flex-col p-4 rounded-2xl bg-slate-50 border border-slate-100">
                         <div className="flex items-center gap-2 mb-1">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.name}</span>
                         </div>
                         <span className="text-xl font-black italic text-slate-900">{item.value}</span>
                      </div>
                    ))}
                 </div>
              </CardContent>
           </Card>

           <Card className="border-none shadow-2xl shadow-slate-100 bg-slate-900 text-white p-8">
              <div className="flex items-center gap-4 mb-6">
                 <div className="h-12 w-12 rounded-2xl bg-blue-600/20 text-blue-500 flex items-center justify-center border border-blue-600/30">
                    <ShieldCheck size={24} />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-lg font-black italic">Node Protected</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">Differential Privacy Level 4</span>
                 </div>
              </div>
              <p className="text-xs font-medium text-white/60 leading-relaxed mb-6">
                 Your clinical node is participating in the current training round. Local gradients are noise-injected for total patient anonymity.
              </p>
              <div className="flex items-center justify-between pt-6 border-t border-white/10">
                 <div className="flex flex-col">
                    <span className="text-sm font-black text-emerald-400 italic">SECURE</span>
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Privacy Budget ε = 1.0</span>
                 </div>
                 <Button size="icon" variant="ghost" className="text-white/40 hover:text-white"><ArrowUpRight size={20} /></Button>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ label, value, icon: Icon, trend, danger = false }: any) => (
  <Card className="group relative overflow-hidden transition-all duration-300 hover:border-blue-500/50 border-none shadow-xl shadow-slate-100">
    <div className="absolute right-0 top-0 h-32 w-32 -translate-y-12 translate-x-12 rounded-full bg-blue-50/50 transition-transform duration-500 group-hover:scale-150" />
    <CardHeader className="relative p-0 flex flex-row items-center gap-4 p-6">
      <div className={cn(
        "flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg",
        danger ? "bg-red-600 shadow-red-100" : "bg-blue-600 shadow-blue-100"
      )}>
        <Icon size={24} />
      </div>
      <div>
        <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</dt>
        <dd className="text-2xl font-black tracking-tight text-slate-900 leading-none">{value}</dd>
      </div>
    </CardHeader>
    <CardContent className="mt-0 flex items-center justify-between relative px-6 pb-6">
       <span className={cn(
         "flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
         danger ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
       )}>
         {trend}
       </span>
       <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          <div className="h-1 w-1 rounded-full bg-emerald-500" /> Live
       </div>
    </CardContent>
  </Card>
);
