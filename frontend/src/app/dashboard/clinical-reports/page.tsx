'use client';

import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Loader2,
  Search,
  FileText,
  BrainCircuit,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  ChevronRight,
  Shield,
  Heart,
  Activity,
  Stethoscope,
  X,
  Printer
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

export default function ClinicalReportsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [generatedReports, setGeneratedReports] = useState<any[]>([]);

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/patients/');
      setPatients(res.data);
    } catch {
      console.error('Failed to fetch patients');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleGenerateReport = async (patientId: string) => {
    setIsGenerating(patientId);
    try {
      const res = await api.post(`/doctor/clinical-report/${patientId}`);
      setSelectedReport(res.data);
      setGeneratedReports(prev => [res.data, ...prev]);
    } catch {
      alert('Failed to generate report');
    } finally {
      setIsGenerating(null);
    }
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p._id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <RoleGuard allowedRoles={['doctor']}>
      <div className="space-y-8">

        {/* Report Detail Modal */}
        {selectedReport && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4 overflow-y-auto">
            <Card className="w-full max-w-3xl border-none shadow-2xl my-8">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-5 px-8 pt-8 bg-gradient-to-r from-slate-900 to-blue-900 text-white rounded-t-xl">
                <div>
                  <CardTitle className="text-2xl font-black text-white">Clinical <span className="text-blue-400">Report</span></CardTitle>
                  <CardDescription className="text-white/50 font-bold text-xs uppercase tracking-widest mt-1">{selectedReport.report_id}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => window.print()} className="text-white/60 hover:text-white hover:bg-white/10"><Printer size={18}/></Button>
                  <Button size="icon" variant="ghost" onClick={() => setSelectedReport(null)} className="text-white/60 hover:text-white hover:bg-white/10"><X size={20}/></Button>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {/* Patient Summary */}
                <div className="bg-slate-50 rounded-2xl p-6 border">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-4">Patient Information</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    {[
                      { label: 'Name', value: selectedReport.patient.name },
                      { label: 'Age', value: `${selectedReport.patient.age}y` },
                      { label: 'Gender', value: selectedReport.patient.gender },
                      { label: 'Blood Pressure', value: selectedReport.patient.blood_pressure },
                    ].map((item, i) => (
                      <div key={i}>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                        <p className="text-sm font-black text-slate-900 mt-0.5">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risk Banner */}
                <div className={cn(
                  "rounded-2xl p-6 border flex items-center justify-between",
                  selectedReport.ai_analysis.risk_level === 'High' ? 'bg-red-50 border-red-100' :
                  selectedReport.ai_analysis.risk_level === 'Moderate' ? 'bg-amber-50 border-amber-100' :
                  'bg-emerald-50 border-emerald-100'
                )}>
                  <div className="flex items-center gap-4">
                    <div className={cn("h-14 w-14 rounded-xl flex items-center justify-center",
                      selectedReport.ai_analysis.risk_level === 'High' ? 'bg-red-100 text-red-600' :
                      selectedReport.ai_analysis.risk_level === 'Moderate' ? 'bg-amber-100 text-amber-600' :
                      'bg-emerald-100 text-emerald-600'
                    )}>
                      {selectedReport.ai_analysis.risk_level === 'High' ? <AlertTriangle size={24}/> :
                       selectedReport.ai_analysis.risk_level === 'Moderate' ? <Activity size={24}/> :
                       <CheckCircle2 size={24}/>}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Overall Risk Assessment</p>
                      <p className={cn("text-2xl font-black",
                        selectedReport.ai_analysis.risk_level === 'High' ? 'text-red-600' :
                        selectedReport.ai_analysis.risk_level === 'Moderate' ? 'text-amber-600' :
                        'text-emerald-600'
                      )}>{selectedReport.ai_analysis.risk_level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-slate-900">{selectedReport.ai_analysis.average_risk_score}/10</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Avg Risk Score</p>
                  </div>
                </div>

                {/* AI Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                    <p className="text-2xl font-black text-blue-600">{selectedReport.ai_analysis.total_predictions}</p>
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mt-1">AI Predictions</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-100">
                    <p className="text-2xl font-black text-purple-600">{selectedReport.ai_analysis.total_nlp_analyses}</p>
                    <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mt-1">NLP Analyses</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                    <p className="text-2xl font-black text-slate-900">{selectedReport.attached_reports}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Reports On File</p>
                  </div>
                </div>

                {/* Detected Conditions */}
                {selectedReport.ai_analysis.detected_conditions?.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Detected Conditions</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedReport.ai_analysis.detected_conditions.map((c: string, i: number) => (
                        <span key={i} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-black uppercase tracking-widest border border-blue-100">{c}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clinical Summary */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Clinical Summary</h4>
                  <p className="text-sm text-slate-700 leading-relaxed bg-white p-5 rounded-xl border italic">{selectedReport.clinical_summary}</p>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">AI Recommendations</h4>
                  <div className="space-y-2">
                    {selectedReport.recommendations?.map((rec: any, i: number) => (
                      <div key={i} className={cn("p-4 rounded-xl border flex items-start gap-3",
                        rec.priority === 'CRITICAL' ? 'bg-red-50 border-red-100' :
                        rec.priority === 'HIGH' ? 'bg-amber-50 border-amber-100' :
                        rec.priority === 'MODERATE' ? 'bg-blue-50 border-blue-100' :
                        'bg-slate-50 border-slate-100'
                      )}>
                        <span className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest shrink-0 mt-0.5",
                          rec.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                          rec.priority === 'HIGH' ? 'bg-amber-100 text-amber-700' :
                          rec.priority === 'MODERATE' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-600'
                        )}>{rec.priority}</span>
                        <div>
                          <p className="text-xs font-bold text-slate-700">{rec.text}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{rec.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    Generated on {new Date(selectedReport.generated_at).toLocaleString()} • HIPAA Compliant • AI-Enhanced
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-tight">Clinical <span className="text-blue-600">Reports</span></h1>
            <p className="mt-2 text-base font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <ClipboardList size={16} className="text-blue-600" /> AI-Enhanced Medical Report Generation
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="border-none shadow-lg shadow-slate-100/50 p-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100"><Stethoscope size={22}/></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Patients</p>
                <p className="text-2xl font-black italic text-slate-900">{patients.length}</p>
              </div>
            </div>
          </Card>
          <Card className="border-none shadow-lg shadow-slate-100/50 p-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100"><FileText size={22}/></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reports Generated</p>
                <p className="text-2xl font-black italic text-emerald-600">{generatedReports.length}</p>
              </div>
            </div>
          </Card>
          <Card className="border-none shadow-lg shadow-slate-100/50 p-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100"><BrainCircuit size={22}/></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI-Powered</p>
                <p className="text-2xl font-black italic text-purple-600">Active</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Previously Generated Reports */}
        {generatedReports.length > 0 && (
          <Card className="border-none shadow-2xl shadow-slate-100">
            <CardHeader className="border-b border-slate-50 pb-5">
              <CardTitle className="text-xl font-black">Generated <span className="text-blue-600">Reports</span></CardTitle>
              <CardDescription className="text-sm font-bold text-slate-400">Reports generated this session</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {generatedReports.map((report, i) => (
                  <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => setSelectedReport(report)}>
                    <div className="flex items-center gap-4">
                      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border",
                        report.ai_analysis.risk_level === 'High' ? 'bg-red-50 text-red-600 border-red-100' :
                        report.ai_analysis.risk_level === 'Moderate' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-emerald-50 text-emerald-600 border-emerald-100'
                      )}>
                        <FileText size={18}/>
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{report.patient.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{report.report_id} • {new Date(report.generated_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                        report.ai_analysis.risk_level === 'High' ? 'bg-red-50 text-red-600 border-red-100' :
                        report.ai_analysis.risk_level === 'Moderate' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-emerald-50 text-emerald-600 border-emerald-100'
                      )}>{report.ai_analysis.risk_level} Risk</span>
                      <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-600 transition-colors"/>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Patient List for Report Generation */}
        <Card className="border-none shadow-2xl shadow-slate-100 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-6 p-6">
            <div>
              <CardTitle className="text-xl font-black">Generate Report <span className="text-blue-600">For Patient</span></CardTitle>
              <CardDescription className="text-sm font-bold text-slate-400">Select a patient to generate an AI clinical report</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
              <input className="h-10 w-56 rounded-xl bg-slate-50 pl-9 pr-4 text-xs font-bold border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Search patients..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}/>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={32}/></div>
            ) : filteredPatients.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-bold">No patients found</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filteredPatients.map(p => {
                  return (
                    <div key={p._id} className="px-6 py-5 flex items-center justify-between hover:bg-blue-50/30 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black italic">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{p.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {p.gender}, {p.age}y • {p.current_symptoms || 'No symptoms'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn("px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border",
                          p.clinical_risk?.level === 'High' ? 'bg-red-50 text-red-600 border-red-100' :
                          p.clinical_risk?.level === 'Moderate' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-emerald-50 text-emerald-600 border-emerald-100'
                        )}>{p.clinical_risk?.label || (p.clinical_risk?.level === 'High' ? 'Critical' : p.clinical_risk?.level === 'Moderate' ? 'Moderate' : 'Low')}</span>
                        <Button
                          size="sm"
                          className="h-10 font-black uppercase tracking-widest text-[10px] bg-slate-900 hover:bg-blue-600 shadow-lg"
                          onClick={() => handleGenerateReport(p._id)}
                          disabled={isGenerating === p._id}
                        >
                          {isGenerating === p._id ? <><Loader2 className="animate-spin mr-2" size={12}/> Generating...</> : <><ClipboardList size={14} className="mr-2"/> Generate Report</>}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Privacy Footer */}
        <Card className="border-none shadow-xl shadow-slate-100 bg-slate-900 text-white p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-600/30">
            <Shield size={22}/>
          </div>
          <div>
            <p className="text-sm font-black italic">AI-Powered Clinical Intelligence</p>
            <p className="text-[10px] font-medium text-white/50">Reports are generated using federated model predictions and NLP analysis. Patient data never leaves the secure environment.</p>
          </div>
        </Card>
      </div>
    </RoleGuard>
  );
}
