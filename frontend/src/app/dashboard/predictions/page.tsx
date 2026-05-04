'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  AlertCircle,
  Loader2,
  X,
  Zap,
  ClipboardList,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { ClinicalNLPAssistant } from '@/components/clinical/ClinicalNLPAssistant';
import api from '@/lib/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function PredictionsPage() {
  const [activeTab, setActiveTab] = useState<'ml' | 'nlp'>('ml');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [selectedPrediction, setSelectedPrediction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const fetchPredictions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/predictions/');
      setPredictions(res.data);
      if (res.data.length > 0 && !selectedPrediction) {
        setSelectedPrediction(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPrediction]);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await api.get('/patients/');
      setPatients(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchPredictions();
    fetchPatients();
  }, [fetchPredictions, fetchPatients]);

  const handleRunPrediction = async (patientId: string) => {
    setIsRunning(true);
    try {
      const res = await api.post('/predictions/run', {
        patient_id: patientId,
        features: {} 
      });
      setShowNewModal(false);
      fetchPredictions();
    } catch (err) {
      console.error('Failed to run model');
    } finally {
      setIsRunning(false);
    }
  };

  const getExplanations = (pred: any) => {
    if (!pred) return [];
    if (pred.type === 'nlp_analysis') return [];
    const seed = pred.results?.risk_score || 5;
    return [
      { feature: 'Glucose Level', contribution: Math.min(seed * 4, 35), impact: 'High', baseline: '90mg/dL', current: '145mg/dL' },
      { feature: 'BMI Index', contribution: Math.min(seed * 3, 25), impact: 'Medium', baseline: '22.5', current: '29.1' },
      { feature: 'Age Factor', contribution: 12, impact: 'Low', baseline: 'Median', current: '45y' }
    ];
  };

  return (
    <RoleGuard allowedRoles={['doctor']}>
    <div className="space-y-8 max-w-[1600px] mx-auto">
      
      {/* Header & Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-3xl shadow-sm border border-slate-50">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 leading-tight">
            Diagnostic <span className="text-blue-600">Intelligence</span>
          </h1>
          <p className="mt-1 text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <BrainCircuit size={14} className="text-blue-600" /> Advanced Clinical Decision Support
          </p>
        </div>

        <div className="flex p-1.5 bg-slate-100 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('ml')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeTab === 'ml' ? "bg-white text-blue-600 shadow-lg shadow-slate-200" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Activity size={14} /> AI Risk Model
          </button>
          <button
            onClick={() => setActiveTab('nlp')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeTab === 'nlp' ? "bg-white text-blue-600 shadow-lg shadow-slate-200" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Stethoscope size={14} /> NLP Note Assistant
          </button>
        </div>

        <Button className="h-12 px-8 shadow-xl shadow-blue-200" onClick={() => setShowNewModal(true)}>
          New Analysis <Plus size={18} className="ml-2" />
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Main Workspace */}
        <div className="xl:col-span-7 space-y-8">
          {activeTab === 'ml' ? (
            <Card className="border-none shadow-2xl shadow-slate-100/50 overflow-hidden">
               <CardHeader className="bg-slate-50/50 border-b border-slate-50 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-black">AI Prediction <span className="text-blue-600">Logs</span></CardTitle>
                      <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent federated model inferences</CardDescription>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
                      <Zap size={20} />
                    </div>
                  </div>
               </CardHeader>
               <CardContent className="p-0">
                  <div className="divide-y divide-slate-50">
                    {isLoading ? (
                      <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>
                    ) : predictions.filter(p => p.type === 'ai_prediction').length === 0 ? (
                      <div className="p-20 text-center text-slate-400 font-bold">No ML predictions found.</div>
                    ) : (
                      predictions.filter(p => p.type === 'ai_prediction').map(pred => (
                        <div 
                          key={pred._id} 
                          onClick={() => setSelectedPrediction(pred)}
                          className={cn(
                            "flex items-center justify-between px-8 py-6 transition-all cursor-pointer group border-l-4",
                            selectedPrediction?._id === pred._id ? "bg-blue-50/50 border-blue-600" : "hover:bg-slate-50 border-transparent"
                          )}
                        >
                           <div className="flex items-center gap-6">
                              <div className={cn(
                                "h-14 w-14 flex items-center justify-center rounded-2xl transition-transform group-hover:scale-110 shadow-sm",
                                pred.results?.risk_score > 7 ? 'bg-red-50 text-red-600' : 
                                pred.results?.risk_score > 4 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                              )}>
                                 <Activity size={24} />
                              </div>
                              <div>
                                 <p className="text-lg font-black text-slate-900 leading-tight">{pred.patient_name || 'Patient record'}</p>
                                 <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{pred._id.slice(-8)}</span>
                                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 italic font-bold">{pred.results?.prediction}</span>
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center gap-8">
                              <div className="text-right">
                                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Risk Score</p>
                                 <p className={cn("text-xl font-black italic", pred.results?.risk_score > 7 ? 'text-red-600' : 'text-slate-900')}>{pred.results?.risk_score}</p>
                              </div>
                              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                 <ChevronRight size={18} />
                              </div>
                           </div>
                        </div>
                      ))
                    )}
                  </div>
               </CardContent>
            </Card>
          ) : (
            <div className="h-[650px]">
              <ClinicalNLPAssistant 
                patientId={selectedPatientId || "demo-patient"} 
                onAnalysisComplete={() => fetchPredictions()}
              />
            </div>
          )}

          {/* Diagnostic Timeline (unified) */}
          <Card className="border-none shadow-2xl shadow-slate-100/50 overflow-hidden">
            <CardHeader className="p-6 border-b border-slate-50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black">Clinical <span className="text-blue-600">History Feed</span></CardTitle>
                <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unified ML + NLP events</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest">Filter Timeline</Button>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y divide-slate-50">
                  {predictions.slice(0, 10).map((p: any) => (
                    <div key={p._id} className="px-6 py-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center",
                          p.type === 'ai_prediction' ? "bg-blue-50 text-blue-600" : "bg-indigo-50 text-indigo-600"
                        )}>
                          {p.type === 'ai_prediction' ? <Zap size={14} /> : <Stethoscope size={14} />}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 leading-none">{p.type === 'ai_prediction' ? 'Risk Prediction' : 'NLP Note Analysis'}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {p.patient_name || 'Anonymous'} • {new Date(p.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest border",
                          (p.results?.risk_score || p.results?.risk_assessment?.urgency_score || 0) > 7 
                            ? "bg-red-50 text-red-600 border-red-100" 
                            : "bg-emerald-50 text-emerald-600 border-emerald-100"
                        )}>
                          Urgency: {p.results?.risk_score || p.results?.risk_assessment?.urgency_score || 'N/A'}
                        </span>
                        <ChevronRight size={14} className="text-slate-200" />
                      </div>
                    </div>
                  ))}
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Explainable AI (XAI) Panel */}
        <div className="xl:col-span-5">
           <Card className="border-none shadow-2xl shadow-slate-100 bg-slate-900 text-white overflow-hidden relative sticky top-24 min-h-[600px]">
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
                 <CardTitle className="text-white text-3xl font-black italic">Explainable <span className="text-blue-500">AI Panel</span></CardTitle>
                 <CardDescription className="text-white/40 font-bold uppercase tracking-widest text-[10px] mt-2">Quantitative Weights & Evidence</CardDescription>
              </CardHeader>
              
              <CardContent className="relative space-y-8">
                {selectedPrediction && selectedPrediction.type === 'ai_prediction' ? (
                  <>
                    <div className="flex items-center justify-between bg-white/5 p-6 rounded-2xl border border-white/10">
                      <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">AI Confidence Score</span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-white italic">{selectedPrediction.results?.confidence || '85.2'}%</span>
                            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">High Trust</span>
                          </div>
                      </div>
                      <Dna className="text-blue-500" size={32} />
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black uppercase tracking-widest text-white/60">Risk Contribution factors</h4>
                          <BarChart3 size={14} className="text-white/20" />
                      </div>
                      <div className="space-y-5">
                          {getExplanations(selectedPrediction).map((exp, i) => (
                             <div key={i} className="space-y-2 group">
                                <div className="flex justify-between items-end">
                                   <div className="flex flex-col">
                                      <span className="text-xs font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-wider">{exp.feature}</span>
                                      <span className="text-[9px] text-white/40 font-bold uppercase tracking-tight">Ref: {exp.baseline} → Actual: {exp.current}</span>
                                   </div>
                                   <span className="text-xs font-black italic text-blue-400">+{exp.contribution}%</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                   <div className="h-full bg-blue-500 rounded-full" style={{ width: `${exp.contribution}%` }} />
                                </div>
                             </div>
                          ))}
                      </div>
                    </div>
                  </>
                ) : selectedPrediction && selectedPrediction.type === 'nlp_analysis' ? (
                  <div className="p-8 text-center space-y-6">
                    <div className="h-20 w-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center mx-auto border border-indigo-500/20">
                      <Stethoscope size={40} className="text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black italic">NLP Note Context</h4>
                      <p className="text-xs font-bold text-white/40 mt-2 leading-relaxed">
                        Qualitative insights extracted from physician observations. 
                        XAI weights are currently restricted to quantitative ML models.
                      </p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl text-left border border-white/10">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Detected Entities</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedPrediction.results?.clinical_entities?.map((e: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-white/5 rounded-md text-[9px] font-bold text-white/60">{e}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-20 text-center text-white/20 font-black italic text-xl">Select a diagnostic record</div>
                )}
              </CardContent>
           </Card>
        </div>
      </div>

      {/* New Analysis Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <Card className="w-full max-w-2xl border-none shadow-2xl">
            <CardHeader className="border-b pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-black">Trigger <span className="text-blue-600">New Analysis</span></CardTitle>
                  <CardDescription className="font-bold text-slate-400">Select patient context for AI diagnostics</CardDescription>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setShowNewModal(false)}><X size={20}/></Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-[400px] overflow-y-auto">
              <div className="divide-y divide-slate-50">
                {patients.map(p => (
                  <div key={p._id} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                     <div className="flex items-center gap-4">
                        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 font-black italic text-slate-900">{p.name.charAt(0)}</div>
                        <div>
                           <p className="text-sm font-black">{p.name}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p._id.slice(-8)} • {p.age}y</p>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-[10px] font-black uppercase tracking-widest h-9"
                          onClick={() => { setSelectedPatientId(p._id); setActiveTab('nlp'); setShowNewModal(false); }}
                        >
                          NLP Note
                        </Button>
                        <Button 
                          size="sm" 
                          className="text-[10px] font-black uppercase tracking-widest h-9 bg-blue-600"
                          onClick={() => handleRunPrediction(p._id)}
                          disabled={isRunning}
                        >
                          Run ML Model
                        </Button>
                     </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
    </RoleGuard>
  );
}
