'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileSearch, 
  BrainCircuit, 
  ShieldCheck, 
  Send, 
  MessageSquare, 
  Activity,
  AlertCircle,
  Stethoscope,
  FileText,
  Users,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { RoleGuard } from '@/components/guards/RoleGuard';
import api from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function NLPPage() {
  const [note, setNote] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');

  useEffect(() => {
    async function fetchPatients() {
      try {
        const res = await api.get('/patients/');
        setPatients(res.data);
        if (res.data.length > 0) setSelectedPatientId(res.data[0]._id);
      } catch (err) {
        console.error('Failed to fetch patients', err);
      }
    }
    fetchPatients();
  }, []);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const res = await api.post('/predictions/analyze-note', {
        patient_id: selectedPatientId,
        clinical_note: note,
      });
      setResult(res.data.analysis);
      setNote(''); // Clear note after successful analysis
    } catch {
      alert('Analysis failed. Please check backend services.');
      setResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['doctor']}>
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-tight">NLP <span className="text-blue-600">Clinical Insights</span></h1>
          <p className="mt-2 text-base font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <FileSearch size={16} className="text-blue-600" /> Intelligent Medical Note Extraction
          </p>
        </div>
        
        <div className="w-64 space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Context Patient</label>
          <div className="relative">
             <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <select 
               className="w-full h-11 pl-10 pr-4 bg-slate-100 border-none rounded-xl text-xs font-black uppercase tracking-widest text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
               value={selectedPatientId}
               onChange={(e) => setSelectedPatientId(e.target.value)}
             >
               {patients.map(p => (
                 <option key={p._id} value={p._id}>{p.name}</option>
               ))}
             </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card className="border-none shadow-2xl shadow-slate-100 flex flex-col h-full">
           <CardHeader className="border-b border-slate-50 pb-6">
              <CardTitle className="text-2xl font-black">Medical <span className="text-blue-600">Observations</span></CardTitle>
              <CardDescription className="text-base font-bold text-slate-400">Enter symptoms or clinical notes for transcription</CardDescription>
           </CardHeader>
           <CardContent className="flex-1 p-6 relative">
              <textarea 
                className="h-[400px] w-full resize-none rounded-2xl border-2 border-slate-50 bg-slate-50/50 p-6 text-lg font-bold text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                placeholder="Ex: Patient presents with escalating cough, fever of 102F. Pulse oximetry shows 88% on room air..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="mt-6 flex justify-end">
                 <Button 
                   size="lg" 
                   className="h-14 px-10 shadow-xl shadow-blue-600 bg-blue-600 hover:bg-blue-700" 
                   onClick={handleAnalyze}
                   disabled={isAnalyzing || !note || !selectedPatientId}
                 >
                    {isAnalyzing ? <Loader2 size={18} className="animate-spin mr-2" /> : <Send size={18} className="mr-2" />}
                    {isAnalyzing ? "AI Processing..." : "Extract Insights"}
                 </Button>
              </div>
           </CardContent>
        </Card>

        {/* Results Panel */}
        <div className="space-y-8">
           {result ? (
             <>
               <Card className="border-none shadow-2xl shadow-slate-100 bg-slate-900 text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-8 text-blue-500 opacity-10"><BrainCircuit size={200} /></div>
                  <CardHeader className="relative border-b border-white/5 pb-6">
                     <div className="flex items-center justify-between">
                        <CardTitle className="text-white text-2xl font-black italic">AI <span className="text-blue-500">Analysis Result</span></CardTitle>
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                     </div>
                  </CardHeader>
                  <CardContent className="relative space-y-8 pt-6">
                     <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-lg font-medium leading-relaxed italic text-white/90">"{result.summary}"</p>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                           <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-1 block">Urgency Score</span>
                           <span className={cn("text-3xl font-black italic", result.urgency > 7 ? 'text-red-500' : 'text-blue-400')}>{result.urgency}/10</span>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                           <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-1 block">Sentiment</span>
                           <span className="text-xl font-black uppercase tracking-tight text-white/80">{result.sentiment}</span>
                        </div>
                     </div>
                  </CardContent>
               </Card>

               <Card className="border-none shadow-2xl shadow-slate-100">
                  <CardContent className="p-8 space-y-8">
                     <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 flex items-center gap-2">
                           <Activity size={12} className="text-red-500" /> Symptoms Detected
                        </h4>
                        <div className="flex flex-wrap gap-2">
                           {result.symptoms.length > 0 ? result.symptoms.map((s: string) => (
                             <span key={s} className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-red-100">{s}</span>
                           )) : <span className="text-xs font-bold text-slate-300">None detected</span>}
                        </div>
                     </div>
                     <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 flex items-center gap-2">
                           <ShieldCheck size={12} className="text-blue-500" /> Clinical Entities
                        </h4>
                        <div className="flex flex-wrap gap-2">
                           {result.entities.length > 0 ? result.entities.map((e: string) => (
                             <span key={e} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100">{e}</span>
                           )) : <span className="text-xs font-bold text-slate-300">None detected</span>}
                        </div>
                     </div>
                  </CardContent>
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center">
                     <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                        <CheckCircle2 size={12} className="text-emerald-500" /> Confidence Score: {(result.confidence * 100).toFixed(1)}%
                     </p>
                  </div>
               </Card>
             </>
           ) : (
             <div className="flex bg-slate-50/50 h-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-100 p-12 text-center text-slate-400">
                <div className="h-20 w-20 rounded-3xl bg-white shadow-xl flex items-center justify-center mb-6">
                   <FileText size={40} className="opacity-20" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Awaiting Diagnosis</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest max-w-xs leading-relaxed">Select a patient and enter clinical notes to trigger secure entity extraction.</p>
             </div>
           )}
        </div>
      </div>
    </div>
    </RoleGuard>
  );
}
