'use client';

import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
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
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const predictions = [
  { id: 'PRD-2401', patient: 'Sam Wilson', age: 58, risk: 92, label: 'High Risk', condition: 'Diabetes + Cardiac', date: '2h ago', modelVersion: 'v2.4.1', confidence: 96, reviewed: true },
  { id: 'PRD-2402', patient: 'Sarah Lee', age: 45, risk: 78, label: 'High Risk', condition: 'Hypertension', date: '4h ago', modelVersion: 'v2.4.1', confidence: 88, reviewed: true },
  { id: 'PRD-2403', patient: 'Michael Brown', age: 62, risk: 45, label: 'Moderate', condition: 'Respiratory', date: '1d ago', modelVersion: 'v2.4.1', confidence: 91, reviewed: false },
  { id: 'PRD-2404', patient: 'Emma Watson', age: 34, risk: 22, label: 'Low Risk', condition: 'Routine Check', date: '1d ago', modelVersion: 'v2.4.1', confidence: 94, reviewed: true },
  { id: 'PRD-2405', patient: 'David Park', age: 71, risk: 88, label: 'High Risk', condition: 'Cardiac + Diabetes', date: '2d ago', modelVersion: 'v2.3.0', confidence: 85, reviewed: true },
  { id: 'PRD-2406', patient: 'Lisa Johnson', age: 52, risk: 55, label: 'Moderate', condition: 'Pre-Diabetic', date: '3d ago', modelVersion: 'v2.3.0', confidence: 82, reviewed: false },
];

export default function PredictionHistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');

  const filteredPredictions = predictions.filter(p => {
    const matchesSearch = p.patient.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterRisk === 'all' ||
      (filterRisk === 'high' && p.risk >= 70) ||
      (filterRisk === 'moderate' && p.risk >= 40 && p.risk < 70) ||
      (filterRisk === 'low' && p.risk < 40);
    return matchesSearch && matchesFilter;
  });

  const riskColor = (risk: number) => {
    if (risk >= 70) return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', bar: 'bg-red-600' };
    if (risk >= 40) return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', bar: 'bg-amber-500' };
    return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', bar: 'bg-emerald-500' };
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
        <Button variant="outline" className="h-11 px-6 border-2">
          <Download size={16} className="mr-2" /> Export History
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        {[
          { label: 'Total Predictions', value: predictions.length, color: 'text-slate-900' },
          { label: 'High Risk', value: predictions.filter(p => p.risk >= 70).length, color: 'text-red-600' },
          { label: 'Avg Confidence', value: `${Math.round(predictions.reduce((a, p) => a + p.confidence, 0) / predictions.length)}%`, color: 'text-blue-600' },
          { label: 'Pending Review', value: predictions.filter(p => !p.reviewed).length, color: 'text-amber-600' },
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
            <CardDescription className="text-sm font-bold text-slate-400">All generated risk predictions</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input className="h-9 w-48 rounded-lg bg-slate-50 pl-8 pr-4 text-[10px] font-bold border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Search patients..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
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
            {filteredPredictions.map(pred => {
              const colors = riskColor(pred.risk);
              return (
                <div key={pred.id} className="flex items-center justify-between px-6 py-5 hover:bg-slate-50/50 transition-colors group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center font-black text-sm border", colors.bg, colors.text, colors.border)}>
                      {pred.risk}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{pred.patient}</p>
                        {!pred.reviewed && <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-slate-400">{pred.id}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-bold text-slate-400">Age {pred.age}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-bold text-blue-600">{pred.condition}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-20">
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", colors.bar)} style={{ width: `${pred.risk}%` }} />
                        </div>
                      </div>
                      <span className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border", colors.bg, colors.text, colors.border)}>
                        {pred.label}
                      </span>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <p className="text-xs font-black text-slate-900">{pred.confidence}%</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{pred.modelVersion}</p>
                    </div>
                    <div className="text-right min-w-[60px]">
                      <p className="text-[10px] font-bold text-slate-400">{pred.date}</p>
                      {pred.reviewed ? (
                        <span className="text-[8px] font-black text-emerald-600 uppercase">Reviewed</span>
                      ) : (
                        <span className="text-[8px] font-black text-amber-600 uppercase">Pending</span>
                      )}
                    </div>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-6 border-t border-slate-50">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Showing {filteredPredictions.length} of {predictions.length} predictions</p>
          </div>
        </CardContent>
      </Card>
    </div>
    </RoleGuard>
  );
}
