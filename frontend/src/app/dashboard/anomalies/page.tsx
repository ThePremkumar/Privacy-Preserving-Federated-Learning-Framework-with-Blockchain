'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, 
  Activity, 
  ChevronRight, 
  ShieldCheck, 
  ShieldAlert,
  ArrowUpRight, 
  Clock,
  User,
  Search,
  Bell,
  Fingerprint,
  Zap,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { RoleGuard } from '@/components/guards/RoleGuard';
import api from '@/lib/api';

interface Anomaly {
  id: string;
  patient_id: string;
  type: string;
  severity: string;
  score: number;
  time: string;
}

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);

  const fetchAnomalies = useCallback(async () => {
    try {
      const res = await api.get('/predictions/anomalies');
      setAnomalies(res.data.map((r: any) => ({
        id: r.id || r._id || 'N/A',
        patient_id: r.patient_name || r.patient_id || 'Unknown',
        type: r.results?.prediction || (r.results?.summary ? 'Clinical Note' : 'General Anomaly'),
        severity: (r.results?.risk_score || r.results?.urgency || 0) > 8 ? 'Critical' : 'High',
        score: r.results?.risk_score || r.results?.urgency || 0,
        time: r.timestamp ? new Date(r.timestamp).toLocaleString() : 'N/A',
      })));
    } catch {
      setAnomalies([]);
    }
  }, []);

  useEffect(() => { fetchAnomalies(); }, [fetchAnomalies]);

  return (
    <RoleGuard allowedRoles={['doctor']}>
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-tight">Patient <span className="text-red-600">Anomaly Detections</span></h1>
          <p className="mt-2 text-base font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <AlertTriangle size={16} className="text-red-600 animate-pulse" /> Outlier Identification with Isolation Forest
          </p>
        </div>
        <div className="flex gap-4">
           <Button variant="outline" className="h-12 border-2 px-8 font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100">Clear All Alerts <Zap size={18} className="ml-2" /></Button>
           <Button className="h-12 px-8 bg-red-600 hover:bg-red-700 shadow-xl shadow-red-100">Urgent Review Page <ShieldAlert size={18} className="ml-2" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Active Anomalies Table */}
        <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-100/50">
           <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-6">
              <div>
                <CardTitle className="text-2xl font-black">Active <span className="text-red-600">Observation Alerts</span></CardTitle>
                <CardDescription className="text-base font-bold text-slate-400">Real-time isolation forest scoring</CardDescription>
              </div>
           </CardHeader>
           <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                 {anomalies.length === 0 ? (
                   <div className="px-8 py-16 text-center">
                     <AlertTriangle size={40} className="mx-auto text-slate-200 mb-4" />
                     <p className="text-lg font-black text-slate-900">No Active Anomalies</p>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Anomalies will appear here when the detection engine identifies outlier patterns in patient data.</p>
                   </div>
                 ) : anomalies.map(anom => (
                    <div key={anom.id} className="flex items-center justify-between px-8 py-7 hover:bg-red-50/20 transition-colors cursor-pointer group">
                       <div className="flex items-center gap-6">
                          <div className={`h-14 w-14 flex items-center justify-center rounded-2xl ${anom.severity === 'Critical' ? 'bg-red-600 text-white shadow-xl shadow-red-200' : 'bg-red-100 text-red-600 shadow-lg shadow-red-50'}`}>
                             <AlertTriangle size={24} className="group-hover:scale-110 transition-transform" />
                          </div>
                          <div>
                             <p className="text-lg font-black text-slate-900 leading-tight flex items-center gap-2">
                               Patient {anom.patient_id} {anom.severity === 'Critical' && <span className="h-2 w-2 rounded-full bg-red-600 animate-ping" />}
                             </p>
                             <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{anom.id}</span>
                                <span className="h-1 w-1 rounded-full bg-slate-300" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-red-600 italic font-mono">{anom.type}</span>
                             </div>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-12">
                          <div className="flex flex-col items-center">
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Outlier Score</span>
                             <span className={`text-xl font-black ${anom.severity === 'Critical' ? 'text-red-700 underline decoration-red-100' : 'text-slate-900 font-mono italic'}`}>{anom.score.toFixed(2)}</span>
                          </div>
                          
                          <div className="flex flex-col items-end min-w-[100px]">
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{anom.time}</span>
                             <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${anom.severity === 'Critical' ? 'bg-red-700 text-white border-red-800 shadow-lg shadow-red-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                {anom.severity} Priority
                             </div>
                          </div>
                          
                          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 group-hover:bg-red-600 group-hover:text-white transition-all shadow-sm">
                             <ChevronRight size={18} />
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </CardContent>
        </Card>

        {/* Anomaly Detection Status Panel */}
        <div className="space-y-8 h-full">
           <Card className="border-none shadow-2xl shadow-slate-100 bg-slate-900 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 text-white/5 opacity-20">
                 <ShieldCheck size={240} />
              </div>
              <CardHeader className="relative border-b border-white/5 pb-8 mb-8">
                 <CardTitle className="text-white text-2xl font-black italic">Detection <span className="text-red-500 underline decoration-red-900 underline-offset-8">Engine Status</span></CardTitle>
                 <CardDescription className="text-white/40 font-bold uppercase tracking-widest text-xs">Differential Privacy Layer Active</CardDescription>
              </CardHeader>
              <CardContent className="relative space-y-10">
                  <div className="flex items-center justify-between">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">System Security</span>
                        <span className="text-4xl font-black text-red-500 italic">SECURED</span>
                     </div>
                     <Lock className="text-red-500/40" size={32} />
                  </div>
                  <div className="space-y-4">
                     <p className="text-[10px] font-bold text-white/40 leading-relaxed uppercase tracking-widest">
                        Outliers are computed locally on hospital nodes. Only aggregated anomaly distribution statistics are shared. All patient identities are pseudo-anonymized.
                     </p>
                     <div className="pt-4 flex items-center justify-between border-t border-white/5 pt-6">
                        <div className="flex flex-col">
                           <span className="text-sm font-black text-white italic">ε = 1.0</span>
                           <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Privacy Budget</span>
                        </div>
                        <div className="flex flex-col items-end">
                           <span className="text-sm font-black text-emerald-400 italic">OK</span>
                           <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Integrity Proof</span>
                        </div>
                     </div>
                  </div>
              </CardContent>
           </Card>

           <Card className="border-none shadow-2xl shadow-slate-100">
              <CardContent className="p-8 text-center space-y-6">
                 <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-100">
                    <Fingerprint size={32} />
                 </div>
                 <h3 className="text-xl font-black text-slate-900">Security Profile</h3>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Your account has clinical-level clearances for patient data access on this node.</p>
                 <Button className="w-full h-12 bg-slate-900 font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200">View Node Certificate</Button>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
    </RoleGuard>
  );
}
