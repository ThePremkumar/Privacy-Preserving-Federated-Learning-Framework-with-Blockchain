'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Shield,
  Cpu,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  ExternalLink,
  Copy,
  History,
  FileText,
  BarChart3,
  TrendingUp,
  Database,
  Lock,
  User,
  Zap,
  Info,
  Layers,
  Search,
  Loader2,
  RefreshCw,
  Edit3,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { RoleGuard } from '@/components/guards/RoleGuard';
import api from '@/lib/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ContributingJob {
  id: string;
  accuracy: string;
  loss: string;
  num_samples: number;
  hospital_id: string;
  hospital_name: string;
}

interface RoundDetail {
  id: string;
  round_number: number;
  global_model_version: number;
  global_accuracy: string;
  global_loss: string;
  total_samples: number;
  contributing_jobs: ContributingJob[];
  contributing_nodes: string[];
  node_weights: Record<string, number>;
  blockchain_tx_hash: string;
  blockchain_status: string;
  aggregated_by_username: string;
  started_at: string;
  completed_at: string;
  duration_seconds: number;
  privacy_epsilon: number;
  notes: string | null;
  accuracy_regression: {
    type: 'regression' | 'improvement';
    delta: number;
    previous_round: number;
  } | null;
}

export default function AggregationRoundDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roundId = params.roundId as string;
  
  const [round, setRound] = useState<RoundDetail | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingNotes, setIsUpdatingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotesEditor, setShowNotesEditor] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [detailRes, historyRes] = await Promise.all([
        api.get(`/training/aggregation-rounds/${roundId}`),
        api.get('/training/aggregation-history')
      ]);
      setRound(detailRes.data);
      setNotes(detailRes.data.notes || '');
      // Reverse history for trend chart (needs chronological order)
      setHistory([...historyRes.data].reverse());
    } catch (err) {
      console.error('Failed to fetch round detail:', err);
    } finally {
      setIsLoading(false);
    }
  }, [roundId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateNotes = async () => {
    setIsUpdatingNotes(true);
    try {
      await api.post(`/training/aggregation-rounds/${roundId}/notes`, { notes });
      setShowNotesEditor(false);
      setRound(prev => prev ? { ...prev, notes } : null);
    } catch (err) {
      console.error('Failed to update notes:', err);
    } finally {
      setIsUpdatingNotes(false);
    }
  };

  const handleDownloadModel = async () => {
    try {
      const res = await api.get(`/training/global-model/download?version=${round?.global_model_version}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `global_model_v${round?.global_model_version}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="text-blue-600 animate-spin" />
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest italic">Loading Governance Data...</p>
        </div>
      </div>
    );
  }

  if (!round) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <AlertTriangle size={48} className="text-amber-500" />
        <h2 className="text-xl font-black italic">Round Not Found</h2>
        <Button onClick={() => router.push('/dashboard/model-governance')}>Back to Governance</Button>
      </div>
    );
  }

  // Chart data for weight distribution
  const weightData = round.contributing_jobs.map(job => ({
    name: job.hospital_name || job.hospital_id.substring(0, 8),
    weight: (round.node_weights[job.hospital_id] || 0) * 100,
    samples: job.num_samples
  })).sort((a, b) => b.weight - a.weight);

  // Trend data for accuracy/loss
  const trendData = history.map(h => ({
    round: `R${h.round_number}`,
    accuracy: parseFloat(h.global_accuracy) * 100,
    loss: parseFloat(h.global_loss)
  }));

  return (
    <RoleGuard allowedRoles={['super_admin', 'admin']}>
      <div className="space-y-8 pb-12">
        {/* Breadcrumbs & Header */}
        <div className="flex flex-col gap-6">
          <button 
            onClick={() => router.push('/dashboard/model-governance')}
            className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors group w-fit"
          >
            <div className="h-6 w-6 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
              <ChevronLeft size={14} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest italic">Back to Model Governance</span>
          </button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-4xl font-black italic tracking-tighter text-slate-900">
                  Global Model <span className="text-blue-600">— Round #{round.round_number}</span>
                </h1>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5 shadow-sm">
                    <CheckCircle2 size={12} /> Completed
                  </span>
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100 flex items-center gap-1.5 shadow-sm">
                    <Database size={12} /> On-chain verified
                  </span>
                  <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-800 flex items-center gap-1.5 shadow-sm">
                    v{round.global_model_version}
                  </span>
                </div>
              </div>
              <p className="text-sm font-bold text-slate-400 flex items-center gap-2 italic">
                Aggregated by: <span className="text-slate-700 font-black tracking-tight underline decoration-blue-500/30 underline-offset-4">{round.aggregated_by_username}</span> 
                <span className="h-1 w-1 bg-slate-300 rounded-full"></span> 
                {new Date(round.completed_at).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="h-11 px-6 border-2 font-black italic uppercase text-[10px] tracking-widest"
                onClick={handleDownloadModel}
              >
                <Download size={16} className="mr-2" /> Download weights
              </Button>
              <Button 
                className="h-11 px-6 shadow-xl shadow-blue-200 font-black italic uppercase text-[10px] tracking-widest"
                onClick={() => setShowNotesEditor(true)}
              >
                <Edit3 size={16} className="mr-2" /> Add Notes
              </Button>
            </div>
          </div>
        </div>

        {/* Regression / Improvement Banner */}
        {round.accuracy_regression && (
          <div className={cn(
            "p-5 rounded-2xl border-2 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500 shadow-lg",
            round.accuracy_regression.type === 'regression' 
              ? "bg-amber-50 border-amber-200 text-amber-900 shadow-amber-100" 
              : "bg-emerald-50 border-emerald-200 text-emerald-900 shadow-emerald-100"
          )}>
            <div className={cn(
              "h-12 w-12 rounded-xl flex items-center justify-center border",
              round.accuracy_regression.type === 'regression' 
                ? "bg-amber-100 border-amber-300 text-amber-600" 
                : "bg-emerald-100 border-emerald-300 text-emerald-600"
            )}>
              {round.accuracy_regression.type === 'regression' ? <AlertTriangle size={24} /> : <TrendingUp size={24} />}
            </div>
            <div>
              <p className="text-lg font-black italic tracking-tight leading-none mb-1">
                {round.accuracy_regression.type === 'regression' ? 'Performance Regression Detected' : 'Performance Improvement Detected'}
              </p>
              <p className="text-sm font-bold opacity-70 italic tracking-tight">
                Global accuracy {round.accuracy_regression.type === 'regression' ? 'decreased' : 'improved'} by{' '}
                <span className="font-black text-xl mx-0.5">{round.accuracy_regression.delta}%</span>{' '}
                from Round #{round.accuracy_regression.previous_round}. 
                {round.accuracy_regression.type === 'regression' && ' Review contributing jobs for data quality issues.'}
              </p>
            </div>
          </div>
        )}

        {/* Summary Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Global Accuracy', value: (parseFloat(round.global_accuracy) * 100).toFixed(1) + '%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Global Loss', value: parseFloat(round.global_loss).toFixed(4), icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Total Samples', value: round.total_samples.toLocaleString(), icon: Database, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Nodes Merged', value: round.contributing_nodes.length.toString(), icon: Layers, color: 'text-orange-600', bg: 'bg-orange-50' },
          ].map((stat, i) => (
            <Card key={i} className="border-none shadow-xl shadow-slate-100 overflow-hidden relative group">
              <div className={cn("absolute bottom-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform", stat.color)}><stat.icon size={80} /></div>
              <CardContent className="p-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <stat.icon size={12} className={stat.color} /> {stat.label}
                </p>
                <p className={cn("text-3xl font-black italic tracking-tighter", stat.color)}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Section 1 — Contributing Jobs */}
          <Card className="lg:col-span-8 border-none shadow-2xl shadow-slate-100 overflow-hidden">
            <CardHeader className="border-b border-slate-50 pb-5 p-6">
              <CardTitle className="text-xl font-black italic uppercase tracking-tighter text-slate-800">
                Contributing <span className="text-blue-600">Jobs</span>
              </CardTitle>
              <CardDescription className="text-xs font-bold text-slate-400">Auditable trace of every model update included in this round</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hospital Node</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Job ID</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Samples</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Accuracy</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Loss</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {round.contributing_jobs.map((job) => {
                      const weight = (round.node_weights[job.hospital_id] || 0) * 100;
                      return (
                        <tr key={job.id} className="hover:bg-slate-50/50 transition-all cursor-pointer group" onClick={() => router.push(`/dashboard/federated`)}>
                          <td className="px-6 py-4">
                            <span className="text-sm font-black text-slate-800 tracking-tight">{job.hospital_name}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[11px] font-mono font-bold text-slate-400 underline decoration-slate-200 underline-offset-4 group-hover:text-blue-500 transition-colors italic">{job.id.substring(0, 12)}...</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-xs font-bold text-slate-600">{job.num_samples.toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-sm font-black text-emerald-600">{(parseFloat(job.accuracy) * 100).toFixed(1)}%</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-[11px] font-mono font-bold text-blue-500">{parseFloat(job.loss).toFixed(4)}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex flex-col items-end">
                              <span className={cn("text-sm font-black italic", weight < 5 ? "text-amber-500" : "text-slate-900")}>
                                {weight.toFixed(1)}%
                              </span>
                              {weight < 5 && <span className="text-[8px] font-black uppercase text-amber-500 tracking-tighter italic">Minor contributor</span>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Section 2 — FedAvg weight distribution */}
          <Card className="lg:col-span-4 border-none shadow-2xl shadow-slate-100 overflow-hidden">
            <CardHeader className="border-b border-slate-50 pb-5 p-6">
              <CardTitle className="text-xl font-black italic uppercase tracking-tighter text-slate-800">
                Weight <span className="text-blue-600">Split</span>
              </CardTitle>
              <CardDescription className="text-xs font-bold text-slate-400">Node contribution to global model weights</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weightData} layout="vertical" margin={{ left: 0, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                      labelStyle={{ fontWeight: 900, fontSize: '12px', marginBottom: '4px' }}
                    />
                    <Bar dataKey="weight" radius={[0, 4, 4, 0]} barSize={24}>
                      {weightData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'][index % 5]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 space-y-3">
                {weightData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'][i % 5] }}></div>
                      <span className="text-[11px] font-black text-slate-700 tracking-tight">{item.name}</span>
                    </div>
                    <span className="text-[11px] font-black italic text-slate-900">{item.weight.toFixed(1)}% ({item.samples.toLocaleString()})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Section 3 — Global Model Performance Trend */}
          <Card className="lg:col-span-8 border-none shadow-2xl shadow-slate-100 overflow-hidden">
            <CardHeader className="border-b border-slate-50 pb-5 p-6">
              <CardTitle className="text-xl font-black italic uppercase tracking-tighter text-slate-800">
                Performance <span className="text-blue-600">Trends</span>
              </CardTitle>
              <CardDescription className="text-xs font-bold text-slate-400">Global model evolution across aggregation rounds</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="round" tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10, fontWeight: 900, fill: '#10b981' }} axisLine={false} tickLine={false} unit="%" />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fontWeight: 900, fill: '#2563eb' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }} />
                    <Area yAxisId="left" type="monotone" dataKey="accuracy" name="Global Accuracy" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAcc)" />
                    <Area yAxisId="right" type="monotone" dataKey="loss" name="Global Loss" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorLoss)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Section 4 — Blockchain Audit */}
          <Card className="lg:col-span-4 border-none shadow-2xl shadow-slate-100 overflow-hidden bg-slate-900 text-white">
            <CardHeader className="border-b border-white/5 pb-5 p-6">
              <CardTitle className="text-xl font-black italic uppercase tracking-tighter text-white">
                Blockchain <span className="text-blue-400">Audit</span>
              </CardTitle>
              <CardDescription className="text-xs font-bold text-white/40 italic">Immutable on-chain verification</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-6">
                <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-3">SHA-256 Global Weight Hash</p>
                <div className="flex gap-2">
                  <div className="text-[10px] font-mono break-all text-blue-300 bg-blue-500/5 p-3 rounded-lg border border-blue-500/20 leading-relaxed italic">
                    {round.blockchain_tx_hash}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" className="flex-1 h-9 text-[9px] font-black uppercase bg-white/5 border-white/10 text-white hover:bg-white/10">
                    <Copy size={12} className="mr-2" /> Copy Hash
                  </Button>
                  <Button variant="outline" className="flex-1 h-9 text-[9px] font-black uppercase bg-white/5 border-white/10 text-white hover:bg-white/10">
                    <ExternalLink size={12} className="mr-2" /> View Tx
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Status', value: round.blockchain_status === 'confirmed' ? '✓ Confirmed on-chain' : 'Pending...', color: 'text-emerald-400' },
                  { label: 'Network', value: 'Ethereum Sepolia (Mock)', color: 'text-white' },
                  { label: 'Block Number', value: '#19,204,512', color: 'text-white' },
                  { label: 'Timestamp', value: round.completed_at ? new Date(round.completed_at).toISOString() : 'Pending...', color: 'text-white/60' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest italic">{item.label}</span>
                    <span className={cn("text-xs font-black tracking-tight", item.color)}>{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex gap-4">
                <Lock size={20} className="text-blue-400 flex-shrink-0" />
                <p className="text-[10px] font-bold text-blue-200 leading-relaxed italic">
                  This global model version is cryptographically linked to the participating hospital updates. Any tampering with global weights will invalidate the on-chain signature.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Section 5 — Privacy & Compliance */}
          <Card className="lg:col-span-5 border-none shadow-2xl shadow-slate-100 overflow-hidden">
            <CardHeader className="border-b border-slate-50 pb-5 p-6">
              <CardTitle className="text-xl font-black italic uppercase tracking-tighter text-slate-800">
                Privacy <span className="text-blue-600">& Compliance</span>
              </CardTitle>
              <CardDescription className="text-xs font-bold text-slate-400 italic">HIPAA-like security verification</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[
                  { label: 'Anonymized Mode', value: 'Passed', icon: Shield, status: 'success' },
                  { label: 'DP Epsilon Budget', value: `ε = ${round.privacy_epsilon.toFixed(1)}`, icon: Lock, status: 'success' },
                  { label: 'Identity Stripping', value: 'Verified', icon: User, status: 'success' },
                  { label: 'Differential Privacy', value: 'Noise Added', icon: Zap, status: 'success' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-sm">
                        <item.icon size={18} />
                      </div>
                      <span className="text-sm font-black text-slate-700 tracking-tight">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-emerald-600 uppercase italic tracking-widest">{item.value}</span>
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 rounded-2xl bg-emerald-50 border-2 border-emerald-100 flex flex-col items-center text-center">
                <div className="h-14 w-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200 mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h4 className="text-lg font-black italic text-emerald-900 tracking-tighter mb-1 uppercase">HIPAA Compliant Round</h4>
                <p className="text-xs font-bold text-emerald-700 italic px-4">
                  This aggregation round follows all platform privacy protocols. No PII has been leaked or processed during the FedAvg cycle.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 6 — Super Admin Notes */}
          <Card className="lg:col-span-7 border-none shadow-2xl shadow-slate-100 overflow-hidden">
            <CardHeader className="border-b border-slate-50 pb-5 p-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black italic uppercase tracking-tighter text-slate-800">
                  Round <span className="text-blue-600">Notes</span>
                </CardTitle>
                <CardDescription className="text-xs font-bold text-slate-400 italic">Governance observations and justification</CardDescription>
              </div>
              {!showNotesEditor && (
                <Button variant="outline" size="sm" className="h-9 px-4 text-[10px] font-black uppercase italic border-2" onClick={() => setShowNotesEditor(true)}>
                  <Edit3 size={14} className="mr-2" /> Edit Notes
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-6">
              {showNotesEditor ? (
                <div className="space-y-4">
                  <textarea 
                    className="w-full h-48 p-6 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:outline-none text-sm font-bold text-slate-700 placeholder:text-slate-300 italic"
                    placeholder="Enter governance notes for this aggregation round..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" className="h-10 px-6 font-black italic uppercase text-[10px] tracking-widest border-2" onClick={() => setShowNotesEditor(false)}>
                      Cancel
                    </Button>
                    <Button 
                      className="h-10 px-6 shadow-xl shadow-blue-200 font-black italic uppercase text-[10px] tracking-widest"
                      onClick={handleUpdateNotes}
                      disabled={isUpdatingNotes}
                    >
                      {isUpdatingNotes ? <Loader2 size={14} className="animate-spin mr-2" /> : <RefreshCw size={14} className="mr-2" />}
                      Save Governance Notes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="min-h-[200px] flex flex-col justify-between">
                  {round.notes ? (
                    <p className="text-base font-bold text-slate-600 italic leading-relaxed border-l-4 border-blue-500 pl-6 py-2">
                      "{round.notes}"
                    </p>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                      <FileText size={48} className="mb-4 opacity-50" />
                      <p className="text-sm font-black uppercase italic tracking-widest">No governance notes added</p>
                    </div>
                  )}
                  
                  <div className="mt-8 flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                      <History size={16} />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 italic">
                      Last edited: {round.completed_at ? new Date(round.completed_at).toLocaleString() : 'N/A'} by Super Admin
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}
