'use client';

import React, { useState, useCallback } from 'react';
import { 
  BrainCircuit, 
  Stethoscope, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  ClipboardList, 
  Zap, 
  Search,
  ChevronRight,
  Info,
  Activity,
  ShieldCheck,
  Send
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import api from '@/lib/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NLPAnalysis {
  symptoms: string[];
  clinical_entities: string[];
  sentiment: string;
  tasks: Array<{ type: string; description: string; status: string }>;
  risk_assessment: {
    is_emergency: boolean;
    urgency_score: number;
    risk_level: string;
  };
  summary: string;
}

interface ClinicalNLPAssistantProps {
  patientId: string;
  onAnalysisComplete?: (analysis: NLPAnalysis) => void;
}

export function ClinicalNLPAssistant({ patientId, onAnalysisComplete }: ClinicalNLPAssistantProps) {
  const [note, setNote] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<NLPAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!note.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await api.post('/predictions/analyze-note', {
        patient_id: patientId,
        clinical_note: note
      });
      
      const analysisData = response.data.analysis;
      setAnalysis(analysisData);
      if (onAnalysisComplete) onAnalysisComplete(analysisData);
    } catch (err: any) {
      console.error("NLP analysis failed:", err);
      setError(err.response?.data?.detail || "Analysis service unavailable");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getUrgencyColor = (score: number) => {
    if (score >= 8) return 'text-red-600 bg-red-50 border-red-200';
    if (score >= 5) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  const getUrgencyBarColor = (score: number) => {
    if (score >= 8) return 'bg-red-500';
    if (score >= 5) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-50 bg-gradient-to-r from-blue-50/50 to-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
            <BrainCircuit size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Clinical <span className="text-blue-600">NLP Assistant</span></h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Intelligent Note Analysis & Extraction</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
           <ShieldCheck size={12} />
           <span className="text-[9px] font-black uppercase tracking-widest">Privacy Protected</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-50">
        {/* Input Section */}
        <div className="flex-1 flex flex-col p-6 space-y-4">
          <div className="flex-1 flex flex-col">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <ClipboardList size={14} className="text-blue-500" /> Physician Clinical Note
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Enter patient observations, symptoms, and plan... e.g., 'Patient reports worsening chest pain since yesterday. Schedule an ECG immediately.'"
              className="flex-1 w-full p-4 rounded-xl border-2 border-slate-100 bg-slate-50/50 text-sm font-medium focus:border-blue-500 focus:bg-white transition-all outline-none resize-none min-h-[200px]"
            />
          </div>
          
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !note.trim()}
            className={cn(
              "h-12 w-full rounded-xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest transition-all shadow-lg",
              isAnalyzing || !note.trim() 
                ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" 
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200"
            )}
          >
            {isAnalyzing ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                Analyzing Intelligence...
              </>
            ) : (
              <>
                <Zap size={16} />
                Run AI Analysis
              </>
            )}
          </button>
          
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold flex items-center gap-2">
              <AlertTriangle size={14} /> {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="flex-1 bg-slate-50/30 p-6 overflow-y-auto no-scrollbar">
          {!analysis && !isAnalyzing ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
              <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300">
                <Search size={32} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Awaiting Note Input</p>
                <p className="text-[10px] font-medium text-slate-400 mt-1">Clinical entities will appear here after analysis</p>
              </div>
            </div>
          ) : (
            <div className={cn("space-y-6 animate-in fade-in slide-in-from-right-4 duration-500", isAnalyzing && "opacity-40")}>
              {/* Urgency Meter */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Activity size={14} className="text-blue-600" /> Risk Assessment
                  </h4>
                  <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border", getUrgencyColor(analysis?.risk_assessment.urgency_score || 0))}>
                    {analysis?.risk_assessment.risk_level} Urgency
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">Urgency Score</span>
                    <span className="text-xs font-black text-slate-900">{analysis?.risk_assessment.urgency_score}/10</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all duration-1000", getUrgencyBarColor(analysis?.risk_assessment.urgency_score || 0))}
                      style={{ width: `${(analysis?.risk_assessment.urgency_score || 0) * 10}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Extracted Entities */}
              <div className="grid grid-cols-1 gap-4">
                {/* Symptoms */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Stethoscope size={14} className="text-rose-500" /> Key Symptoms
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis?.symptoms.length ? analysis.symptoms.map((s, i) => (
                      <span key={i} className="px-3 py-1 rounded-lg bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-100">
                        {s}
                      </span>
                    )) : <span className="text-[10px] font-medium text-slate-400 italic">No symptoms detected</span>}
                  </div>
                </div>

                {/* Tasks */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Calendar size={14} className="text-indigo-600" /> Actionable Tasks
                  </h4>
                  <div className="space-y-2">
                    {analysis?.tasks.length ? analysis.tasks.map((t, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 group hover:border-indigo-200 transition-colors">
                        <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-sm" />
                        <span className="text-[11px] font-bold text-slate-700 flex-1">{t.description}</span>
                        <CheckCircle2 size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                      </div>
                    )) : <span className="text-[10px] font-medium text-slate-400 italic">No tasks identified</span>}
                  </div>
                </div>
              </div>

              {/* AI Summary */}
              <div className="bg-blue-600 rounded-2xl p-5 text-white shadow-xl shadow-blue-100 relative overflow-hidden">
                <div className="absolute -top-4 -right-4 opacity-10">
                  <BrainCircuit size={80} />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 mb-2">Executive Summary</h4>
                <p className="text-[11px] font-bold leading-relaxed">{analysis?.summary}</p>
                <div className="mt-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-blue-200">
                  <Info size={12} />
                  Calculated by Clinical-NLP Engine v2.1
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
