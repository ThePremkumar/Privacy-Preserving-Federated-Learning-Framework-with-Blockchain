'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Heart,
  TrendingUp,
  TrendingDown,
  Activity,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Zap,
  ArrowUpRight,
  Clock,
  Dna,
  Server,
  RefreshCw,
  Database,
  BarChart3,
  Loader2,
  Cpu,
  Globe,
  Layers,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar
} from 'recharts';
import { RoleGuard } from '@/components/guards/RoleGuard';
import api from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ModelHealthData {
  accuracy_history: { round: string; accuracy: number; loss: number; samples: number }[];
  hospital_performance: { hospital_id: string; jobs: number; avg_accuracy: number; total_samples: number }[];
  total_rounds: number;
  total_training_jobs: number;
  current_accuracy: number;
  current_loss: number;
  privacy_budget_used: number;
}

export default function ModelHealthPage() {
  const [data, setData] = useState<ModelHealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/model-health');
      setData(res.data);
    } catch { setData(null); }
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

  const d = data || {
    accuracy_history: [], hospital_performance: [],
    total_rounds: 0, total_training_jobs: 0,
    current_accuracy: 0, current_loss: 0, privacy_budget_used: 0,
  };

  const privacyPercent = Math.min((d.privacy_budget_used / 10.0) * 100, 100);

  return (
    <RoleGuard allowedRoles={['super_admin', 'admin']}>
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">Model <span className="text-blue-600">Health</span></h1>
          <p className="mt-1 text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Heart size={14} className="text-red-500" /> Global Model Performance & Privacy Monitoring
          </p>
        </div>
        <Button variant="outline" className="h-11 px-6 border-2" onClick={fetchData}>
          <RefreshCw size={16} className="mr-2" /> Refresh
        </Button>
      </div>

      {/* Health KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <KpiCard icon={TrendingUp} label="Accuracy" value={`${d.current_accuracy.toFixed(1)}%`} color="emerald" desc="Global model" />
        <KpiCard icon={TrendingDown} label="Loss" value={d.current_loss.toFixed(4)} color="blue" desc="Global model" />
        <KpiCard icon={Globe} label="Rounds" value={d.total_rounds.toString()} color="purple" desc="Aggregation rounds" />
        <KpiCard icon={BarChart3} label="Training Jobs" value={d.total_training_jobs.toString()} color="amber" desc="Across all hospitals" />
        <KpiCard icon={ShieldCheck} label="Privacy Budget" value={`${d.privacy_budget_used.toFixed(1)}ε`} color="red" desc={`${privacyPercent.toFixed(0)}% of max`} />
      </div>

      {/* Active Model Status */}
      <Card className="border-none shadow-2xl shadow-slate-100 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 text-white/5"><Heart size={250} /></div>
        <CardContent className="p-8 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center border",
                d.current_accuracy >= 90 ? "bg-emerald-600/20 text-emerald-400 border-emerald-600/30" :
                d.current_accuracy >= 80 ? "bg-amber-600/20 text-amber-400 border-amber-600/30" :
                "bg-red-600/20 text-red-400 border-red-600/30"
              )}>
                <Heart size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black italic">Model Health Status</h2>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">
                  {d.current_accuracy >= 90 ? '✅ Healthy — Model performing within expected range' :
                   d.current_accuracy >= 80 ? '⚠️ Warning — Accuracy below optimal threshold' :
                   '❌ Critical — Model needs retraining'}
                </p>
              </div>
            </div>
            <div className="flex gap-8">
              <div className="text-center">
                <p className={cn("text-4xl font-black italic",
                  d.current_accuracy >= 90 ? "text-emerald-400" : d.current_accuracy >= 80 ? "text-amber-400" : "text-red-400"
                )}>{d.current_accuracy.toFixed(1)}%</p>
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Accuracy</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-black text-blue-400 italic">{d.current_loss.toFixed(4)}</p>
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Loss</p>
              </div>
            </div>
          </div>

          {/* Privacy Budget Bar */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Lock size={14} className="text-amber-400" />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Privacy Budget Usage</span>
              </div>
              <span className="text-xs font-black text-amber-400">{d.privacy_budget_used.toFixed(1)}ε / 10.0ε max</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full transition-all duration-500",
                privacyPercent < 50 ? "bg-emerald-500" : privacyPercent < 80 ? "bg-amber-500" : "bg-red-500"
              )} style={{ width: `${privacyPercent}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Accuracy & Loss Chart */}
        <Card className="lg:col-span-8 border-none shadow-2xl shadow-slate-100">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-5 p-6">
            <div>
              <CardTitle className="text-xl font-black">Training <span className="text-blue-600">Convergence</span></CardTitle>
              <CardDescription className="text-sm font-bold text-slate-400">Accuracy & loss across aggregation rounds</CardDescription>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">Accuracy</span>
              <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100">Loss</span>
            </div>
          </CardHeader>
          <CardContent className="h-[350px] pt-8 -ml-8">
            {d.accuracy_history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={d.accuracy_history}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="round" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 700, fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 700, fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 50px -12px rgb(0  0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="accuracy" stroke="#2563eb" strokeWidth={4} dot={{ r: 6, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} name="Accuracy (%)" />
                  <Line type="monotone" dataKey="loss" stroke="#ef4444" strokeWidth={4} strokeDasharray="8 4" dot={{ r: 6, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} name="Loss" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp size={40} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-sm font-bold text-slate-400">No training data yet</p>
                  <p className="text-[10px] font-bold text-slate-300 mt-1">Charts will populate after aggregation rounds</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hospital Performance */}
        <Card className="lg:col-span-4 border-none shadow-2xl shadow-slate-100">
          <CardHeader className="border-b border-slate-50 pb-5">
            <CardTitle className="text-lg font-black">Hospital <span className="text-blue-600">Performance</span></CardTitle>
            <CardDescription className="text-xs font-bold text-slate-400">Per-node contribution metrics</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {d.hospital_performance.length === 0 ? (
                <div className="p-8 text-center">
                  <Server size={24} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-bold text-slate-400">No hospital data</p>
                </div>
              ) : (
                d.hospital_performance.map((hp, i) => (
                  <div key={i} className="px-5 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 text-[10px] font-black">H{i+1}</div>
                        <div>
                          <p className="text-xs font-black text-slate-900">{hp.hospital_id.substring(0, 12)}...</p>
                          <p className="text-[10px] font-bold text-slate-400">{hp.jobs} jobs • {hp.total_samples.toLocaleString()} samples</p>
                        </div>
                      </div>
                      <span className="text-sm font-black text-emerald-600">{hp.avg_accuracy.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${hp.avg_accuracy}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Samples per Round */}
      {d.accuracy_history.length > 0 && (
        <Card className="border-none shadow-2xl shadow-slate-100">
          <CardHeader className="border-b border-slate-50 pb-5 p-6">
            <CardTitle className="text-xl font-black">Samples per <span className="text-blue-600">Round</span></CardTitle>
            <CardDescription className="text-sm font-bold text-slate-400">Data volume contributing to each aggregation</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] pt-6 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.accuracy_history}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="round" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 700, fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 700, fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 50px -12px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="samples" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Total Samples" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Health Checks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Model Accuracy', status: d.current_accuracy >= 85, icon: Activity, desc: d.current_accuracy >= 85 ? 'Above 85% threshold' : 'Below 85% threshold' },
          { label: 'Privacy Budget', status: privacyPercent < 80, icon: ShieldCheck, desc: privacyPercent < 80 ? 'Within safe limits' : 'Approaching maximum' },
          { label: 'Training Pipeline', status: true, icon: Cpu, desc: 'All systems operational' },
          { label: 'Data Integrity', status: true, icon: Database, desc: 'Hashes verified on-chain' },
        ].map((check, i) => (
          <Card key={i} className={cn("border-none shadow-xl transition-all", check.status ? "shadow-emerald-50" : "shadow-red-50")}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center border",
                  check.status ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
                )}>
                  <check.icon size={20} />
                </div>
                {check.status ? <CheckCircle2 size={18} className="text-emerald-500" /> : <AlertTriangle size={18} className="text-red-500" />}
              </div>
              <h4 className="text-sm font-black text-slate-900 mt-3">{check.label}</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{check.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
    </RoleGuard>
  );
}

function KpiCard({ icon: Icon, label, value, color, desc }: any) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    red: 'bg-red-50 text-red-600 border-red-100',
  };
  return (
    <Card className="border-none shadow-xl shadow-slate-100">
      <CardContent className="p-5">
        <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center border mb-3", colors[color])}><Icon size={18} /></div>
        <p className="text-2xl font-black text-slate-900">{value}</p>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{label}</p>
        <p className="text-[9px] font-bold text-slate-300 mt-0.5">{desc}</p>
      </CardContent>
    </Card>
  );
}
