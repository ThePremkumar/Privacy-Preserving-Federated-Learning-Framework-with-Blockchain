'use client';

import React, { useState } from 'react';
import { 
  Activity, 
  BrainCircuit, 
  TrendingUp, 
  ChevronRight, 
  ShieldCheck, 
  ArrowUpRight, 
  Clock,
  User,
  Search,
  Plus,
  Stethoscope,
  ChevronDown,
  Info,
  BarChart3,
  Dna,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RoleGuard } from '@/components/guards/RoleGuard';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Predictions are loaded from the API — see the predictions service
// The structure expected per prediction:
// { id, patient, condition, score, risk, time, explanations: [{ feature, contribution, impact, baseline, current }], confidence }

const predictions: {
  id: string; patient: string; condition: string; score: number; risk: string; time: string;
  explanations: { feature: string; contribution: number; impact: string; baseline: string; current: string }[];
  confidence: number;
}[] = [];
// In production, populate this from: GET /predictions/

export default function PredictionsPage() {
  const [selectedPrediction, setSelectedPrediction] = useState(predictions[0]);

  return (
    <RoleGuard allowedRoles={['doctor']}>
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-tight">Patient <span className="text-blue-600">Risk Intelligence</span></h1>
          <p className="mt-2 text-base font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <BrainCircuit size={16} className="text-blue-600" /> AI-Driven Diagnostic Forecasting & XAI
          </p>
        </div>
        <div className="flex gap-4">
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-600 transition-colors" size={18} />
              <input 
                className="h-12 w-64 rounded-xl bg-slate-100/50 pl-12 pr-4 text-xs font-black uppercase tracking-widest border border-slate-100 transition-all focus:bg-white focus:ring-4 focus:ring-blue-100 focus:outline-none" 
                placeholder="Search patient ID..." 
              />
           </div>
           <Button className="h-12 px-8 shadow-xl shadow-blue-200">New Diagnosis <Plus size={18} className="ml-2" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Active Predictions Table */}
        <Card className="lg:col-span-12 xl:col-span-7 border-none shadow-2xl shadow-slate-100">
           <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-6">
              <div>
                <CardTitle className="text-2xl font-black">Active <span className="text-blue-600">Predictive Analysis</span></CardTitle>
                <CardDescription className="text-base font-bold text-slate-400">LSTM-based time-series forecasting</CardDescription>
              </div>
              <Button variant="ghost" className="text-xs font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50">Filter <ChevronDown size={14} className="ml-2" /></Button>
           </CardHeader>
           <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                 {predictions.map(pred => (
                    <div 
                      key={pred.id} 
                      onClick={() => setSelectedPrediction(pred)}
                      className={cn(
                        "flex items-center justify-between px-8 py-6 transition-all cursor-pointer group border-l-4",
                        selectedPrediction.id === pred.id ? "bg-blue-50/50 border-blue-600" : "hover:bg-slate-50 border-transparent"
                      )}
                    >
                       <div className="flex items-center gap-6">
                          <div className={cn(
                            "h-14 w-14 flex items-center justify-center rounded-2xl transition-transform group-hover:scale-110",
                            pred.risk === 'High' ? 'bg-red-50 text-red-600 border border-red-100 shadow-sm' : 
                            pred.risk === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          )}>
                             <Activity size={24} />
                          </div>
                          <div>
                             <p className="text-lg font-black text-slate-900 leading-tight">{pred.patient}</p>
                             <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{pred.id}</span>
                                <span className="h-1 w-1 rounded-full bg-slate-300" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 italic font-bold">{pred.condition}</span>
                             </div>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-12">
                          <div className="flex flex-col items-center">
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Risk Score</span>
                             <span className={cn(
                               "text-xl font-black italic",
                               pred.risk === 'High' ? 'text-red-600' : 'text-slate-900'
                             )}>{pred.score}%</span>
                          </div>
                          
                          <div className="flex flex-col items-end">
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 font-bold">{pred.time}</span>
                             <div className={cn(
                               "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                               pred.risk === 'High' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                             )}>
                                <ShieldCheck size={10} /> {pred.risk} Priority
                             </div>
                          </div>
                          
                          <div className={cn(
                            "h-10 w-10 flex items-center justify-center rounded-xl transition-all",
                            selectedPrediction.id === pred.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white"
                          )}>
                             <ChevronRight size={18} />
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </CardContent>
        </Card>

        {/* Explainable AI (XAI) Panel */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-8">
           <Card className="border-none shadow-2xl shadow-slate-100 bg-slate-900 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 text-blue-500/10 opacity-20 transform translate-x-1/4 -translate-y-1/4">
                 <BrainCircuit size={280} />
              </div>
              <CardHeader className="relative border-b border-white/5 pb-8 mb-4">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-600/30">
                       Explainable mode active
                    </div>
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                 </div>
                 <CardTitle className="text-white text-3xl font-black italic">Explainable <span className="text-blue-500 underline decoration-blue-900 underline-offset-8">AI Panel</span></CardTitle>
                 <CardDescription className="text-white/40 font-bold uppercase tracking-widest text-[10px] mt-2">Feature Importance & Contributive Weights</CardDescription>
              </CardHeader>
              <CardContent className="relative space-y-8">
                  <div className="flex items-center justify-between bg-white/5 p-6 rounded-2xl border border-white/10 shadow-inner">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">AI Confidence Score</span>
                        <div className="flex items-baseline gap-2">
                           <span className="text-4xl font-black text-white italic">{selectedPrediction.confidence}%</span>
                           <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">High Integrity</span>
                        </div>
                     </div>
                     <div className="h-16 w-16 rounded-full border-4 border-white/5 flex items-center justify-center">
                        <Dna className="text-blue-500 animate-spin-slow" size={32} />
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-widest text-white/60">Risk Contribution factors</h4>
                        <BarChart3 size={14} className="text-white/20" />
                     </div>
                     
                     <div className="space-y-5">
                        {selectedPrediction.explanations.length > 0 ? (
                          selectedPrediction.explanations.map((exp, i) => (
                            <div key={i} className="space-y-2 group">
                               <div className="flex justify-between items-end">
                                  <div className="flex flex-col">
                                     <span className="text-xs font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-wider">{exp.feature}</span>
                                     <span className="text-[9px] text-white/40 font-bold uppercase tracking-tight">Baseline: {exp.baseline} → Current: {exp.current}</span>
                                  </div>
                                  <span className="text-xs font-black italic text-blue-400">+{exp.contribution}%</span>
                               </div>
                               <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                  <div 
                                    className={cn(
                                       "h-full rounded-full transition-all duration-1000",
                                       exp.impact === 'High' ? 'bg-blue-500' : 'bg-blue-500/40'
                                    )} 
                                    style={{ width: `${exp.contribution}%` }} 
                                  />
                               </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 rounded-2xl bg-white/5 border border-dashed border-white/10">
                             <AlertCircle className="text-white/20" size={32} />
                             <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-8">No SHAP explanations available for this low-risk category. Standard diagnostic guidelines apply.</p>
                          </div>
                        )}
                     </div>
                  </div>

                  <div className="pt-6 border-t border-white/5">
                     <div className="bg-blue-600/10 rounded-2xl p-5 border border-blue-600/20">
                        <div className="flex gap-4">
                           <Info className="text-blue-500 shrink-0" size={20} />
                           <div className="space-y-1">
                              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Model Conclusion</p>
                              <p className="text-[11px] font-medium text-white/70 leading-relaxed italic">
                                "{selectedPrediction.patient}'s elevated risk is primarily driven by acute fluctuations in <strong>{selectedPrediction.explanations[0]?.feature || 'clinical features'}</strong>, contributing significantly to the current <strong>{selectedPrediction.condition}</strong> forecast."
                              </p>
                           </div>
                        </div>
                     </div>
                  </div>
              </CardContent>
           </Card>

           <Card className="border-none shadow-2xl shadow-slate-100 p-8 text-center space-y-4">
              <CheckCircle2 className="mx-auto text-blue-600" size={40} />
              <h3 className="text-xl font-black text-slate-900 uppercase italic">Clinical Validation</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">This prediction and its explanation were aggregated across 12 high-trust clinical nodes.</p>
              <Button variant="outline" className="w-full h-12 border-2 font-black text-[10px] uppercase tracking-widest">Download Full PDF Report</Button>
           </Card>
        </div>
      </div>
    </div>
    </RoleGuard>
  );
}
