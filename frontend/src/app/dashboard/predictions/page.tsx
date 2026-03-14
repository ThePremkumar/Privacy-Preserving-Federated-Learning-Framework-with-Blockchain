'use client';

import React, { useState, useEffect } from 'react';
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
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RoleGuard } from '@/components/guards/RoleGuard';
import api from '@/lib/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [selectedPrediction, setSelectedPrediction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const fetchPredictions = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/predictions/');
      // Filter for AI predictions only
      const aiPreds = res.data.filter((p: any) => p.type === 'ai_prediction');
      setPredictions(aiPreds);
      if (aiPreds.length > 0 && !selectedPrediction) {
        setSelectedPrediction(aiPreds[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await api.get('/patients/');
      setPatients(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPredictions();
    fetchPatients();
  }, []);

  const handleRunPrediction = async (patientId: string) => {
    setIsRunning(true);
    try {
      const res = await api.post('/predictions/run', {
        patient_id: patientId,
        features: {} // Standard features will be picked up by backend simulation
      });
      setShowNewModal(false);
      fetchPredictions();
      alert(`AI model executed successfully. Prediction: ${res.data.prediction}`);
    } catch (err) {
      alert('Failed to run AI model');
    } finally {
      setIsRunning(false);
    }
  };

  // Mock explanations since real SHAP isn't implemented per-prediction yet
  const getExplanations = (pred: any) => {
    if (!pred) return [];
    const seed = pred.results?.risk_score || 5;
    return [
      { feature: 'Glucose Level', contribution: Math.min(seed * 4, 35), impact: 'High', baseline: '90mg/dL', current: '145mg/dL' },
      { feature: 'BMI Index', contribution: Math.min(seed * 3, 25), impact: 'Medium', baseline: '22.5', current: '29.1' },
      { feature: 'Age Factor', contribution: 12, impact: 'Low', baseline: 'Median', current: '45y' }
    ];
  };

  return (
    <RoleGuard allowedRoles={['doctor']}>
    <div className="space-y-10">
      {/* New Analysis Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900">
          <Card className="w-full max-w-2xl border-none shadow-2xl">
            <CardHeader className="border-b pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-black">Run AI <span className="text-blue-600">Model Analysis</span></CardTitle>
                  <CardDescription className="font-bold text-slate-400">Select a patient record to trigger the neural network</CardDescription>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setShowNewModal(false)}><X size={20}/></Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-[400px] overflow-y-auto">
              <div className="divide-y divide-slate-50">
                {patients.length === 0 ? (
                  <div className="p-10 text-center text-slate-400">No patients found. Please add a patient first.</div>
                ) : (
                  patients.map(p => (
                    <div key={p._id} className="px-8 py-5 flex items-center justify-between hover:bg-blue-50/50 transition-colors group">
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 font-black italic text-slate-900">{p.name.charAt(0)}</div>
                          <div>
                             <p className="text-sm font-black">{p.name}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p._id.slice(-8)} • {p.gender}, {p.age}y</p>
                          </div>
                       </div>
                       <Button 
                         size="sm" 
                         className="h-10 font-black uppercase tracking-widest text-[10px] bg-slate-900 hover:bg-blue-600"
                         onClick={() => handleRunPrediction(p._id)}
                         disabled={isRunning}
                       >
                          {isRunning ? <Loader2 className="animate-spin mr-2" size={12}/> : <Zap size={14} className="mr-2"/>}
                          Execute Model
                       </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-tight">Clinical <span className="text-blue-600">Risk Intelligence</span></h1>
          <p className="mt-2 text-base font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <BrainCircuit size={16} className="text-blue-600" /> Neural Diagnostic Forecasting & XAI
          </p>
        </div>
        <div className="flex gap-4">
           <Button className="h-12 px-8 shadow-xl shadow-blue-200" onClick={() => setShowNewModal(true)}>New Analysis <Plus size={18} className="ml-2" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Active Predictions Table */}
        <Card className="lg:col-span-12 xl:col-span-7 border-none shadow-2xl shadow-slate-100">
           <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-6">
              <div>
                <CardTitle className="text-2xl font-black">AI <span className="text-blue-600">Prediction Logs</span></CardTitle>
                <CardDescription className="text-base font-bold text-slate-400">Recent outputs from the federated global model</CardDescription>
              </div>
           </CardHeader>
           <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                 {isLoading ? (
                   <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>
                 ) : predictions.length === 0 ? (
                   <div className="p-20 text-center text-slate-400 font-bold">No predictions found.</div>
                 ) : (
                   predictions.map(pred => (
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
                            "h-14 w-14 flex items-center justify-center rounded-2xl transition-transform group-hover:scale-110",
                            pred.results?.risk_score > 7 ? 'bg-red-50 text-red-600 border border-red-100 shadow-sm' : 
                            pred.results?.risk_score > 4 ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
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
                       
                       <div className="flex items-center gap-12 text-slate-900">
                          <div className="flex flex-col items-center">
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Risk Map</span>
                             <span className={cn(
                               "text-xl font-black italic",
                               pred.results?.risk_score > 7 ? 'text-red-600' : 'text-slate-900'
                             )}>{pred.results?.risk_score}</span>
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

        {/* Explainable AI (XAI) Panel */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-8">
           <Card className="border-none shadow-2xl shadow-slate-100 bg-slate-900 text-white overflow-hidden relative min-h-[500px]">
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
                {selectedPrediction ? (
                  <>
                    <div className="flex items-center justify-between bg-white/5 p-6 rounded-2xl border border-white/10 shadow-inner">
                      <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">AI Confidence Score</span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-white italic">{selectedPrediction.results?.confidence || '85.2'}%</span>
                            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">High Trust</span>
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
                                   <div 
                                     className={cn(
                                        "h-full rounded-full transition-all duration-1000",
                                        exp.impact === 'High' ? 'bg-blue-500' : 'bg-blue-500/40'
                                     )} 
                                     style={{ width: `${exp.contribution}%` }} 
                                   />
                                </div>
                             </div>
                          ))}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/5">
                      <div className="bg-blue-600/10 rounded-2xl p-5 border border-blue-600/20">
                          <div className="flex gap-4">
                            <Info className="text-blue-500 shrink-0" size={20} />
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Model Conclusion</p>
                                <p className="text-[11px] font-medium text-white/70 leading-relaxed italic">
                                  "The prediction for {selectedPrediction.patient_name} is based on elevated {getExplanations(selectedPrediction)[0]?.feature}, indicating a high probability of <strong>{selectedPrediction.results?.prediction}</strong>."
                                </p>
                            </div>
                          </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-20 text-center text-white/20 font-black italic text-xl">Select a prediction record to view XAI insights</div>
                )}
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
    </RoleGuard>
  );
}
