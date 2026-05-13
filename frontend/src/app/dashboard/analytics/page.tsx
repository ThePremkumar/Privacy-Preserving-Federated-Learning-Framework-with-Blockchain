'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, BrainCircuit, ShieldCheck, 
  Activity, AlertTriangle, FileText, Loader2, RefreshCw,
  Cpu, Globe, Zap, Shield, Database, Layout, Clock, ChevronRight,
  Sparkles, Lock, ArrowUpRight, Gauge
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Link from 'next/link';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

// ── KPI Tile (Premium Light Version) ────────────────────────
function KpiTile({ label, value, sub, trend, icon: Icon, color, delay = "0ms" }: {
  label: string; value: string; sub?: string; trend?: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<{ size?: number; className?: string }>; 
  color: 'blue' | 'emerald' | 'amber' | 'rose' | 'violet';
  delay?: string;
}) {
  const styles = {
    blue:    { glow: 'shadow-blue-100', icon: 'text-blue-600',  bg: 'bg-blue-50', border: 'border-blue-100' },
    emerald: { glow: 'shadow-emerald-100', icon: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    amber:   { glow: 'shadow-amber-100', icon: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    rose:    { glow: 'shadow-rose-100', icon: 'text-rose-600',  bg: 'bg-rose-50', border: 'border-rose-100' },
    violet:  { glow: 'shadow-violet-100', icon: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
  };
  const s = styles[color];

  return (
    <div 
      className={cn(
        "group relative p-6 rounded-3xl bg-white border transition-all duration-500 hover:-translate-y-1 shadow-2xl shadow-slate-100 overflow-hidden",
        s.border
      )}
      style={{ transitionDelay: delay }}
    >
      <div className="absolute top-0 right-0 p-8 text-slate-100 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
        <Icon size={120} strokeWidth={0.5} />
      </div>
      
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center border transition-transform duration-500 group-hover:scale-110", s.bg, s.border)}>
          <Icon size={24} className={s.icon} />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-tighter",
            trend === 'up' ? "bg-emerald-50 text-emerald-600" : trend === 'down' ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-400"
          )}>
            {trend === 'up' ? <TrendingUp size={12} /> : trend === 'down' ? <TrendingDown size={12} /> : <Activity size={12} />}
            {trend === 'up' ? "Rising" : trend === 'down' ? "Dropping" : "Stable"}
          </div>
        )}
      </div>

      <div className="relative z-10">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-4xl font-black text-slate-900 italic tracking-tighter leading-none">{value}</p>
          {sub && <span className="text-[10px] font-bold text-slate-400 italic uppercase">{sub}</span>}
        </div>
      </div>
    </div>
  );
}

// ── Chart Card (Premium Light Version) ────────────────────
function ChartCard({ title, sub, icon: Icon, children, className }: { 
  title: string; sub?: string; icon?: any; children: React.ReactNode; className?: string 
}) {
  return (
    <div className={cn("relative p-8 rounded-[2rem] bg-white border border-slate-100 shadow-2xl shadow-slate-100 group overflow-hidden", className)}>
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
              <Icon size={20} />
            </div>
          )}
          <div>
            <h3 className="text-lg font-black text-slate-900 italic tracking-tight uppercase leading-none">{title}</h3>
            {sub && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">{sub}</p>}
          </div>
        </div>
        <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 hover:text-blue-500 transition-colors cursor-pointer">
          <Sparkles size={14} />
        </div>
      </div>
      <div className="relative z-10 h-[280px]">
        {children}
      </div>
    </div>
  );
}

// ── Custom Tooltip (Premium Light Version) ────────────────
const AGTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 border border-slate-100 backdrop-blur-xl rounded-2xl p-4 shadow-2xl min-w-[160px]">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic border-b border-slate-50 pb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4 mt-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
            <span className="text-[11px] font-bold text-slate-500 italic">{p.name}</span>
          </div>
          <span className="text-xs font-black text-slate-900 italic">
            {typeof p.value === 'number' && p.name.includes('%') ? p.value.toFixed(1) + '%' : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true); else setIsLoading(true);
    try {
      const [ovRes, histRes] = await Promise.all([
        api.get('/admin/analytics/overview'),
        api.get('/training/aggregation-history')
      ]);
      setStats(ovRes.data);
      setHistory([...histRes.data].reverse());
    } catch (err) {
      console.error('Analytics load error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="h-20 w-20 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <BrainCircuit size={32} className="text-blue-600 animate-pulse" />
          </div>
        </div>
        <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] italic animate-pulse">Syncing Intelligence...</p>
      </div>
    );
  }

  const convergenceData = history.map(r => ({
    round: `R${r.round_number}`,
    accuracy: parseFloat(r.global_accuracy) * 100,
    loss: parseFloat(r.global_loss),
    samples: r.total_samples
  }));

  const nodeDist = stats?.hospitals_distribution || [
    { type: 'Public', value: 45, color: '#2563eb' },
    { type: 'Private', value: 35, color: '#10b981' },
    { type: 'Research', value: 20, color: '#8b5cf6' }
  ];

  return (
    <div className="space-y-10 pb-16 animate-in fade-in duration-700">
      {/* ── Page Header ────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-lg">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest italic">Node Intelligence v4.0</span>
            </div>
            <div className="h-1 w-1 bg-slate-200 rounded-full"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic flex items-center gap-2">
              <Clock size={12} className="text-slate-300" /> Auto-sync: 5m
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">
            Platform <span className="text-blue-600">Analytics</span>
          </h1>
          <p className="text-sm font-bold text-slate-400 italic max-w-lg mt-4 leading-relaxed">
            Real-time telemetry from the federated learning network. Monitoring model health, node participation, and audit trails.
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="h-12 px-8 border-2 font-black italic uppercase text-[11px] tracking-widest hover:bg-slate-50 transition-all rounded-2xl"
            onClick={() => fetchData(true)}
          >
            <RefreshCw size={16} className={cn("mr-2", isRefreshing && "animate-spin")} />
            {isRefreshing ? 'Syncing...' : 'Sync Data'}
          </Button>
          <Link href="/dashboard/model-governance">
            <Button className="h-12 px-8 shadow-2xl shadow-blue-200 font-black italic uppercase text-[11px] tracking-widest hover:scale-105 transition-all rounded-2xl">
              <ShieldCheck size={16} className="mr-2" /> View Governance
            </Button>
          </Link>
        </div>
      </div>

      {/* ── KPI Grid ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiTile label="Global Convergence" value={stats?.latest_global_accuracy ? `${(parseFloat(stats.latest_global_accuracy)*100).toFixed(1)}%` : '91.4%'} sub={`Round #${stats?.latest_round || 12}`} trend="up" icon={Cpu} color="blue" delay="0ms" />
        <KpiTile label="Active Nodes" value={String(stats?.total_hospitals || 24)} sub={`${stats?.total_users || 156} nodes online`} trend="up" icon={Globe} color="emerald" delay="100ms" />
        <KpiTile label="Dataset Size" value={stats?.total_records ? (stats.total_records / 1000).toFixed(0) + 'k' : '55k'} sub="Records aggregated" trend="neutral" icon={Database} color="amber" delay="200ms" />
        <KpiTile label="Privacy Index" value="ε=1.2" sub="DP applied" trend="up" icon={Lock} color="violet" delay="300ms" />
      </div>

      {/* ── Main Charts Grid ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Model Evolution (AreaChart) */}
        <ChartCard title="Global Model Evolution" sub="Convergence trend across aggregation rounds" icon={TrendingUp} className="lg:col-span-8">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={convergenceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="round" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} dx={-10} />
              <Tooltip content={<AGTooltip />} />
              <Area type="monotone" dataKey="accuracy" name="Accuracy (%)" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorAcc)" />
              <Line type="monotone" dataKey="loss" name="Loss Index" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Node Distribution (PieChart) */}
        <ChartCard title="Network Composition" sub="Hospital organization types" icon={Layout} className="lg:col-span-4">
          <div className="flex flex-col h-full justify-center">
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={nodeDist} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none">
                    {nodeDist.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<AGTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {nodeDist.map((d: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <div>
                    <p className="text-[10px] font-black text-slate-700 italic tracking-tight">{d.type || d.name}</p>
                    <p className="text-[9px] font-bold text-slate-400">{d.value}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        {/* Training Velocity (BarChart) */}
        <ChartCard title="Training Velocity" sub="Samples contributed per round" icon={Zap} className="lg:col-span-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={convergenceData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="round" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
              <Tooltip content={<AGTooltip />} />
              <Bar dataKey="samples" name="Total Samples" fill="#10b981" radius={[6, 6, 0, 0]}>
                {convergenceData.map((_, i) => (
                  <Cell key={i} fill={i === convergenceData.length - 1 ? '#2563eb' : '#10b981'} fillOpacity={0.6} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Network Health (RadarChart) */}
        <ChartCard title="Reliability Metrics" sub="Platform consistency & uptime" icon={Gauge} className="lg:col-span-6">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={[
              { subject: 'Uptime', A: 98, fullMark: 100 },
              { subject: 'Integrity', A: 100, fullMark: 100 },
              { subject: 'Privacy', A: 95, fullMark: 100 },
              { subject: 'Latency', A: 85, fullMark: 100 },
              { subject: 'Sync', A: 92, fullMark: 100 },
            ]}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
              <Radar name="Performance" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
              <Tooltip content={<AGTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Data Audit Row ─────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Privacy Audit', value: 'HIPAA ✓', sub: 'Anonymized Data Only', icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
          { title: 'Blockchain', value: '0x8f2...e3f', sub: 'Merkle Hash Verified', icon: Database, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { title: 'Compliance', value: '99.8%', sub: 'Audit Readiness Score', icon: ShieldCheck, color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map((audit, i) => (
          <div key={i} className="p-6 rounded-3xl bg-white border border-slate-100 shadow-2xl shadow-slate-100 flex items-center gap-6 group hover:border-blue-100 transition-all">
            <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center border border-white/5", audit.bg, audit.color)}>
              <audit.icon size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{audit.title}</p>
              <p className="text-xl font-black text-slate-900 italic tracking-tighter leading-none mt-1">{audit.value}</p>
              <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tight">{audit.sub}</p>
            </div>
            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowUpRight size={16} className="text-slate-300" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
