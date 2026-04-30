'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Heart,
  Thermometer,
  Activity,
  Droplets,
  FileText,
  BrainCircuit,
  Clock,
  Edit3,
  Trash2,
  Zap,
  Download,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  FileSearch,
  UserPlus,
  X,
  Save,
  ChevronRight,
  Stethoscope,
  Pill,
  ClipboardList,
  Shield,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { RoleGuard } from '@/components/guards/RoleGuard';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { SendToAdminModal } from '@/components/patients/SendToAdminModal';

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [predictionCount, setPredictionCount] = useState(0);
  const [reportCount, setReportCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isRunningPrediction, setIsRunningPrediction] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [clinicalReport, setClinicalReport] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSendToAdmin, setShowSendToAdmin] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/doctor/patient/${patientId}/timeline`);
      setPatient(res.data.patient);
      setTimeline(res.data.timeline);
      setPredictionCount(res.data.prediction_count);
      setReportCount(res.data.report_count);
    } catch (err) {
      console.error('Failed to load patient', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) fetchData();
  }, [patientId]);

  const handleRunPrediction = async () => {
    setIsRunningPrediction(true);
    try {
      const res = await api.post('/predictions/run', {
        patient_id: patientId,
        features: {}
      });
      alert(`AI Prediction: ${res.data.prediction} (Risk: ${res.data.risk_score})`);
      fetchData();
    } catch {
      alert('Prediction failed');
    } finally {
      setIsRunningPrediction(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const res = await api.post(`/doctor/clinical-report/${patientId}`);
      setClinicalReport(res.data);
    } catch {
      alert('Failed to generate report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleEdit = () => {
    setEditForm({
      name: patient?.name || '',
      age: patient?.age || '',
      phone: patient?.phone || '',
      address: patient?.address || '',
      current_symptoms: patient?.current_symptoms || '',
      diagnosis_notes: patient?.diagnosis_notes || '',
      blood_pressure: patient?.blood_pressure || '',
      sugar_level: patient?.sugar_level || '',
      heart_rate: patient?.heart_rate || '',
      temperature: patient?.temperature || '',
      medical_history: (patient?.medical_history || []).join(', ')
    });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates: any = {};
      if (editForm.name) updates.name = editForm.name;
      if (editForm.age) updates.age = parseInt(editForm.age);
      if (editForm.phone !== undefined) updates.phone = editForm.phone;
      if (editForm.address !== undefined) updates.address = editForm.address;
      if (editForm.current_symptoms !== undefined) updates.current_symptoms = editForm.current_symptoms;
      if (editForm.diagnosis_notes !== undefined) updates.diagnosis_notes = editForm.diagnosis_notes;
      if (editForm.blood_pressure !== undefined) updates.blood_pressure = editForm.blood_pressure;
      if (editForm.sugar_level !== undefined) updates.sugar_level = editForm.sugar_level;
      if (editForm.heart_rate) updates.heart_rate = parseInt(editForm.heart_rate);
      if (editForm.temperature) updates.temperature = parseFloat(editForm.temperature);
      if (editForm.medical_history !== undefined) {
        updates.medical_history = editForm.medical_history.split(',').map((s: string) => s.trim()).filter((s: string) => s);
      }
      await api.patch(`/patients/${patientId}`, updates);
      setShowEditModal(false);
      fetchData();
      alert('Patient updated successfully');
    } catch (err) {
      alert('Failed to update patient');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/patients/${patientId}`);
      alert('Patient deleted');
      router.push('/dashboard/patients');
    } catch {
      alert('Failed to delete');
    }
  };

  if (isLoading) {
    return (
      <RoleGuard allowedRoles={['doctor']}>
        <div className="h-96 flex items-center justify-center">
          <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
      </RoleGuard>
    );
  }

  if (!patient) {
    return (
      <RoleGuard allowedRoles={['doctor', 'hospital']}>
        <div className="h-96 flex flex-col items-center justify-center gap-4">
          <AlertTriangle size={48} className="text-amber-400" />
          <p className="text-lg font-bold text-slate-400">Patient not found</p>
          <Button onClick={() => router.push('/dashboard/patients')}>Back to Patients</Button>
        </div>
      </RoleGuard>
    );
  }

  const riskLevel = (patient.medical_history?.length || 0) > 3 ? 'High' : (patient.medical_history?.length || 0) > 1 ? 'Moderate' : 'Low';
  const riskColor = riskLevel === 'High' ? 'text-red-600 bg-red-50 border-red-100' : riskLevel === 'Moderate' ? 'text-amber-600 bg-amber-50 border-amber-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100';

  return (
    <RoleGuard allowedRoles={['doctor', 'hospital']}>
      <div className="space-y-8 pb-20">
        {showSendToAdmin && (
          <SendToAdminModal 
            patient={patient} 
            onClose={() => setShowSendToAdmin(false)} 
            onSuccess={() => alert('Patient details sent to admin successfully')} 
          />
        )}

        {/* Clinical Report Modal */}
        {clinicalReport && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4 overflow-y-auto">
            <Card className="w-full max-w-3xl border-none shadow-2xl my-8">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-5 px-8 pt-8 bg-gradient-to-r from-slate-900 to-blue-900 text-white rounded-t-xl">
                <div>
                  <CardTitle className="text-2xl font-black text-white">Clinical <span className="text-blue-400">Report</span></CardTitle>
                  <CardDescription className="text-white/50 font-bold text-xs uppercase tracking-widest mt-1">{clinicalReport.report_id}</CardDescription>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setClinicalReport(null)} className="text-white/60 hover:text-white hover:bg-white/10"><X size={20}/></Button>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {/* Patient Info */}
                <div className="bg-slate-50 rounded-2xl p-6 border">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-4">Patient Information</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Name</span><p className="text-sm font-black text-slate-900">{clinicalReport.patient.name}</p></div>
                    <div><span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Age</span><p className="text-sm font-black text-slate-900">{clinicalReport.patient.age}y</p></div>
                    <div><span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Gender</span><p className="text-sm font-black text-slate-900">{clinicalReport.patient.gender}</p></div>
                    <div><span className="text-[9px] font-black uppercase tracking-widest text-slate-400">BP</span><p className="text-sm font-black text-slate-900">{clinicalReport.patient.blood_pressure}</p></div>
                  </div>
                </div>

                {/* AI Analysis */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-4 flex items-center gap-2"><BrainCircuit size={14}/> AI Analysis Summary</h4>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center"><p className="text-2xl font-black text-blue-600">{clinicalReport.ai_analysis.total_predictions}</p><p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Predictions</p></div>
                    <div className="text-center"><p className="text-2xl font-black text-blue-600">{clinicalReport.ai_analysis.average_risk_score}</p><p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Avg Risk</p></div>
                    <div className="text-center">
                      <p className={cn("text-2xl font-black", clinicalReport.ai_analysis.risk_level === 'High' ? 'text-red-600' : clinicalReport.ai_analysis.risk_level === 'Moderate' ? 'text-amber-600' : 'text-emerald-600')}>
                        {clinicalReport.ai_analysis.risk_level}
                      </p>
                      <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Risk Level</p>
                    </div>
                  </div>
                  {clinicalReport.ai_analysis.detected_conditions?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {clinicalReport.ai_analysis.detected_conditions.map((c: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest">{c}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Clinical Summary */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Clinical Summary</h4>
                  <p className="text-sm text-slate-700 leading-relaxed bg-white p-4 rounded-xl border">{clinicalReport.clinical_summary}</p>
                </div>

                {/* Recommendations */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">AI Recommendations</h4>
                  <div className="space-y-2">
                    {clinicalReport.recommendations?.map((rec: any, i: number) => (
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
                        <p className="text-xs font-bold text-slate-700">{rec.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-end gap-3">
                  <Button variant="outline" onClick={() => window.print()} className="font-black text-[10px] uppercase tracking-widest h-11 px-6"><Download size={14} className="mr-2"/>Print/Download</Button>
                  <Button onClick={() => setClinicalReport(null)} className="font-black text-[10px] uppercase tracking-widest h-11 px-6">Close</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
            <Card className="w-full max-w-2xl border-none shadow-2xl my-8">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4 px-8 pt-8">
                <div>
                  <CardTitle className="text-2xl font-black">Edit <span className="text-blue-600">Patient</span></CardTitle>
                  <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">Update medical records</CardDescription>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setShowEditModal(false)}><X size={24}/></Button>
              </CardHeader>
              <div className="p-8 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Name</label>
                    <input className="w-full h-11 px-4 bg-slate-50 border rounded-xl text-xs font-bold" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})}/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Age</label>
                    <input type="number" className="w-full h-11 px-4 bg-slate-50 border rounded-xl text-xs font-bold" value={editForm.age} onChange={e => setEditForm({...editForm, age: e.target.value})}/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Blood Pressure</label>
                    <input className="w-full h-11 px-4 bg-slate-50 border rounded-xl text-xs font-bold" value={editForm.blood_pressure} onChange={e => setEditForm({...editForm, blood_pressure: e.target.value})}/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sugar Level</label>
                    <input className="w-full h-11 px-4 bg-slate-50 border rounded-xl text-xs font-bold" value={editForm.sugar_level} onChange={e => setEditForm({...editForm, sugar_level: e.target.value})}/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Heart Rate (BPM)</label>
                    <input type="number" className="w-full h-11 px-4 bg-slate-50 border rounded-xl text-xs font-bold" value={editForm.heart_rate} onChange={e => setEditForm({...editForm, heart_rate: e.target.value})}/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Temperature (°C)</label>
                    <input type="number" step="0.1" className="w-full h-11 px-4 bg-slate-50 border rounded-xl text-xs font-bold" value={editForm.temperature} onChange={e => setEditForm({...editForm, temperature: e.target.value})}/>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Symptoms</label>
                  <input className="w-full h-11 px-4 bg-slate-50 border rounded-xl text-xs font-bold" value={editForm.current_symptoms} onChange={e => setEditForm({...editForm, current_symptoms: e.target.value})}/>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Diagnosis Notes</label>
                  <textarea className="w-full h-20 p-4 bg-slate-50 border rounded-xl text-xs font-bold" value={editForm.diagnosis_notes} onChange={e => setEditForm({...editForm, diagnosis_notes: e.target.value})}/>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Medical History (comma separated)</label>
                  <textarea className="w-full h-16 p-4 bg-slate-50 border rounded-xl text-xs font-bold" value={editForm.medical_history} onChange={e => setEditForm({...editForm, medical_history: e.target.value})}/>
                </div>
                <div className="flex gap-3 pt-3">
                  <Button variant="outline" className="flex-1 h-12 font-black uppercase tracking-widest text-[10px]" onClick={() => setShowEditModal(false)}>Cancel</Button>
                  <Button className="flex-1 h-12 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-200" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <><Loader2 className="animate-spin mr-2" size={14}/> Saving...</> : <><Save size={14} className="mr-2"/> Save Changes</>}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <Card className="w-full max-md border-none shadow-2xl p-8 text-center space-y-6">
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <Trash2 className="text-red-600" size={28}/>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Delete Patient Record?</h3>
                <p className="text-sm text-slate-500 mt-2">This will mark <strong>{patient.name}</strong>'s record as deleted. This action can be reversed by an admin.</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 h-12 font-black uppercase tracking-widest text-[10px]" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                <Button className="flex-1 h-12 font-black uppercase tracking-widest text-[10px] bg-red-600 hover:bg-red-700 shadow-xl shadow-red-200" onClick={handleDelete}>Delete Patient</Button>
              </div>
            </Card>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/patients')} className="h-10 w-10 rounded-xl hover:bg-blue-50">
              <ArrowLeft size={20}/>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black tracking-tight text-slate-900">{patient.name}</h1>
                <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border", riskColor)}>
                  {riskLevel} Risk
                </span>
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                {patient.patient_id_manual || patient._id?.slice(-8)} • {patient.gender}, {patient.age}y
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="h-11 px-5 border-2 font-black text-[10px] uppercase tracking-widest" onClick={() => setShowSendToAdmin(true)}>
              <Send size={14} className="mr-2"/> Send to Admin
            </Button>
            <Button variant="outline" className="h-11 px-5 border-2 font-black text-[10px] uppercase tracking-widest" onClick={handleEdit}>
              <Edit3 size={14} className="mr-2"/> Edit
            </Button>
            <Button variant="outline" className="h-11 px-5 border-2 font-black text-[10px] uppercase tracking-widest text-red-500 border-red-200 hover:bg-red-50" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 size={14} className="mr-2"/> Delete
            </Button>
          </div>
        </div>

        {/* Vitals Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <VitalCard icon={Activity} label="Blood Pressure" value={patient.blood_pressure || 'N/A'} color="blue" />
          <VitalCard icon={Droplets} label="Sugar Level" value={patient.sugar_level || 'N/A'} color="purple" />
          <VitalCard icon={Heart} label="Heart Rate" value={patient.heart_rate ? `${patient.heart_rate} BPM` : 'N/A'} color="red" alert={patient.heart_rate && (patient.heart_rate > 100 || patient.heart_rate < 60)} />
          <VitalCard icon={Thermometer} label="Temperature" value={patient.temperature ? `${patient.temperature}°C` : 'N/A'} color="amber" alert={patient.temperature && patient.temperature > 38.0} />
        </div>

        {/* Quick Actions Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button onClick={handleRunPrediction} disabled={isRunningPrediction} className="group p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-200 hover:shadow-2xl hover:shadow-blue-300 transition-all flex items-center gap-4 disabled:opacity-60">
            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              {isRunningPrediction ? <Loader2 className="animate-spin" size={22}/> : <Zap size={22}/>}
            </div>
            <div className="text-left">
              <p className="text-sm font-black">Run AI Prediction</p>
              <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Neural diagnostic model</p>
            </div>
          </button>

          <button onClick={handleGenerateReport} disabled={isGeneratingReport} className="group p-5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-xl shadow-emerald-200 hover:shadow-2xl hover:shadow-emerald-300 transition-all flex items-center gap-4 disabled:opacity-60">
            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              {isGeneratingReport ? <Loader2 className="animate-spin" size={22}/> : <ClipboardList size={22}/>}
            </div>
            <div className="text-left">
              <p className="text-sm font-black">Generate Clinical Report</p>
              <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest">AI-enhanced summary</p>
            </div>
          </button>

          <button onClick={() => router.push('/dashboard/nlp')} className="group p-5 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-600 text-white shadow-xl shadow-purple-200 hover:shadow-2xl hover:shadow-purple-300 transition-all flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <FileSearch size={22}/>
            </div>
            <div className="text-left">
              <p className="text-sm font-black">NLP Note Analysis</p>
              <p className="text-[10px] font-bold text-purple-200 uppercase tracking-widest">Analyze clinical notes</p>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Patient Details */}
          <div className="lg:col-span-5 space-y-6">
            {/* Personal Info Card */}
            <Card className="border-none shadow-2xl shadow-slate-100">
              <CardHeader className="border-b border-slate-50 pb-4">
                <CardTitle className="text-lg font-black">Patient <span className="text-blue-600">Profile</span></CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                  <InfoRow label="Full Name" value={patient.name} />
                  <InfoRow label="Age" value={`${patient.age} years`} />
                  <InfoRow label="Gender" value={patient.gender} />
                  <InfoRow label="Phone" value={patient.phone || 'Not provided'} />
                  <InfoRow label="Address" value={patient.address || 'Not provided'} />
                  <InfoRow label="Current Symptoms" value={patient.current_symptoms || 'None reported'} />
                  <InfoRow label="Diagnosis Notes" value={patient.diagnosis_notes || 'None'} />
                </div>
              </CardContent>
            </Card>

            {/* Medical History */}
            <Card className="border-none shadow-2xl shadow-slate-100">
              <CardHeader className="border-b border-slate-50 pb-4">
                <CardTitle className="text-lg font-black">Medical <span className="text-blue-600">History</span></CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                {patient.medical_history?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {patient.medical_history.map((h: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-black uppercase tracking-widest border border-blue-100">
                        {h}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 font-bold italic">No medical history recorded</p>
                )}
              </CardContent>
            </Card>

            {/* Attached Reports */}
            <Card className="border-none shadow-2xl shadow-slate-100">
              <CardHeader className="border-b border-slate-50 pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-black">Attached <span className="text-blue-600">Reports</span></CardTitle>
                <span className="text-xs font-black text-blue-600">{reportCount} files</span>
              </CardHeader>
              <CardContent className="p-0">
                {patient.reports?.length > 0 ? (
                  <div className="divide-y divide-slate-50">
                    {patient.reports.map((r: any, i: number) => (
                      <div key={i} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                        <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                          <FileText size={16}/>
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-xs font-black text-slate-900 truncate">{r.filename}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(r.uploaded_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 text-sm font-bold">No reports attached</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Timeline */}
          <div className="lg:col-span-7">
            <Card className="border-none shadow-2xl shadow-slate-100 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white pb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-600/30">
                    Timeline Active
                  </div>
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                </div>
                <CardTitle className="text-white text-2xl font-black">Patient <span className="text-blue-400">Timeline</span></CardTitle>
                <CardDescription className="text-white/40 font-bold uppercase tracking-widest text-[10px] mt-1">{predictionCount} predictions • {reportCount} reports</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {timeline.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 font-bold">
                    <Clock size={40} className="mx-auto text-slate-200 mb-3"/>
                    No timeline events yet
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {timeline.map((event, i) => (
                      <div key={i} className="px-6 py-5 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                          event.type === 'prediction' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                          event.type === 'nlp' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                          event.type === 'report' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                          'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        )}>
                          {event.type === 'prediction' ? <BrainCircuit size={18}/> :
                           event.type === 'nlp' ? <FileSearch size={18}/> :
                           event.type === 'report' ? <FileText size={18}/> :
                           <UserPlus size={18}/>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-900">{event.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{event.description}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-1">
                            <Clock size={10}/> {new Date(event.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {event.type === 'prediction' && event.metadata?.risk_score && (
                          <div className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                            event.metadata.risk_score > 7 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                          )}>
                            Risk {event.metadata.risk_score}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Privacy Notice */}
        <Card className="border-none shadow-xl shadow-slate-100 bg-slate-900 text-white p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-600/30">
            <Shield size={22}/>
          </div>
          <div>
            <p className="text-sm font-black italic">HIPAA-Compliant Data Access</p>
            <p className="text-[10px] font-medium text-white/50">All patient data access is logged and privacy-protected. Zero-leakage guarantee active.</p>
          </div>
        </Card>
      </div>
    </RoleGuard>
  );
}

function VitalCard({ icon: Icon, label, value, color, alert }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };
  return (
    <Card className={cn(
      "border-none shadow-lg transition-all hover:shadow-xl",
      alert ? "shadow-red-100 ring-2 ring-red-200" : "shadow-slate-100"
    )}>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center border", colors[color])}>
          <Icon size={20}/>
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
          <p className={cn("text-lg font-black", alert ? "text-red-600" : "text-slate-900")}>{value}</p>
        </div>
        {alert && <AlertTriangle size={16} className="text-red-500 ml-auto animate-pulse"/>}
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-xs font-bold text-slate-700 text-right max-w-[60%]">{value}</span>
    </div>
  );
}
