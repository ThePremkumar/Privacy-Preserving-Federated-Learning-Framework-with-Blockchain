'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Users, BrainCircuit, ShieldCheck, Activity, AlertTriangle, FileText, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Link from 'next/link';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const COLORS = ['#0F4C81', '#0D9488', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// ── Skeleton ──────────────────────────────────────────────
const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('skeleton rounded-xl', className)} />
);

// ── KPI Tile ──────────────────────────────────────────────
function KpiTile({ label, value, sub, trend, icon: Icon, color }: {
  label: string; value: string; sub?: string; trend?: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<{ size?: number; className?: string }>; color: string;
}) {
  const colors: Record<string, { bg: string; text: string; light: string }> = {
    blue:    { bg: 'bg-blue-700',   text: 'text-blue-700',   light: 'bg-blue-50' },
    teal:    { bg: 'bg-teal-600',   text: 'text-teal-600',   light: 'bg-teal-50' },
    amber:   { bg: 'bg-amber-600',  text: 'text-amber-600',  light: 'bg-amber-50' },
    red:     { bg: 'bg-red-600',    text: 'text-red-600',    light: 'bg-red-50' },
    purple:  { bg: 'bg-purple-600', text: 'text-purple-600', light: 'bg-purple-50' },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className="kpi-card glass-card p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center text-white shadow-lg', c.bg)}>
          <Icon size={22} />
        </div>
        {trend && (
          <div className={cn('flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full',
            trend === 'up' ? 'text-teal-700 bg-teal-50' : trend === 'down' ? 'text-red-600 bg-red-50' : 'text-slate-500 bg-slate-100'
          )}>
            {trend === 'up' ? <TrendingUp size={10} /> : trend === 'down' ? <TrendingDown size={10} /> : null}
            {trend === 'up' ? 'Rising' : trend === 'down' ? 'Dropping' : 'Stable'}
          </div>
        )}
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="text-3xl font-black text-slate-900 mt-1 animate-count-up">{value}</p>
      {sub && <p className="text-[10px] font-bold text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

// ── Chart Card wrapper ────────────────────────────────────
function ChartCard({ title, sub, children, action }: { title: string; sub?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-base font-black text-slate-900">{title}</h3>
          {sub && <p className="text-[11px] font-bold text-slate-400 mt-0.5">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ── Custom tooltip ────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-xl p-3 min-w-[140px]">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-xs font-bold text-slate-700">{p.name}: <span className="text-slate-900 font-black">{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span></span>
        </div>
      ))}
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════
export default function AnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const role = user?.role;
  const isAdmin = role === 'super_admin' || role === 'admin';
  const isDoctor = role === 'doctor';

  async function load(showRefresh = false) {
    if (showRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [adminRes, healthRes, docRes] = await Promise.all([
        isAdmin ? api.get('/admin/analytics/overview').catch(() => ({ data: null })) : Promise.resolve({ data: null }),
        isAdmin ? api.get('/admin/model-health').catch(() => ({ data: null })) : Promise.resolve({ data: null }),
        isDoctor ? api.get('/doctor/summary').catch(() => ({ data: null })) : Promise.resolve({ data: null }),
      ]);
      setData({ admin: adminRes.data, health: healthRes.data, doctor: docRes.data });
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }

  useEffect(() => { if (user) load(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null;

  // ── Mock monthly data (supplement real data) ──────────────
  const monthlyRounds = [
    { month: 'Jan', rounds: 2, accuracy: 74 },
    { month: 'Feb', rounds: 3, accuracy: 78 },
    { month: 'Mar', rounds: 5, accuracy: 82 },
    { month: 'Apr', rounds: 4, accuracy: 85 },
    { month: 'May', rounds: 6, accuracy: 88 },
    { month: 'Jun', rounds: 7, accuracy: 91 },
  ];

  const privacyData = [
    { hospital: 'Node A', used: 4.2, remaining: 5.8 },
    { hospital: 'Node B', used: 7.1, remaining: 2.9 },
    { hospital: 'Node C', used: 2.5, remaining: 7.5 },
    { hospital: 'Node D', used: 8.8, remaining: 1.2 },
  ];

  const participationData = [
    { name: 'Active & Contributing', value: 68, color: '#0D9488' },
    { name: 'Active, Idle', value: 20, color: '#f59e0b' },
    { name: 'Inactive', value: 12, color: '#ef4444' },
  ];

  const a = data?.admin || {};
  const mh = data?.health || {};
  const accuracyHistory = mh.accuracy_history || monthlyRounds.map((m, i) => ({ round: `R${i+1}`, accuracy: m.accuracy, loss: (100 - m.accuracy) / 100 }));
  const docData = data?.doctor || {};

  // Doctor-specific derived data (Using Real Data now!)
  const riskDist = [
    { name: 'Low Risk', value: docData.risk_distribution?.low || 0, color: '#10b981' },
    { name: 'Moderate', value: docData.risk_distribution?.moderate || 0, color: '#f59e0b' },
    { name: 'High Risk', value: docData.risk_distribution?.high || 0, color: '#ef4444' },
  ];

  const predTypes = Object.entries(docData.prediction_types || {}).map(([name, value]) => ({
    name: name.replace('_', ' '), value: value as number, color: name === 'ai_prediction' ? '#0F4C81' : '#0D9488',
  }));

  const patientTrend = docData.patient_trend || [];

  if (loading) return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><Skeleton className="h-10 w-64 mb-2" /><Skeleton className="h-4 w-40" /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-72" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Header ──────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">
            {isAdmin ? 'Platform ' : isDoctor ? 'Clinical ' : 'My '}
            <span className="gradient-text">Analytics</span>
          </h1>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">
            {isAdmin ? 'Network-wide intelligence & training metrics' : isDoctor ? 'Patient outcomes & diagnostic performance' : 'Training & contribution metrics'}
          </p>
        </div>
        <button
          onClick={() => load(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 text-white text-xs font-black hover:bg-blue-800 transition-all shadow-lg shadow-blue-200"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* ADMIN / SUPER ADMIN ANALYTICS */}
      {/* ══════════════════════════════════════════════ */}
      {isAdmin && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <KpiTile label="Global Accuracy" value={a.latest_global_accuracy ? `${(parseFloat(a.latest_global_accuracy)*100).toFixed(1)}%` : '—'} sub={`Round #${a.latest_round || 0}`} trend="up" icon={BrainCircuit} color="blue" />
            <KpiTile label="Participating Nodes" value={String(a.total_hospitals || 0)} sub={`${a.total_users || 0} total users`} trend="up" icon={Activity} color="teal" />
            <KpiTile label="Aggregation Rounds" value={String(a.total_aggregation_rounds || 0)} sub={`${a.total_training_jobs || 0} training jobs`} trend="neutral" icon={TrendingUp} color="purple" />
            <KpiTile label="Total Records" value={a.total_records ? a.total_records.toLocaleString() : '0'} sub="Federated dataset size" trend="up" icon={FileText} color="amber" />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Model Convergence" sub="Accuracy & loss across aggregation rounds">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={accuracyHistory}>
                  <defs>
                    <linearGradient id="gAcc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F4C81" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0F4C81" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="round" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 700, fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 700, fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="accuracy" stroke="#0F4C81" strokeWidth={3} fill="url(#gAcc)" name="Accuracy (%)" />
                  <Line type="monotone" dataKey="loss" stroke="#ef4444" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Loss" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Monthly Training Rounds" sub="Aggregation activity per month">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthlyRounds} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 700, fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 700, fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="rounds" name="Rounds" radius={[6, 6, 0, 0]}>
                    {monthlyRounds.map((_, i) => <Cell key={i} fill={i === monthlyRounds.length - 1 ? '#0F4C81' : '#bfdbfe'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Privacy Budget Consumption" sub="ε used vs remaining per hospital node">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={privacyData} layout="vertical" barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 700, fontSize: 11 }} domain={[0, 10]} />
                  <YAxis type="category" dataKey="hospital" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 700, fontSize: 11 }} width={56} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="used" name="Used (ε)" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="remaining" name="Remaining (ε)" stackId="a" fill="#d1fae5" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Hospital Participation Rate" sub="Node activity distribution">
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={participationData} cx="40%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                      {participationData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-3 min-w-[140px]">
                  {participationData.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full shrink-0" style={{ background: d.color }} />
                      <div>
                        <p className="text-[10px] font-black text-slate-700 leading-none">{d.name}</p>
                        <p className="text-[9px] font-bold text-slate-400">{d.value}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>
          </div>

          {/* Training status breakdown */}
          {a.training_by_status && (
            <ChartCard title="Training Job Status Breakdown" sub="Lifecycle distribution of all jobs">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.entries(a.training_by_status).map(([status, count]) => (
                  <div key={status} className="glass-card rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-slate-900">{count as number}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">{status}</p>
                  </div>
                ))}
              </div>
            </ChartCard>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* DOCTOR ANALYTICS */}
      {/* ══════════════════════════════════════════════ */}
      {isDoctor && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <KpiTile label="Total Patients" value={String(docData.total_patients || 0)} sub="Active records" trend="up" icon={Users} color="blue" />
            <KpiTile label="AI Predictions" value={String(docData.active_predictions || 0)} sub="All-time analyses" trend="up" icon={BrainCircuit} color="teal" />
            <KpiTile label="Anomaly Alerts" value={String(docData.anomaly_count || 0)} sub="Require attention" trend={docData.anomaly_count > 0 ? 'down' : 'neutral'} icon={AlertTriangle} color={docData.anomaly_count > 0 ? 'red' : 'teal'} />
            <KpiTile label="Clinical Reports" value={String(docData.total_reports || 0)} sub="Generated reports" trend="up" icon={FileText} color="purple" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Patient Registration Trend" sub="Monthly patient intake">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={patientTrend}>
                  <defs>
                    <linearGradient id="gPat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0D9488" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 700, fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 700, fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="patients" stroke="#0D9488" strokeWidth={3} fill="url(#gPat)" name="Patients" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Patient Risk Distribution" sub="AI-assessed risk stratification">
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={riskDist} cx="45%" cy="50%" outerRadius={88} paddingAngle={3} dataKey="value">
                      {riskDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-3 min-w-[120px]">
                  {riskDist.map((d, i) => (
                    <div key={i}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                        <span className="text-[10px] font-black text-slate-700">{d.name}</span>
                      </div>
                      <div className="progress-bar ml-4">
                        <div className="progress-bar-fill" style={{ width: `${d.value}%`, background: d.color }} />
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 ml-4 mt-0.5">{d.value}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>

            <ChartCard title="Prediction Type Breakdown" sub="AI vs NLP analysis split">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={predTypes} barSize={48}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 700, fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 700, fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Count" radius={[8, 8, 0, 0]}>
                    {predTypes.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Demographics — Age Groups" sub="Patient age distribution">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={Object.entries(docData.age_groups || { '0-18': 4, '19-35': 12, '36-55': 18, '56-75': 9, '75+': 3 }).map(([k, v]) => ({ group: k, count: v }))}
                  barSize={36}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="group" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 700, fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 700, fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Patients" radius={[6, 6, 0, 0]} fill="#0F4C81" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}

      {/* ── Hospital Analytics ───────────────────── */}
      {role === 'hospital' && (
        <div className="glass-card rounded-2xl p-8 text-center">
          <TrendingUp size={48} className="mx-auto text-blue-200 mb-4" />
          <h3 className="text-lg font-black text-slate-700">Hospital Analytics</h3>
          <p className="text-sm text-slate-400 mt-2">Training history and local vs global model comparison</p>
          <Link href="/dashboard/data-upload" className="inline-block mt-4 px-6 py-2.5 bg-blue-700 text-white text-xs font-black rounded-xl hover:bg-blue-800 transition-all shadow-lg shadow-blue-200">
            Upload Dataset to Begin →
          </Link>
        </div>
      )}
    </div>
  );
}
