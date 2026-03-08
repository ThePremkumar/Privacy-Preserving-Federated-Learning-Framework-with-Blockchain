'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BrainCircuit,
  Activity,
  ShieldCheck,
  Database,
  RefreshCcw,
  Hospital as HospitalIcon,
  Globe,
  Loader2,
  ChevronRight,
  TrendingUp,
  Cpu,
  Layers,
  BarChart3,
  Send,
  CheckCircle2,
  Clock,
  Zap,
  Play,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

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

export default function FederatedTrainingPage() {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([]);
  const [aggregationHistory, setAggregationHistory] = useState<AggregationRound[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  const isHospital = user?.role === 'hospital';

  const fetchData = useCallback(async () => {
    setIsSyncing(true);
    try {
      if (isHospital) {
        const jobsRes = await api.get('/training/my-jobs');
        setTrainingJobs(jobsRes.data);
      } else {
        const jobsRes = await api.get('/training/all-jobs');
        setTrainingJobs(jobsRes.data);
      }
      try {
        const historyRes = await api.get('/training/aggregation-history');
        setAggregationHistory(historyRes.data);
      } catch { /* non-admin may not have access */ }
    } catch { /* ignore */ }
    setIsSyncing(false);
  }, [isHospital]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmitForReview = async (jobId: string) => {
    setIsSubmitting(jobId);
    try {
      await api.post(`/training/${jobId}/submit-for-review`);
      fetchData();
    } catch { /* ignore */ }
    setIsSubmitting(null);
  };

  // Build convergence data from aggregation history
  const convergenceData = aggregationHistory
    .slice()
    .reverse()
    .map(r => ({
      round: `R${r.round_number}`,
      accuracy: parseFloat(r.global_accuracy) * 100,
      loss: parseFloat(r.global_loss),
    }));

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

  const latestRound = aggregationHistory.length > 0 ? aggregationHistory[0] : null;

  return (
    <RoleGuard allowedRoles={['super_admin', 'admin', 'hospital']}>
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-tight">
            {isHospital ? <>Model <span className="text-blue-600">Participation</span></> : <>Federated <span className="text-blue-600">Network Monitor</span></>}
          </h1>
          <p className="mt-2 text-base font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <BrainCircuit size={16} className="text-blue-600" />
             {isHospital ? 'Your Training Jobs & Global Model Status' : 'Multi-Institutional Training Overview'}
          </p>
        </div>
        <Button variant="outline" className="h-12 border-2 px-6" onClick={fetchData}>
           {isSyncing ? <RefreshCcw className="animate-spin mr-2" size={18} /> : <RefreshCcw className="mr-2" size={18} />} Refresh
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <StatCard
          label="Total Jobs"
          value={trainingJobs.length.toString()}
          icon={BarChart3}
          desc="Training jobs"
          color="blue"
        />
        <StatCard
          label="Submitted"
          value={trainingJobs.filter(j => j.status === 'submitted').length.toString()}
          icon={Send}
          desc="Awaiting review"
          color="amber"
        />
        <StatCard
          label="Aggregated"
          value={trainingJobs.filter(j => j.status === 'aggregated').length.toString()}
          icon={Globe}
          desc="In global model"
          color="purple"
        />
        <StatCard
          label="Global Rounds"
          value={aggregationHistory.length.toString()}
          icon={Zap}
          desc={latestRound ? `Latest: ${(parseFloat(latestRound.global_accuracy) * 100).toFixed(1)}%` : 'No rounds yet'}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Convergence Chart */}
        <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-100">
           <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-6">
              <div>
                <CardTitle className="text-2xl font-black">Global <span className="text-blue-600">Convergence</span></CardTitle>
                <CardDescription className="text-base font-bold text-slate-400">Accuracy & Loss across aggregation rounds</CardDescription>
              </div>
              <div className="flex gap-2">
                 <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 italic">Accuracy</div>
                 <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100 italic">Loss</div>
              </div>
           </CardHeader>
           <CardContent className="h-[350px] w-full pt-8 -ml-8">
              {convergenceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={convergenceData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="round" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 700, fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 700, fontSize: 12}} />
                      <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 50px -12px rgb(0 0 0 / 0.1)'}} />
                      <Line type="monotone" dataKey="accuracy" stroke="#2563eb" strokeWidth={5} dot={{r: 6, fill: '#2563eb', strokeWidth: 2, stroke: '#fff'}} />
                      <Line type="monotone" dataKey="loss" stroke="#ef4444" strokeWidth={5} strokeDasharray="10 5" dot={{r: 6, fill: '#ef4444', strokeWidth: 2, stroke: '#fff'}} />
                   </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp size={40} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-sm font-bold text-slate-400">No aggregation data yet</p>
                    <p className="text-[10px] font-bold text-slate-300 mt-1">Charts will populate after the first global aggregation</p>
                  </div>
                </div>
              )}
           </CardContent>
        </Card>

        {/* Training Job Status List */}
        <Card className="border-none shadow-2xl shadow-slate-100">
           <CardHeader className="border-b border-slate-50 pb-6">
              <CardTitle className="text-2xl font-black">{isHospital ? 'My' : 'All'} <span className="text-blue-600">Jobs</span></CardTitle>
              <CardDescription className="text-base font-bold text-slate-400">Training pipeline status</CardDescription>
           </CardHeader>
           <CardContent className="p-0">
               <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-50">
                  {trainingJobs.length === 0 ? (
                    <div className="p-8 text-center">
                      <Cpu size={28} className="mx-auto text-slate-200 mb-3" />
                      <p className="text-sm font-bold text-slate-400">No training jobs yet</p>
                      <p className="text-[10px] font-bold text-slate-300 mt-1">{isHospital ? 'Upload a dataset to start' : 'Hospitals have not started training'}</p>
                    </div>
                  ) : (
                    trainingJobs.map(job => (
                      <div key={job.id} className="px-5 py-4 hover:bg-slate-50 transition-colors">
                         <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                               <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 text-[10px] font-black">{job.epochs}E</div>
                               <div className="flex flex-col">
                                  <span className="text-xs font-black text-slate-900 leading-none">{job.num_samples.toLocaleString()} samples</span>
                                  <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                                    {isHospital ? '' : `Hospital: ${job.hospital_id.substring(0, 8)}... • `}
                                    {job.completed_at ? new Date(job.completed_at).toLocaleDateString() : 'In progress'}
                                  </span>
                               </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${statusColor(job.status)}`}>
                              {job.status}
                            </span>
                         </div>
                         <div className="flex items-center justify-between mt-2">
                           <div className="flex gap-3">
                             <span className="text-[10px] font-bold text-slate-400">Acc: <span className="text-emerald-600 font-black">{job.accuracy ? (parseFloat(job.accuracy) * 100).toFixed(1) + '%' : '—'}</span></span>
                             <span className="text-[10px] font-bold text-slate-400">Loss: <span className="text-blue-600 font-black">{job.loss || '—'}</span></span>
                           </div>
                           {isHospital && job.status === 'completed' && (
                             <Button size="sm" variant="outline" className="h-6 px-2 text-[8px] font-black uppercase" onClick={() => handleSubmitForReview(job.id)} disabled={isSubmitting === job.id}>
                               {isSubmitting === job.id ? <Loader2 size={10} className="animate-spin" /> : <><Send size={10} className="mr-1" /> Submit</>}
                             </Button>
                           )}
                           {job.review_notes && (
                             <span className="text-[9px] font-bold text-slate-400" title={job.review_notes}>📝 Review notes attached</span>
                           )}
                         </div>
                      </div>
                    ))
                  )}
               </div>
               {isHospital && (
                 <div className="p-4 border-t border-slate-50 bg-slate-50/50">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Go to Local Data Upload to start new training</p>
                 </div>
               )}
           </CardContent>
        </Card>
      </div>

      {/* Global Configuration Grid */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
         <ConfigItem label="Privacy Budget" value="ε = 1.0" icon={ShieldCheck} desc="Differential Privacy per round" />
         <ConfigItem label="Aggregation" value="FedAvg" icon={Layers} desc="Weighted averaging strategy" />
         <ConfigItem label="Epochs / Round" value="3" icon={RefreshCcw} desc="Local training passes" />
         <ConfigItem label="Network" value={`${isHospital ? '—' : trainingJobs.length} jobs`} icon={Cpu} desc="Total training submissions" />
      </div>
    </div>
    </RoleGuard>
  );
}

// Stat card component
const StatCard = ({ label, value, icon: Icon, desc, color }: { label: string; value: string; icon: any; desc: string; color: string }) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };
  return (
    <Card className="border-none shadow-xl shadow-slate-100 hover:shadow-2xl transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-lg border ${colorMap[color]}`}><Icon size={20} /></div>
        </div>
        <div className="mt-4">
          <p className="text-3xl font-black text-slate-900">{value}</p>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{label}</h4>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">{desc}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const ConfigItem = ({ label, value, icon: Icon, desc }: any) => (
  <Card className="border-none shadow-xl shadow-slate-100 hover:shadow-2xl transition-all duration-300">
     <CardContent className="p-6">
        <div className="flex items-start justify-between">
           <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <Icon size={20} />
           </div>
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Configured</span>
        </div>
        <div className="mt-6">
           <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</h4>
           <p className="text-xl font-black text-slate-900 leading-tight mt-1">{value}</p>
           <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{desc}</p>
        </div>
     </CardContent>
  </Card>
);
