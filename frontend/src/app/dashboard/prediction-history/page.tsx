'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  Search,
  Download,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Clock,
  ChevronRight,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  User,
  Eye,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import api from '@/lib/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function PredictionHistoryPage() {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/predictions/');
      // Filter for AI predictions
      const aiPreds = res.data.filter((p: any) => p.type === 'ai_prediction');
      setPredictions(aiPreds);
    } catch {
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filteredPredictions = predictions.filter(p => {
    const patientName = p.patient_name || p.patient_id || '';
    const matchesSearch = patientName.toLowerCase().includes(searchQuery.toLowerCase()) || p.id?.toLowerCase().includes(searchQuery.toLowerCase());
    const score = p.results?.risk_score || 0;
    const matchesFilter = filterRisk === 'all' ||
      (filterRisk === 'high' && score >= 7) ||
      (filterRisk === 'moderate' && score >= 4 && score < 7) ||
      (filterRisk === 'low' && score < 4);
    return matchesSearch && matchesFilter;
  });

  const getRiskColor = (score: number) => {
    if (score >= 7) return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', bar: 'bg-red-600', label: 'High Risk' };
    if (score >= 4) return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', bar: 'bg-amber-500', label: 'Moderate' };
    return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', bar: 'bg-emerald-500', label: 'Low Risk' };
  };

  return (
    <RoleGuard allowedRoles={['doctor']}>
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">Prediction <span className="text-blue-600">History</span></h1>
          <p className="mt-1 text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
             <History size={14} className="text-blue-600" /> Past Risk Assessments & Clinical Outcomes
          </p>
        </div>
        <Button variant="outline" className="h-11 px-6 border-2" onClick={() => window.print()}>
          <Download size={16} className="mr-2" /> Export History
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        {[
          { label: 'Total Predictions', value: predictions.length, color: 'text-slate-900' },
          { label: 'High Risk Alerts', value: predictions.filter(p => (p.results?.risk_score || 0) >= 7).length, color: 'text-red-600' },
          { label: 'Avg AI Confidence', value: predictions.length ? `${Math.round(predictions.reduce((a, p) => a + (p.results?.confidence || 0), 0) / predictions.length)}%` : '0%', color: 'text-blue-600' },
          { label: 'Patients Tracked', value: new Set(predictions.map(p => p.patient_id)).size, color: 'text-emerald-600' },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-lg shadow-slate-100/50 p-5 bg-white">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
            <p className={cn("text-2xl font-black italic mt-1", stat.color)}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Predictions Table */}
      <Card className="border-none shadow-2xl shadow-slate-100 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-5 p-6">
          <div>
            <CardTitle className="text-xl font-black">Assessment <span className="text-blue-600">Records</span></CardTitle>
            <CardDescription className="text-sm font-bold text-slate-400">All generated risk predictions from federated model</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input className="h-9 w-48 rounded-lg bg-slate-50 pl-8 pr-4 text-[10px] font-bold border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Search records..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <select
              value={filterRisk}
              onChange={e => setFilterRisk(e.target.value)}
              className="h-9 rounded-lg bg-slate-50 px-3 text-[10px] font-black uppercase tracking-widest text-slate-700 border border-slate-100 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All Risks</option>
              <option value="high">High Risk</option>
              <option value="moderate">Moderate</option>
              <option value="low">Low Risk</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-50">
            {isLoading ? (
              <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>
            ) : filteredPredictions.length === 0 ? (
              <div className="p-20 text-center text-slate-400 font-bold">No history available yet.</div>
            ) : (
              filteredPredictions.map(pred => {
                const score = pred.results?.risk_score || 0;
                const colors = getRiskColor(score);
                return (
                  <div key={pred.id || pred._id} className="flex items-center justify-between px-6 py-5 hover:bg-slate-50/50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center font-black text-sm border", colors.bg, colors.text, colors.border)}>
                        {score.toFixed(1)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{pred.patient_name || 'Anonymous'}</p>
                          {score > 7.5 && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold text-slate-400">{pred._id?.slice(-8)}</span>
                          <span className="h-1 w-1 rounded-full bg-slate-300" />
                          <span className="text-[10px] font-bold text-blue-600 capitalize">{pred.results?.prediction || 'AI Diagnosis'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3">
                        <div className="w-20">
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full", colors.bar)} style={{ width: `${score * 10}%` }} />
                          </div>
                        </div>
                        <span className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border", colors.bg, colors.text, colors.border)}>
                          {colors.label}
                        </span>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <p className="text-xs font-black text-slate-900">{pred.results?.confidence}%</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Confidence</p>
                      </div>
                      <div className="text-right min-w-[120px]">
                        <p className="text-[10px] font-bold text-slate-400">{new Date(pred.timestamp || Date.now()).toLocaleString()}</p>
                        <span className="text-[8px] font-black text-emerald-600 uppercase italic tracking-widest">Federated Model v1.0</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="p-6 border-t border-slate-50">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {isLoading ? 'Fetching records...' : `Showing ${filteredPredictions.length} of ${predictions.length} records`}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
    </RoleGuard>
  );
}
