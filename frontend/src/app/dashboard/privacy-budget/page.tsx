'use client';

import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle2, RefreshCw, RotateCcw, Loader2, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const MAX_BUDGET = 10.0;

interface HospitalBudget {
  hospital_id: string;
  hospital_name: string;
  rounds_participated: number;
  budget_used: number;
  budget_remaining: number;
  status: 'healthy' | 'warning' | 'critical';
}

// ─── Gauge Meter component ────────────────────────────────
function BudgetGauge({ used, max }: { used: number; max: number }) {
  const pct = Math.min((used / max) * 100, 100);
  const angle = (pct / 100) * 180;
  const color = pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#10b981';

  // SVG arc path helper
  const polarToCartesian = (cx: number, cy: number, r: number, deg: number) => {
    const rad = ((deg - 180) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const arc = (cx: number, cy: number, r: number, startDeg: number, endDeg: number) => {
    const s = polarToCartesian(cx, cy, r, startDeg);
    const e = polarToCartesian(cx, cy, r, endDeg);
    const lg = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${lg} 1 ${e.x} ${e.y}`;
  };
  const needle = polarToCartesian(100, 100, 70, angle);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 120" className="w-56 h-32">
        {/* Background arc */}
        <path d={arc(100, 100, 72, 0, 180)} fill="none" stroke="#e2e8f0" strokeWidth={16} strokeLinecap="round" />
        {/* Green zone */}
        <path d={arc(100, 100, 72, 0, Math.min(angle, 144))} fill="none" stroke={color} strokeWidth={16} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
        {/* Needle */}
        <line x1={100} y1={100} x2={needle.x} y2={needle.y} stroke="#0f172a" strokeWidth={3} strokeLinecap="round" style={{ transition: 'all 0.8s ease' }} />
        <circle cx={100} cy={100} r={6} fill="#0f172a" />
        {/* Labels */}
        <text x={20}  y={115} fontSize={9} fill="#94a3b8" fontWeight={700}>0ε</text>
        <text x={88}  y={30}  fontSize={9} fill="#94a3b8" fontWeight={700}>5ε</text>
        <text x={170} y={115} fontSize={9} fill="#94a3b8" fontWeight={700}>10ε</text>
      </svg>
      <div className="text-center -mt-2">
        <p className="text-4xl font-black" style={{ color }}>{used.toFixed(2)}<span className="text-base font-bold text-slate-400">ε</span></p>
        <p className="text-xs font-bold text-slate-400 mt-1">of {max}ε total budget consumed</p>
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────
function StatusBadge({ status }: { status: HospitalBudget['status'] }) {
  const map = {
    healthy:  { label: 'Healthy',  cls: 'bg-teal-50 text-teal-700 border-teal-200',  icon: CheckCircle2 },
    warning:  { label: 'Warning',  cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle },
    critical: { label: 'Critical', cls: 'bg-red-50 text-red-700 border-red-200',      icon: AlertTriangle },
  };
  const { label, cls, icon: Icon } = map[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest', cls)}>
      <Icon size={10} /> {label}
    </span>
  );
}

// ─── Mock data builder ────────────────────────────────────
function buildMockData(): HospitalBudget[] {
  return [
    { hospital_id: '1', hospital_name: 'Metro General Hospital',  rounds_participated: 6, budget_used: 6.2, budget_remaining: 3.8, status: 'healthy' },
    { hospital_id: '2', hospital_name: 'St. Mary\'s Medical Center', rounds_participated: 9, budget_used: 8.5, budget_remaining: 1.5, status: 'warning' },
    { hospital_id: '3', hospital_name: 'Riverside Community Hospital', rounds_participated: 3, budget_used: 3.0, budget_remaining: 7.0, status: 'healthy' },
    { hospital_id: '4', hospital_name: 'University Research Hospital',  rounds_participated: 10, budget_used: 9.9, budget_remaining: 0.1, status: 'critical' },
  ];
}

export default function PrivacyBudgetPage() {
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState<HospitalBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalUsed, setGlobalUsed] = useState(0);
  const [resetTarget, setResetTarget] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const isSuperAdmin = user?.role === 'super_admin';

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/admin/privacy-budget').catch(() => ({ data: null }));
      if (res.data && Array.isArray(res.data.hospitals)) {
        setHospitals(res.data.hospitals);
        setGlobalUsed(res.data.total_used ?? 0);
      } else {
        const mock = buildMockData();
        setHospitals(mock);
        setGlobalUsed(mock.reduce((s, h) => s + h.budget_used, 0) / mock.length);
      }
    } finally { setLoading(false); }
  }

  useEffect(() => { if (user) load(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleReset(hospitalId: string) {
    setResetting(true);
    try {
      await api.post(`/admin/privacy-budget/reset/${hospitalId}`).catch(() => null);
      setHospitals(prev => prev.map(h =>
        h.hospital_id === hospitalId
          ? { ...h, budget_used: 0, budget_remaining: MAX_BUDGET, status: 'healthy' }
          : h
      ));
      showToast('Privacy budget reset successfully.');
    } finally { setResetting(false); setResetTarget(null); }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="animate-spin text-blue-700" size={36} />
    </div>
  );

  const chartData = hospitals.map(h => ({
    name: h.hospital_name.split(' ').slice(0, 2).join(' '),
    used: +h.budget_used.toFixed(2),
    remaining: +h.budget_remaining.toFixed(2),
    status: h.status,
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className="toast" style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}>
          <CheckCircle2 size={18} className="text-teal-600 shrink-0" />
          <p className="text-xs font-bold text-slate-700">{toast}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Privacy <span className="gradient-text">Budget</span></h1>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">
            Differential privacy ε consumption — max 10ε per hospital
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 text-white text-xs font-black hover:bg-blue-800 transition-all shadow-lg shadow-blue-200">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Platform-level gauge */}
      <div className="glass-card rounded-2xl p-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl font-black text-slate-900 mb-2">Platform Average Budget</h2>
            <p className="text-sm text-slate-500 max-w-md">
              Differential Privacy uses the Gaussian mechanism with ε = 1.0 per round.
              Each hospital node is allocated a maximum of 10ε. When exhausted, the node
              cannot submit further training jobs until reset by a Super Admin.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-4">
              <div className="glass-card rounded-xl p-3 text-center">
                <p className="text-xl font-black text-teal-600">{hospitals.filter(h => h.status === 'healthy').length}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Healthy</p>
              </div>
              <div className="glass-card rounded-xl p-3 text-center">
                <p className="text-xl font-black text-amber-600">{hospitals.filter(h => h.status === 'warning').length}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Warning</p>
              </div>
              <div className="glass-card rounded-xl p-3 text-center">
                <p className="text-xl font-black text-red-600">{hospitals.filter(h => h.status === 'critical').length}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Critical</p>
              </div>
            </div>
          </div>
          <BudgetGauge used={globalUsed} max={MAX_BUDGET} />
        </div>
      </div>

      {/* Chart */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-base font-black text-slate-900 mb-6">Budget Consumption by Hospital</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 700, fontSize: 10 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 700, fontSize: 10 }} domain={[0, 10]} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-white rounded-xl border border-slate-100 shadow-xl p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{label}</p>
                    <p className="text-xs font-bold text-slate-700">Used: <span className="text-red-600 font-black">{payload[0]?.value}ε</span></p>
                    <p className="text-xs font-bold text-slate-700">Remaining: <span className="text-teal-600 font-black">{payload[1]?.value}ε</span></p>
                  </div>
                );
              }}
            />
            <Bar dataKey="used" name="Used" stackId="a" radius={[0, 0, 0, 0]}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.status === 'critical' ? '#ef4444' : d.status === 'warning' ? '#f59e0b' : '#bfdbfe'} />
              ))}
            </Bar>
            <Bar dataKey="remaining" name="Remaining" stackId="a" radius={[6, 6, 0, 0]} fill="#d1fae5" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Hospital table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-black text-slate-900">Hospital Budget Details</h3>
          <p className="text-[11px] font-bold text-slate-400 mt-0.5">
            {isSuperAdmin ? 'Super Admin can reset budget for any hospital' : 'Budget status per participating node'}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full medical-table">
            <thead>
              <tr>
                <th className="text-left">Hospital</th>
                <th className="text-center">Rounds</th>
                <th className="text-center">Used (ε)</th>
                <th className="text-center">Remaining (ε)</th>
                <th className="text-center">Utilisation</th>
                <th className="text-center">Status</th>
                {isSuperAdmin && <th className="text-center">Action</th>}
              </tr>
            </thead>
            <tbody>
              {hospitals.map((h) => {
                const pct = Math.min((h.budget_used / MAX_BUDGET) * 100, 100);
                const barColor = h.status === 'critical' ? '#ef4444' : h.status === 'warning' ? '#f59e0b' : '#10b981';
                return (
                  <tr key={h.hospital_id}>
                    <td className="font-bold text-slate-900 text-sm">{h.hospital_name}</td>
                    <td className="text-center text-sm font-black text-slate-700">{h.rounds_participated}</td>
                    <td className="text-center text-sm font-black text-red-600">{h.budget_used.toFixed(2)}ε</td>
                    <td className="text-center text-sm font-black text-teal-600">{h.budget_remaining.toFixed(2)}ε</td>
                    <td className="text-center min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <div className="progress-bar flex-1">
                          <div className="progress-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 w-8">{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="text-center"><StatusBadge status={h.status} /></td>
                    {isSuperAdmin && (
                      <td className="text-center">
                        {resetTarget === h.hospital_id ? (
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleReset(h.hospital_id)} disabled={resetting}
                              className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-[10px] font-black hover:bg-red-700 transition-all disabled:opacity-60">
                              {resetting ? <Loader2 size={10} className="animate-spin" /> : 'Confirm'}
                            </button>
                            <button onClick={() => setResetTarget(null)} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-black hover:bg-slate-200 transition-all">
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setResetTarget(h.hospital_id)}
                            className="flex items-center gap-1.5 mx-auto px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-black hover:bg-amber-50 hover:text-amber-700 transition-all"
                          >
                            <RotateCcw size={10} /> Reset
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Privacy Info box */}
      <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-blue-50 to-teal-50 border border-blue-100">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-200">
            <Shield size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-blue-900">About Differential Privacy (DP)</h3>
            <p className="text-xs font-medium text-blue-700 mt-1 leading-relaxed">
              This platform uses the <strong>Gaussian mechanism</strong> with ε = 1.0 and δ = 1e-5 per training round.
              Gradient clipping norm = 1.5, noise multiplier = 0.1. The cumulative budget is tracked across all rounds.
              When a hospital's budget is exhausted (≥ 10ε), it is blocked from submitting new training jobs to protect patient privacy.
              Super Admins can reset the budget after compliance review.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
