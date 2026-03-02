'use client';

import React, { useState } from 'react';
import { 
  FileSearch, 
  BrainCircuit, 
  ShieldCheck, 
  Send, 
  MessageSquare, 
  Activity,
  AlertCircle,
  Stethoscope,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

export default function NLPPage() {
  const [note, setNote] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    // Simulate API call to backend NLP service
    setTimeout(() => {
      setResult({
        symptoms: ['Fever', 'Cough', 'Shortness of Breath'],
        entities: ['Pneumonia', 'Oxygen Saturation', 'Antibiotics'],
        sentiment: 'Negative/Critical',
        urgency: 9,
        summary: "Patient shows acute respiratory symptoms and declining stability. Immediate review suggested."
      });
      setIsAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-tight">NLP <span className="text-blue-600">Clinical Insights</span></h1>
        <p className="mt-2 text-base font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
           <FileSearch size={16} className="text-blue-600" /> Intelligent Medical Note Extraction
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card className="border-none shadow-2xl shadow-slate-100 flex flex-col h-full">
           <CardHeader className="border-b border-slate-50 pb-6">
              <CardTitle className="text-2xl font-black">Medical <span className="text-blue-600">Observations</span></CardTitle>
              <CardDescription className="text-base font-bold text-slate-400">Enter patient symptoms and clinician notes</CardDescription>
           </CardHeader>
           <CardContent className="flex-1 p-6 relative">
              <textarea 
                className="h-[400px] w-full resize-none rounded-2xl border-2 border-slate-50 bg-slate-50/50 p-6 text-lg font-bold text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                placeholder="Ex: Patient presents with escalating cough, fever of 102F. Pulse oximetry shows 88% on room air. Suspected lower respiratory infection..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="mt-6 flex justify-end">
                 <Button 
                   size="lg" 
                   className="h-14 px-10 shadow-xl shadow-blue-200" 
                   onClick={handleAnalyze}
                   disabled={isAnalyzing || !note}
                   isLoading={isAnalyzing}
                 >
                    {isAnalyzing ? "Processing AI..." : "Extract Insights"} <Send size={18} className="ml-2" />
                 </Button>
              </div>
           </CardContent>
        </Card>

        {/* Results Panel */}
        <div className="space-y-8">
           {result ? (
             <>
               <Card className="border-none shadow-2xl shadow-slate-100 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                  <CardHeader>
                     <div className="flex items-center justify-between">
                        <CardTitle className="text-white text-2xl font-black">AI Analysis Panel</CardTitle>
                        <AlertCircle className="text-white/80 animate-pulse" size={24} />
                     </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                     <p className="text-xl font-bold leading-relaxed">{result.summary}</p>
                     <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Urgency Level</span>
                           <span className="text-3xl font-black">{result.urgency}/10</span>
                        </div>
                        <div className="h-10 w-px bg-white/20" />
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Sentiment Status</span>
                           <span className="text-xl font-black uppercase">{result.sentiment}</span>
                        </div>
                     </div>
                  </CardContent>
               </Card>

               <Card className="border-none shadow-2xl shadow-slate-100">
                  <CardContent className="p-6">
                     <div className="grid grid-cols-2 gap-6">
                        <div>
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Symptoms Detected</h4>
                           <div className="flex flex-wrap gap-2">
                              {result.symptoms.map((s: string) => (
                                <span key={s} className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-black uppercase tracking-widest border border-red-100">{s}</span>
                              ))}
                           </div>
                        </div>
                        <div>
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Clinical Entities</h4>
                           <div className="flex flex-wrap gap-2">
                              {result.entities.map((e: string) => (
                                <span key={e} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-black uppercase tracking-widest border border-blue-100">{e}</span>
                              ))}
                           </div>
                        </div>
                     </div>
                  </CardContent>
               </Card>
             </>
           ) : (
             <div className="flex h-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center text-slate-400">
                <FileText size={64} className="mb-6 opacity-20" />
                <h3 className="text-xl font-black text-slate-900 mb-2">Awaiting Diagnosis</h3>
                <p className="font-bold text-slate-500 max-w-xs">Enter a medical note to see immediate clinical entity extraction and risk assessment.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
