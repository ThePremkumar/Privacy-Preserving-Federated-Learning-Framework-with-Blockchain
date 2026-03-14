'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Calendar,
  Layers,
  Zap,
  AlertTriangle,
  FileSearch,
  Plus,
  ArrowRight,
  TrendingDown,
  Users,
  Upload,
  Send,
  CheckCircle2,
  Loader2,
  Cpu,
  Heart,
  BarChart3,
  Stethoscope
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
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import api from '@/lib/api';
import Link from 'next/link';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AnalyticsData {
  total_users: number;
  total_hospitals: number;
  total_uploads: number;
  total_training_jobs: number;
  total_aggregation_rounds: number;
  total_records: number;
  users_by_role: Record<string, number>;
  training_by_status: Record<string, number>;
  latest_global_accuracy: string | null;
  latest_global_loss: string | null;
  latest_round: number;
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

interface TrainingJob {
  id: string;
  status: string;
  accuracy: string | null;
  loss: string | null;
  num_samples: number;
  completed_at: string | null;
}

const ROLE_COLORS: Record<string, string> = {
  super_admin: '#6366f1',
  admin: '#f59e0b',
  hospital: '#10b981',
  doctor: '#3b82f6',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [modelHealth, setModelHealth] = useState<ModelHealthData | null>(null);
  const [myJobs, setMyJobs] = useState<TrainingJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin';
  const isHospital = user?.role === 'hospital';
  const isDoctor = user?.role === 'doctor';

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isSuperAdmin || isAdmin) {
        const [analyticsRes, healthRes] = await Promise.all([
          api.get('/admin/analytics/overview').catch(() => ({ data: null })),
          api.get('/admin/model-health').catch(() => ({ data: null })),
        ]);
        setAnalytics(analyticsRes.data);
        setModelHealth(healthRes.data);
      } else if (isHospital) {
        const jobsRes = await api.get('/training/my-jobs').catch(() => ({ data: [] }));
        setMyJobs(jobsRes.data);
      }
    } catch { /* ignore */ }
    setIsLoading(false);
  }, [isSuperAdmin, isAdmin, isHospital]);

  useEffect(() => { if (user) fetchData(); }, [user, fetchData]);

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-blue-600 mx-auto" />
          <p className="text-sm font-bold text-slate-400 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Super Admin / Admin Dashboard
  if (isSuperAdmin || isAdmin) {
    return <AdminDashboard analytics={analytics} modelHealth={modelHealth} isSuperAdmin={isSuperAdmin} />;
  }

  // Hospital Dashboard
  if (isHospital) {
    return <HospitalDashboard jobs={myJobs} />;
  }

  // Doctor Dashboard
  return <DoctorDashboard />;
}

// ═══════════════════════════════════════════
// ADMIN / SUPER ADMIN DASHBOARD
// ═══════════════════════════════════════════
function AdminDashboard({ analytics, modelHealth, isSuperAdmin }: {
  analytics: AnalyticsData | null;
  modelHealth: ModelHealthData | null;
  isSuperAdmin: boolean;
}) {
  const a = analytics || {
    total_users: 0, total_hospitals: 0, total_uploads: 0,
    total_training_jobs: 0, total_aggregation_rounds: 0, total_records: 0,
    users_by_role: {}, training_by_status: {},
    latest_global_accuracy: null, latest_global_loss: null, latest_round: 0,
  };

  const mh = modelHealth || {
    accuracy_history: [], hospital_performance: [],
    total_rounds: 0, total_training_jobs: 0,
    current_accuracy: 0, current_loss: 0, privacy_budget_used: 0,
  };

  const globalAcc = a.latest_global_accuracy ? (parseFloat(a.latest_global_accuracy) * 100).toFixed(1) : '0';
  const globalLoss = a.latest_global_loss ? parseFloat(a.latest_global_loss).toFixed(4) : '—';
  const privacyPercent = Math.min((mh.privacy_budget_used / 10.0) * 100, 100);

  const roleChartData = Object.entries(a.users_by_role)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: name.replace('_', ' '), value, color: ROLE_COLORS[name] || '#94a3b8' }));

  const statusChartData = Object.entries(a.training_by_status)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-[1.1]">
            {isSuperAdmin ? 'System ' : 'Administrative '}
            <span className="text-blue-600 underline decoration-blue-100 underline-offset-8">Intelligence.</span>
          </h1>
          <p className="mt-3 text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Calendar size={16} className="text-blue-600" /> {isSuperAdmin ? 'Super Admin' : 'Admin'} Portal
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/model-governance">
            <Button className="h-12 px-8 shadow-xl shadow-blue-200">Global Training <Zap size={18} className="ml-2" /></Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Global Model Accuracy" value={`${globalAcc}%`} icon={BrainCircuit} trend={a.latest_round > 0 ? `Round ${a.latest_round}` : 'No rounds'} color="blue" />
        <StatCard label="Participating Nodes" value={a.total_hospitals.toString()} icon={Hospital} trend={`${a.total_users} users`} color="emerald" />
        <StatCard label="Aggregation Rounds" value={a.total_aggregation_rounds.toString()} icon={Layers} trend={`${a.total_training_jobs} jobs`} color="purple" />
        <StatCard label="Privacy Budget" value={`${mh.privacy_budget_used.toFixed(1)}ε`} icon={ShieldCheck} trend={`${privacyPercent.toFixed(0)}% used`} color={privacyPercent > 80 ? 'red' : 'emerald'} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Convergence Chart */}
        <Card className="lg:col-span-8 border-none shadow-2xl shadow-slate-100 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 text-blue-100 opacity-20"><TrendingUp size={160} /></div>
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-6 relative">
            <div>
              <CardTitle className="text-2xl font-black">Performance <span className="text-blue-600">Analytics</span></CardTitle>
              <CardDescription className="text-base font-bold text-slate-400">Federated model convergence trends</CardDescription>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">Accuracy</span>
              <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100">Loss</span>
            </div>
          </CardHeader>
          <CardContent className="h-[350px] w-full pt-8 -ml-8 relative">
            {mh.accuracy_history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mh.accuracy_history}>
                  <defs>
                    <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="round" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 700, fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 700, fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 50px -12px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="accuracy" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorAcc)" name="Accuracy (%)" />
                  <Line type="monotone" dataKey="loss" stroke="#ef4444" strokeWidth={3} strokeDasharray="8 4" dot={{ r: 5, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} name="Loss" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp size={48} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-sm font-bold text-slate-400">No aggregation data yet</p>
                  <p className="text-[10px] font-bold text-slate-300 mt-1">Charts populate after hospitals train and admin aggregates</p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-slate-50/50 p-6 flex justify-between">
            <div className="flex gap-8">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Converged Accuracy</span>
                <span className="text-xl font-black italic text-blue-600">{globalAcc}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Model Loss</span>
                <span className="text-xl font-black italic">{globalLoss}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Records</span>
                <span className="text-xl font-black italic">{a.total_records.toLocaleString()}</span>
              </div>
            </div>
            <Link href="/dashboard/reports">
              <Button size="sm" variant="outline" className="h-10 border-2 font-black uppercase tracking-widest text-[9px]">Full Report <ArrowRight size={14} className="ml-1" /></Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Platform Summary */}
          <Card className="border-none shadow-2xl shadow-slate-100">
            <CardHeader className="border-b border-slate-50 pb-4">
              <CardTitle className="text-lg font-black">Platform <span className="text-blue-600">Overview</span></CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {[
                  { label: 'Total Users', value: a.total_users, icon: Users, color: 'blue' },
                  { label: 'Hospitals', value: a.total_hospitals, icon: Hospital, color: 'emerald' },
                  { label: 'Data Uploads', value: a.total_uploads, icon: Upload, color: 'amber' },
                  { label: 'Training Jobs', value: a.total_training_jobs, icon: Cpu, color: 'purple' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center border",
                        item.color === 'blue' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        item.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        item.color === 'amber' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-purple-50 text-purple-600 border-purple-100'
                      )}>
                        <item.icon size={16} />
                      </div>
                      <span className="text-xs font-bold text-slate-600">{item.label}</span>
                    </div>
                    <span className="text-lg font-black text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Node Protection Card */}
          <Card className="border-none shadow-2xl shadow-slate-100 bg-slate-900 text-white p-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="h-12 w-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-600/30">
                <ShieldCheck size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black italic">Blockchain Verified</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">Differential Privacy Active</span>
              </div>
            </div>
            <p className="text-xs font-medium text-white/60 leading-relaxed mb-5">
              All training rounds are privacy-protected with ε = 1.0 noise injection and verified on the blockchain audit trail.
            </p>
            <div className="flex items-center justify-between pt-5 border-t border-white/10">
              <div className="flex flex-col">
                <span className="text-sm font-black text-emerald-400 italic">OPERATIONAL</span>
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{a.total_aggregation_rounds} rounds verified</span>
              </div>
              <Link href="/dashboard/blockchain">
                <Button size="icon" variant="ghost" className="text-white/40 hover:text-white"><ArrowUpRight size={20} /></Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickAction href="/dashboard/admin-management" icon={Users} title="User Management" desc="Add, edit, or remove users" color="blue" />
        <QuickAction href="/dashboard/model-governance" icon={BrainCircuit} title="Model Governance" desc="Review & aggregate training" color="purple" />
        <QuickAction href="/dashboard/blockchain" icon={ShieldCheck} title="Blockchain Audit" desc="Verify integrity trail" color="emerald" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// HOSPITAL DASHBOARD
// ═══════════════════════════════════════════
function HospitalDashboard({ jobs }: { jobs: TrainingJob[] }) {
  const completedJobs = jobs.filter(j => j.accuracy);
  const latestJob = completedJobs[0];
  const latestAcc = latestJob?.accuracy ? (parseFloat(latestJob.accuracy) * 100).toFixed(1) : '—';
  const totalSamples = jobs.reduce((sum, j) => sum + (j.num_samples || 0), 0);
  const submittedCount = jobs.filter(j => j.status === 'submitted' || j.status === 'approved' || j.status === 'aggregated').length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-[1.1]">
            Facility <span className="text-blue-600 underline decoration-blue-100 underline-offset-8">Intelligence.</span>
          </h1>
          <p className="mt-3 text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Calendar size={16} className="text-blue-600" /> Hospital Node Portal
          </p>
        </div>
        <Link href="/dashboard/data-upload">
          <Button className="h-12 px-8 shadow-xl shadow-blue-200">Upload Dataset <Layers size={18} className="ml-2" /></Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Local Model Accuracy" value={`${latestAcc}%`} icon={Activity} trend={completedJobs.length > 0 ? `${completedJobs.length} trained` : 'Not trained'} color="blue" />
        <StatCard label="Total Records" value={totalSamples.toLocaleString()} icon={Database} trend={`${jobs.length} jobs`} color="emerald" />
        <StatCard label="Submitted for Review" value={submittedCount.toString()} icon={Send} trend={submittedCount > 0 ? 'Awaiting admin' : 'None'} color="amber" />
        <StatCard label="Privacy Budget" value="ε = 1.0" icon={ShieldCheck} trend="Per round" color="purple" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Training History */}
        <Card className="lg:col-span-8 border-none shadow-2xl shadow-slate-100">
          <CardHeader className="border-b border-slate-50 pb-5">
            <CardTitle className="text-xl font-black">Training <span className="text-blue-600">History</span></CardTitle>
            <CardDescription className="text-sm font-bold text-slate-400">Your local model training runs</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {jobs.length === 0 ? (
                <div className="p-12 text-center">
                  <BrainCircuit size={40} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-sm font-bold text-slate-400">No training jobs yet</p>
                  <p className="text-[10px] font-bold text-slate-300 mt-1">Upload a CSV dataset and start your first training</p>
                </div>
              ) : (
                jobs.map((job) => (
                  <div key={job.id} className="px-6 py-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                        <Cpu size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{job.num_samples.toLocaleString()} samples</p>
                        <p className="text-[10px] font-bold text-slate-400">
                          {job.completed_at ? new Date(job.completed_at).toLocaleString() : 'In progress'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs font-black text-emerald-600">
                          {job.accuracy ? `${(parseFloat(job.accuracy) * 100).toFixed(1)}%` : '—'}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400">
                          Loss: {job.loss || '—'}
                        </p>
                      </div>
                      <span className={cn("px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border",
                        job.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        job.status === 'submitted' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        job.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        job.status === 'aggregated' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                        'bg-slate-50 text-slate-600 border-slate-100'
                      )}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="lg:col-span-4 space-y-6">
          <QuickAction href="/dashboard/data-upload" icon={Upload} title="Upload & Train" desc="Upload CSV and start training" color="blue" />
          <QuickAction href="/dashboard/federated" icon={Globe} title="Model Participation" desc="View global model status" color="purple" />
          <QuickAction href="/dashboard/doctor-management" icon={Stethoscope} title="Doctor Management" desc="Manage doctor users" color="emerald" />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// DOCTOR DASHBOARD
// ═══════════════════════════════════════════// Doctor Dashboard
function DoctorDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getSummary() {
      try {
        const res = await api.get('/doctor/summary');
        setSummary(res.data);
      } catch (err) {
        console.error('Failed to fetch doctor summary', err);
      } finally {
        setIsLoading(false);
      }
    }
    getSummary();
  }, []);

  if (isLoading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  const s = summary || { total_patients: 0, anomaly_count: 0, active_predictions: 0, latest_accuracy: '0.00', recent_activity: [] };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-[1.1]">
            Clinical <span className="text-blue-600 underline decoration-blue-100 underline-offset-8">Intelligence.</span>
          </h1>
          <p className="mt-3 text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Calendar size={16} className="text-blue-600" /> Medical Practitioner Portal
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/patients">
            <Button variant="outline" className="h-12 px-6 border-2 font-black border-slate-200">Patient List</Button>
          </Link>
          <Link href="/dashboard/data-upload">
            <Button className="h-12 px-8 shadow-xl shadow-blue-200">Add Patient Data <Plus size={18} className="ml-2" /></Button>
          </Link>
        </div>
      </div>

      {/* Doctor Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Patients" value={s.total_patients.toString()} icon={Users} trend="Active records" color="blue" />
        <StatCard label="Critical Anomalies" value={s.anomaly_count.toString()} icon={AlertTriangle} trend="Immediate attention" color={s.anomaly_count > 0 ? 'red' : 'emerald'} />
        <StatCard label="AI Predictions" value={s.active_predictions.toString()} icon={BrainCircuit} trend="Recent analyses" color="purple" />
        <StatCard label="Global Model Acc" value={`${(parseFloat(s.latest_accuracy) * 100).toFixed(1)}%`} icon={ShieldCheck} trend="Health record AI" color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Activity */}
        <Card className="lg:col-span-8 border-none shadow-2xl shadow-slate-100">
          <CardHeader className="border-b border-slate-50 pb-5">
            <CardTitle className="text-xl font-black">Recent <span className="text-blue-600">Clinical Activity</span></CardTitle>
            <CardDescription className="text-sm font-bold text-slate-400">Latest AI predictions and clinical notes</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {s.recent_activity.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-bold">
                  <Activity size={40} className="mx-auto text-slate-200 mb-3" />
                  No recent activity found.
                </div>
              ) : (
                s.recent_activity.map((act: any) => (
                  <div key={act.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", act.type === 'nlp_analysis' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600')}>
                        {act.type === 'nlp_analysis' ? <FileSearch size={18} /> : <BrainCircuit size={18} />}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 capitalize">{act.type.replace('_', ' ')}</p>
                        <p className="text-[10px] font-bold text-slate-400">Patient ID: {act.patient_id}</p>
                      </div>
                    </div>
                    <p className="text-[10px] font-black italic text-slate-400 uppercase tracking-tighter">
                      {new Date(act.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50/30 p-4">
             <Link href="/dashboard/predictions" className="w-full">
               <Button variant="ghost" className="w-full font-black text-xs uppercase tracking-widest text-slate-400 hover:text-blue-600">View All Predictions <ArrowRight size={14} className="ml-2" /></Button>
             </Link>
          </CardFooter>
        </Card>

        {/* Quick Actions */}
        <div className="lg:col-span-4 space-y-6">
          <QuickAction href="/dashboard/predictions" icon={Zap} title="Run Prediction" desc="Classify disease from metrics" color="blue" />
          <QuickAction href="/dashboard/anomalies" icon={AlertTriangle} title="Anomaly Detection" desc="View flagged high-risk patients" color="emerald" />
          <QuickAction href="/dashboard/nlp" icon={BrainCircuit} title="NLP Analysis" desc="Analyze medical notes & summaries" color="purple" />
          
          <Card className="border-none shadow-2xl shadow-slate-100 bg-blue-600 text-white p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12"><Stethoscope size={80} /></div>
            <div className="relative z-10">
              <h3 className="font-black italic text-lg leading-tight mb-2">Federated<br/>Contribution</h3>
              <p className="text-[10px] font-medium text-blue-100 mb-4">Your clinical decisions contribute to the global model's accuracy through anonymized local updates.</p>
              <Link href="/dashboard/federated">
                <Button size="sm" className="bg-white text-blue-600 hover:bg-blue-50 font-black text-[10px] h-8 shadow-none border-none">Node Status</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════

const StatCard = ({ label, value, icon: Icon, trend, color = 'blue' }: any) => {
  const colorMap: Record<string, { bg: string; icon: string; shadow: string; badge: string }> = {
    blue:    { bg: 'bg-blue-600',    icon: 'shadow-blue-100',    shadow: 'shadow-blue-50',    badge: 'bg-blue-50 text-blue-600' },
    emerald: { bg: 'bg-emerald-600', icon: 'shadow-emerald-100', shadow: 'shadow-emerald-50', badge: 'bg-emerald-50 text-emerald-600' },
    amber:   { bg: 'bg-amber-600',   icon: 'shadow-amber-100',   shadow: 'shadow-amber-50',   badge: 'bg-amber-50 text-amber-700' },
    purple:  { bg: 'bg-purple-600',  icon: 'shadow-purple-100',  shadow: 'shadow-purple-50',  badge: 'bg-purple-50 text-purple-600' },
    red:     { bg: 'bg-red-600',     icon: 'shadow-red-100',     shadow: 'shadow-red-50',     badge: 'bg-red-50 text-red-600' },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <Card className={cn("group relative overflow-hidden transition-all duration-300 hover:shadow-2xl border-none shadow-xl", c.shadow)}>
      <div className="absolute right-0 top-0 h-32 w-32 -translate-y-12 translate-x-12 rounded-full bg-blue-50/50 transition-transform duration-500 group-hover:scale-150" />
      <CardHeader className="relative flex flex-row items-center gap-4 p-6">
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg", c.bg, c.icon)}>
          <Icon size={24} />
        </div>
        <div>
          <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</dt>
          <dd className="text-2xl font-black tracking-tight text-slate-900 leading-none mt-0.5">{value}</dd>
        </div>
      </CardHeader>
      <CardContent className="mt-0 flex items-center justify-between relative px-6 pb-6">
        <span className={cn("flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest", c.badge)}>
          {trend}
        </span>
        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          <div className="h-1 w-1 rounded-full bg-emerald-500" /> Live
        </div>
      </CardContent>
    </Card>
  );
};

const QuickAction = ({ href, icon: Icon, title, desc, color }: any) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100 group-hover:bg-purple-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-100',
  };
  return (
    <Link href={href}>
      <Card className="border-none shadow-xl shadow-slate-100 hover:shadow-2xl transition-all duration-300 cursor-pointer group">
        <CardContent className="p-6 flex items-center gap-4">
          <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center border transition-colors", colors[color])}>
            <Icon size={22} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black text-slate-900">{title}</p>
            <p className="text-[10px] font-bold text-slate-400">{desc}</p>
          </div>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
        </CardContent>
      </Card>
    </Link>
  );
};
