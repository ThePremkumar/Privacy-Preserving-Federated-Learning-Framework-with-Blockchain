'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  GitBranch,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Shield,
  Cpu,
  Layers,
  RefreshCw,
  Settings,
  Zap,
  ChevronRight,
  History,
  Lock,
  XCircle,
  Loader2,
  Send,
  BarChart3,
  Globe,
  Database,
  TrendingUp
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

interface TrainingJob {
  id: string;
  hospital_id: string;
  upload_id: string;
  status: string;
  epochs: number;
  accuracy: string | null;
  loss: string | null;
  num_samples: number;
  weights_hash: string | null;
  epsilon_used: string;
  started_at: string;
  completed_at: string | null;
  review_notes: string | null;
  reviewed_by: string | null;
}

interface AggregationRound {
  id: string;
  round_number: number;
  status: string;
  participating_hospitals: string[];
  total_samples: number;
  global_accuracy: string;
  global_loss: string;
  global_weights_hash: string;
  blockchain_tx_hash: string;
  epsilon_total: string;
  created_at: string;
}

export default function ModelGovernancePage() {
  const { user } = useAuth();
  const [pendingJobs, setPendingJobs] = useState<TrainingJob[]>([]);
  const [allJobs, setAllJobs] = useState<TrainingJob[]>([]);
  const [aggregationHistory, setAggregationHistory] = useState<AggregationRound[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [isReviewing, setIsReviewing] = useState<string | null>(null);
  const [isAggregating, setIsAggregating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [pendingRes, allRes, historyRes] = await Promise.all([
        api.get('/training/pending-reviews'),
        api.get('/training/all-jobs'),
        api.get('/training/aggregation-history'),
      ]);
      setPendingJobs(pendingRes.data);
      setAllJobs(allRes.data);
      setAggregationHistory(historyRes.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleReview = async (jobId: string, action: 'approve' | 'reject') => {
    setIsReviewing(jobId);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const notes = action === 'approve' ? 'Approved for global aggregation' : 'Rejected: does not meet quality threshold';
      await api.post(`/training/${jobId}/review`, { action, notes });
      setSuccessMessage(`Training job ${action}d successfully.`);
      fetchData();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.detail || `Failed to ${action} job.`);
    } finally {
      setIsReviewing(null);
    }
  };

  const handleAggregate = async () => {
    if (selectedJobs.length === 0) {
      setErrorMessage('Select at least one approved job to aggregate.');
      return;
    }
    setIsAggregating(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await api.post('/training/aggregate', { job_ids: selectedJobs });
      setSuccessMessage(`Round #${res.data.round_number} aggregated! Accuracy: ${(parseFloat(res.data.global_accuracy) * 100).toFixed(1)}%`);
      setSelectedJobs([]);
      fetchData();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.detail || 'Aggregation failed.');
    } finally {
      setIsAggregating(false);
    }
  };

  const toggleJobSelection = (jobId: string) => {
    setSelectedJobs(prev => prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]);
  };

  const approvedJobs = allJobs.filter(j => j.status === 'approved');
  const rejectedJobs = allJobs.filter(j => j.status === 'rejected');
  const latestRound = aggregationHistory.length > 0 ? aggregationHistory[0] : null;

  const statusColor = (s: string) => {
    switch (s) {
      case 'completed': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'submitted': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-100';
      case 'aggregated': return 'bg-purple-50 text-purple-700 border-purple-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <RoleGuard allowedRoles={['super_admin', 'admin']}>
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">Model <span className="text-blue-600">Governance</span></h1>
          <p className="mt-1 text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
             <GitBranch size={14} className="text-blue-600" /> Review Training Results & Aggregate Global Model
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="h-11 px-6 border-2" onClick={fetchData}>
            <RefreshCw size={16} className="mr-2" /> Refresh
          </Button>
          {user?.role === 'super_admin' && (
            <Button className="h-11 px-6 shadow-xl shadow-blue-200" onClick={handleAggregate} disabled={isAggregating || selectedJobs.length === 0}>
              {isAggregating ? <Loader2 size={16} className="animate-spin mr-2" /> : <Zap size={16} className="mr-2" />}
              Aggregate ({selectedJobs.length})
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-700">
          <AlertTriangle size={18} />
          <p className="text-sm font-bold">{errorMessage}</p>
          <button className="ml-auto" onClick={() => setErrorMessage(null)}><XCircle size={14} /></button>
        </div>
      )}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3 text-emerald-700">
          <CheckCircle2 size={18} />
          <p className="text-sm font-bold">{successMessage}</p>
          <button className="ml-auto" onClick={() => setSuccessMessage(null)}><XCircle size={14} /></button>
        </div>
      )}

      {/* Active Global Model Card */}
      <Card className="border-none shadow-2xl shadow-slate-100 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 text-blue-500/10 opacity-20 transform translate-x-1/4 -translate-y-1/4"><Cpu size={300} /></div>
        <CardContent className="p-8 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="h-16 w-16 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-600/30">
                <Cpu size={32} />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-black italic">Global Healthcare Model</h2>
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-500/30">{latestRound ? 'Active' : 'Initializing'}</span>
                </div>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
                  {latestRound ? `Round ${latestRound.round_number} • ${latestRound.total_samples.toLocaleString()} Samples • ${latestRound.participating_hospitals.length} Nodes` : 'No aggregation rounds yet'}
                </p>
              </div>
            </div>
            {latestRound && (
              <div className="flex gap-8">
                <div className="text-center">
                  <p className="text-3xl font-black text-blue-400 italic">{(parseFloat(latestRound.global_accuracy) * 100).toFixed(1)}%</p>
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Accuracy</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-black text-emerald-400 italic">{parseFloat(latestRound.global_loss).toFixed(4)}</p>
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Loss</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Pending Reviews */}
        <Card className="lg:col-span-7 border-none shadow-2xl shadow-slate-100 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-5 p-6">
            <div>
              <CardTitle className="text-xl font-black">Pending <span className="text-amber-600">Reviews</span></CardTitle>
              <CardDescription className="text-sm font-bold text-slate-400">Hospital training submissions awaiting approval</CardDescription>
            </div>
            <span className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 text-sm font-black">{pendingJobs.length}</span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {pendingJobs.length === 0 ? (
                <div className="p-8 text-center">
                  <Clock size={24} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-bold text-slate-400">No pending reviews</p>
                  <p className="text-[10px] font-bold text-slate-300 mt-1">Hospital training results will appear here for review</p>
                </div>
              ) : (
                pendingJobs.map((job) => (
                  <div key={job.id} className="px-6 py-5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                          <Clock size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">Hospital: {job.hospital_id.substring(0, 8)}...</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{job.epochs} epochs • {job.num_samples.toLocaleString()} samples • ε = {job.epsilon_used}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <div className="flex gap-6">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Accuracy</p>
                          <p className="text-lg font-black text-emerald-600">{job.accuracy ? (parseFloat(job.accuracy) * 100).toFixed(1) + '%' : '—'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Loss</p>
                          <p className="text-lg font-black text-blue-600">{job.loss || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Hash</p>
                          <p className="text-[10px] font-mono text-slate-500">{job.weights_hash?.substring(0, 16)}...</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="h-8 px-4 text-[9px] font-black uppercase bg-emerald-600 hover:bg-emerald-700 shadow-sm" onClick={() => handleReview(job.id, 'approve')} disabled={isReviewing === job.id}>
                          {isReviewing === job.id ? <Loader2 size={12} className="animate-spin" /> : <><CheckCircle2 size={12} className="mr-1" /> Approve</>}
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 px-4 text-[9px] font-black uppercase text-red-500 border-red-200 hover:bg-red-50" onClick={() => handleReview(job.id, 'reject')} disabled={isReviewing === job.id}>
                          <XCircle size={12} className="mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rejected Reviews */}
        <Card className="lg:col-span-5 border-none shadow-2xl shadow-slate-100 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-5 p-6">
            <div>
              <CardTitle className="text-xl font-black">Rejected <span className="text-red-600">Models</span></CardTitle>
              <CardDescription className="text-sm font-bold text-slate-400">Training submissions that did not meet quality criteria</CardDescription>
            </div>
            <span className="h-8 w-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center border border-red-100 text-sm font-black">{rejectedJobs.length}</span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
              {rejectedJobs.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle2 size={24} className="mx-auto text-emerald-300 mb-2" />
                  <p className="text-sm font-bold text-slate-400">No rejected models</p>
                  <p className="text-[10px] font-bold text-slate-300 mt-1">All reviewed training jobs have been approved</p>
                </div>
              ) : (
                rejectedJobs.map((job) => (
                  <div key={job.id} className="px-6 py-5 hover:bg-red-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
                          <XCircle size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">Hospital: {job.hospital_id.substring(0, 8)}...</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{job.epochs} epochs • {job.num_samples.toLocaleString()} samples</p>
                        </div>
                      </div>
                      <span className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border", statusColor(job.status))}>
                        {job.status}
                      </span>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <div className="flex gap-6 mb-2">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Accuracy</p>
                          <p className="text-sm font-black text-red-600">{job.accuracy ? (parseFloat(job.accuracy) * 100).toFixed(1) + '%' : '—'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Loss</p>
                          <p className="text-sm font-black text-slate-600">{job.loss || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">ε Used</p>
                          <p className="text-sm font-black text-slate-600">{job.epsilon_used}</p>
                        </div>
                      </div>
                      {job.review_notes && (
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">Rejection Reason</p>
                          <p className="text-xs font-bold text-slate-600 italic">"{job.review_notes}"</p>
                        </div>
                      )}
                    </div>
                    {job.completed_at && (
                      <p className="text-[9px] font-bold text-slate-300 mt-2 uppercase tracking-widest">Completed: {new Date(job.completed_at).toLocaleDateString()} {new Date(job.completed_at).toLocaleTimeString()}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Right Panel */}
        <div className="lg:col-span-5 space-y-8">
          {/* Approved Jobs (ready for aggregation) - Super Admin only */}
          {user?.role === 'super_admin' && (
            <Card className="border-none shadow-2xl shadow-slate-100">
              <CardHeader className="border-b border-slate-50 pb-5">
                <CardTitle className="text-lg font-black">Ready for <span className="text-emerald-600">Aggregation</span></CardTitle>
                <CardDescription className="text-xs font-bold text-slate-400">Select approved jobs to merge into global model</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                  {approvedJobs.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-sm font-bold text-slate-400">No approved jobs ready for aggregation.</p>
                    </div>
                  ) : (
                    approvedJobs.map((job) => (
                      <div key={job.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => toggleJobSelection(job.id)}>
                        <div className="flex items-center gap-3">
                          <div className={cn("h-5 w-5 rounded border-2 flex items-center justify-center transition-all", selectedJobs.includes(job.id) ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300")}>
                            {selectedJobs.includes(job.id) && <CheckCircle2 size={12} />}
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900">{job.hospital_id.substring(0, 8)}... • {job.num_samples.toLocaleString()} samples</p>
                            <p className="text-[10px] font-bold text-emerald-600">Acc: {job.accuracy ? (parseFloat(job.accuracy) * 100).toFixed(1) + '%' : '—'}</p>
                          </div>
                        </div>
                        <span className="text-[8px] font-mono text-slate-400">{job.weights_hash?.substring(0, 12)}...</span>
                      </div>
                    ))
                  )}
                </div>
                {approvedJobs.length > 0 && (
                  <div className="p-4 border-t border-slate-50">
                    <Button className="w-full shadow-lg shadow-blue-200" onClick={handleAggregate} disabled={isAggregating || selectedJobs.length === 0}>
                      {isAggregating ? <Loader2 size={14} className="animate-spin mr-2" /> : <Zap size={14} className="mr-2" />}
                      Aggregate {selectedJobs.length} Job{selectedJobs.length !== 1 ? 's' : ''} into Global Model
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Aggregation History */}
          <Card className="border-none shadow-2xl shadow-slate-100">
            <CardHeader className="border-b border-slate-50 pb-5">
              <CardTitle className="text-lg font-black">Aggregation <span className="text-blue-600">History</span></CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {aggregationHistory.length === 0 ? (
                  <div className="p-6 text-center">
                    <Globe size={20} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-400">No aggregation rounds yet.</p>
                  </div>
                ) : (
                  aggregationHistory.map((round) => (
                    <div key={round.id} className="px-5 py-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black">R{round.round_number}</div>
                          <div>
                            <p className="text-xs font-black text-slate-900">Round #{round.round_number}</p>
                            <p className="text-[10px] font-bold text-slate-400">{new Date(round.created_at).toLocaleDateString()} • {round.participating_hospitals.length} nodes</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-[8px] font-black uppercase tracking-widest border border-purple-100">completed</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase">Accuracy</p>
                          <p className="text-sm font-black text-emerald-600">{(parseFloat(round.global_accuracy) * 100).toFixed(1)}%</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase">Loss</p>
                          <p className="text-sm font-black text-blue-600">{parseFloat(round.global_loss).toFixed(4)}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase">Samples</p>
                          <p className="text-sm font-black text-slate-700">{round.total_samples.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-1">
                        <Database size={10} className="text-slate-400" />
                        <span className="text-[9px] font-mono text-slate-400">tx: {round.blockchain_tx_hash.substring(0, 24)}...</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Global Training Policy */}
          <Card className="border-none shadow-2xl shadow-slate-100">
            <CardHeader className="border-b border-slate-50 pb-5">
              <CardTitle className="text-lg font-black">Global <span className="text-blue-600">Training Policy</span></CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {[
                { label: 'Aggregation Strategy', value: 'FedAvg (Weighted)', icon: Layers },
                { label: 'Privacy Budget ε', value: '1.0 per round', icon: Shield },
                { label: 'Min Approval', value: 'Admin review required', icon: CheckCircle2 },
                { label: 'Auto-Rollback', value: 'Enabled (< 85% acc)', icon: RotateCcw },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 group hover:border-blue-100 transition-all">
                  <div className="flex items-center gap-3">
                    <item.icon size={14} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                    <span className="text-xs font-bold text-slate-600">{item.label}</span>
                  </div>
                  <span className="text-xs font-black text-slate-900">{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </RoleGuard>
  );
}
