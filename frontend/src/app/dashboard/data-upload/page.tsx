'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Upload,
  FileUp,
  Shield,
  ShieldCheck,
  Database,
  CheckCircle2,
  FileText,
  Lock,
  X,
  Loader2,
  AlertCircle,
  Play,
  Zap,
  TrendingUp,
  Brain,
  Send,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface UploadHistoryItem {
  id: string;
  filename: string;
  record_count: number;
  sha256_hash: string;
  uploaded_at: string;
  status: string;
}

interface TrainingJob {
  id: string;
  hospital_id: string;
  upload_id: string;
  status: string;
  epochs: number;
  accuracy: string | null;
  loss: string | null;
  num_samples: number;
  weights_hash: string | null;
  epsilon_used: string;
  started_at: string;
  completed_at: string | null;
  review_notes: string | null;
  reviewed_by: string | null;
  source_filename?: string | null;
}

export default function DataUploadPage() {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<{ record_count: number; sha256_hash: string; filename: string; id: string } | null>(null);
  const [recentUploads, setRecentUploads] = useState<UploadHistoryItem[]>([]);
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingResult, setTrainingResult] = useState<TrainingJob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [suggestedFilename, setSuggestedFilename] = useState<string | null>(null);
  const [confirmWarning, setConfirmWarning] = useState(false);
  const [showValidationUI, setShowValidationUI] = useState(false);
  const [readinessReport, setReadinessReport] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUploadHistory = useCallback(async () => {
    try {
      const res = await api.get('/data/uploads');
      setRecentUploads(res.data);
    } catch { setRecentUploads([]); }
  }, []);

  const fetchTrainingJobs = useCallback(async () => {
    try {
      const res = await api.get('/training/my-jobs');
      setTrainingJobs(res.data);
    } catch { setTrainingJobs([]); }
  }, []);

  useEffect(() => {
    fetchUploadHistory();
    fetchTrainingJobs();
  }, [fetchUploadHistory, fetchTrainingJobs]);

  const handleFileSelect = (file: File) => {
    setErrorMessage(null);
    setUploadComplete(false);
    setUploadResult(null);
    setTrainingResult(null);
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrorMessage('Only CSV files are accepted.');
      return;
    }
    setSelectedFile(file);
    setValidationWarnings([]);
    setSuggestedFilename(null);
    setConfirmWarning(false);
    setShowValidationUI(false);
    setReadinessReport(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage(null);
    setUploadComplete(false);
    setUploadResult(null);
    setTrainingResult(null);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => { if (prev >= 90) { clearInterval(progressInterval); return 90; } return prev + 10; });
    }, 200);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (confirmWarning) formData.append('confirm_warning', 'true');
      if (suggestedFilename && confirmWarning) formData.append('suggested_filename', suggestedFilename);
      
      const res = await api.post('/data/upload-csv', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadComplete(true);
      setUploadResult({ record_count: res.data.record_count, sha256_hash: res.data.sha256_hash, filename: res.data.filename, id: res.data.id });
      fetchUploadHistory();
      setShowValidationUI(false);
      
      // Call Readiness Check (Analyze CSV)
      setIsAnalyzing(true);
      try {
        const analyzeRes = await api.post('/training/analyze-csv', { upload_id: res.data.id });
        setReadinessReport(analyzeRes.data.readiness_report);
      } catch (err) {
        console.error("Analysis failed", err);
      } finally {
        setIsAnalyzing(false);
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      if (err?.response?.status === 400 && err?.response?.data?.detail?.warnings) {
        setValidationWarnings(err.response.data.detail.warnings);
        setSuggestedFilename(err.response.data.detail.suggestion);
        setShowValidationUI(true);
        setErrorMessage(null);
      } else {
        setErrorMessage(err?.response?.data?.detail || 'Upload failed. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleRenameAndUpload = async () => {
    if (!selectedFile || !suggestedFilename) return;
    setConfirmWarning(true);
    // The actual upload will happen in the next tick or by calling handleUpload directly with params
    // But since handleUpload uses state, I'll update state and then call it
  };

  useEffect(() => {
    if (confirmWarning && selectedFile && showValidationUI) {
      handleUpload();
    }
  }, [confirmWarning]);

  const handleStartTraining = async (uploadId: string) => {
    setIsTraining(true);
    setErrorMessage(null);
    setTrainingResult(null); // Reset previous result
    
    try {
      const res = await api.post('/training/start', { upload_id: uploadId, epochs: 50, learning_rate: 0.001 });
      const jobId = res.data.id;
      
      // Start polling for this specific job
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await api.get(`/training/job/${jobId}`);
          const jobData = statusRes.data;
          
          if (jobData.status === 'completed' || jobData.status === 'failed') {
            clearInterval(pollInterval);
            setTrainingResult(jobData);
            setIsTraining(false);
            fetchTrainingJobs();
          }
        } catch (err) {
          clearInterval(pollInterval);
          setIsTraining(false);
        }
      }, 3000); // Poll every 3 seconds

    } catch (err: any) {
      setErrorMessage(err?.response?.data?.detail || 'Training failed.');
      setIsTraining(false);
    }
  };

  const handleSubmitForReview = async (jobId: string) => {
    setIsSubmitting(jobId);
    try {
      await api.post(`/training/${jobId}/submit-for-review`);
      fetchTrainingJobs();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.detail || 'Submit failed.');
    } finally {
      setIsSubmitting(null);
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'completed': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'submitted': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-100';
      case 'aggregated': return 'bg-purple-50 text-purple-700 border-purple-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <RoleGuard allowedRoles={['hospital', 'doctor']}>
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">Local Data <span className="text-blue-600">Upload & Training</span></h1>
          <p className="mt-1 text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
             <Upload size={14} className="text-blue-600" /> Upload → Train → Submit for Review
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Upload Zone */}
        <Card className="lg:col-span-7 border-none shadow-2xl shadow-slate-100">
          <CardHeader className="border-b border-slate-50 pb-5">
            <CardTitle className="text-xl font-black">Upload <span className="text-blue-600">Dataset</span></CardTitle>
            <CardDescription className="text-sm font-bold text-slate-400">CSV files with patient records</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            {errorMessage && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-700">
                <AlertCircle size={18} />
                <p className="text-sm font-bold">{errorMessage}</p>
                <button className="ml-auto" onClick={() => setErrorMessage(null)}><X size={14} /></button>
              </div>
            )}

            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.length) handleFileSelect(e.dataTransfer.files[0]); }}
              className={cn("border-2 border-dashed rounded-2xl p-10 text-center transition-all", isDragging ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50")}
            >
              <div className={cn("mx-auto h-14 w-14 rounded-2xl flex items-center justify-center mb-4 transition-all", isDragging ? "bg-blue-600 text-white scale-110" : "bg-slate-100 text-slate-400")}>
                <FileUp size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-1">{isDragging ? 'Release to upload' : 'Drag & drop your dataset'}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">CSV Only • Max 100MB</p>
              <Button variant="outline" className="border-2" onClick={() => fileInputRef.current?.click()}>Browse Files <FileText size={14} className="ml-2" /></Button>
              <input ref={fileInputRef} type="file" className="hidden" accept=".csv" onChange={(e) => { if (e.target.files?.length) handleFileSelect(e.target.files[0]); }} />
            </div>

            {/* Selected file */}
            {selectedFile && !uploadComplete && !showValidationUI && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 border border-blue-100">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-blue-600" />
                  <div>
                    <p className="text-sm font-black text-slate-900">{selectedFile.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}><X size={12} /></Button>
                  <Button size="sm" onClick={handleUpload} disabled={isUploading}>
                    {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} className="mr-1" />}
                    {isUploading ? `${uploadProgress}%` : 'Upload'}
                  </Button>
                </div>
              </div>
            )}

            {/* Validation Warnings UI (Section 12) */}
            {showValidationUI && selectedFile && (
              <div className="p-6 bg-red-50 border-2 border-red-200 rounded-2xl space-y-6 animate-in zoom-in-95 duration-200">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                    <AlertCircle size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-red-900 italic">Naming Convention Validation</h4>
                    <div className="mt-2 space-y-2">
                      {validationWarnings.map((w, i) => (
                        <p key={i} className="text-[10px] font-bold text-red-700 uppercase leading-relaxed">• {w}</p>
                      ))}
                    </div>
                  </div>
                </div>

                {suggestedFilename && (
                  <div className="bg-white p-4 rounded-xl border border-red-100 space-y-3">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Suggested Filename</p>
                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-[10px] text-slate-600">
                      {suggestedFilename}
                      <Button size="sm" className="h-7 bg-blue-600 hover:bg-blue-700 text-[9px]" onClick={() => { setConfirmWarning(true); }}>
                        Rename and Upload
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-red-100">
                   <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={confirmWarning} 
                        onChange={(e) => setConfirmWarning(e.target.checked)}
                        className="rounded border-red-200 text-red-600 focus:ring-red-500 h-4 w-4"
                      />
                      <span className="text-[10px] font-black text-red-900 uppercase tracking-widest group-hover:text-red-700 transition-colors">Confirm to proceed with current name</span>
                   </label>
                   <Button size="sm" variant="outline" className="h-8 border-red-200 text-red-700 hover:bg-red-100" onClick={() => setShowValidationUI(false)}>Cancel</Button>
                </div>
                
                {confirmWarning && !suggestedFilename && (
                  <Button className="w-full h-10 bg-red-600 hover:bg-red-700" onClick={handleUpload}>
                     Upload Anyway
                  </Button>
                )}
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Processing...</span>
                  <span className="text-[10px] font-black text-blue-600">{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            {/* Upload Complete → Start Training */}
            {uploadComplete && uploadResult && (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-xl space-y-3">
                  <div className="flex items-center gap-3 text-emerald-700">
                    <CheckCircle2 size={20} />
                    <div>
                      <p className="text-sm font-black">Upload verified & hash recorded</p>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{uploadResult.record_count.toLocaleString()} records stored</p>
                      <div className="mt-2 p-2 bg-emerald-100/50 rounded-lg border border-emerald-100 font-mono text-[8px] text-emerald-800 break-all">
                         <span className="font-black">SHA-256:</span> {uploadResult.sha256_hash}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Training Readiness Report (Section 12) */}
                {(isAnalyzing || readinessReport) && (
                  <div className="bg-slate-50 border border-slate-100 p-5 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Training Readiness</h4>
                      {isAnalyzing && <Loader2 size={12} className="animate-spin text-blue-600" />}
                    </div>

                    {readinessReport && (
                      <div className="space-y-3">
                        {readinessReport.errors.map((e: string, i: number) => (
                          <div key={i} className="flex gap-2 text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                            <X size={14} className="shrink-0 mt-0.5" />
                            <p className="text-[9px] font-bold leading-relaxed">{e}</p>
                          </div>
                        ))}
                        {readinessReport.warnings.map((w: string, i: number) => (
                          <div key={i} className="flex gap-2 text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100">
                            <AlertCircle size={14} className="shrink-0 mt-0.5" />
                            <p className="text-[9px] font-bold leading-relaxed">{w}</p>
                          </div>
                        ))}
                        {readinessReport.info.map((info: string, i: number) => (
                          <div key={i} className="flex gap-2 text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-100">
                            <BarChart3 size={14} className="shrink-0 mt-0.5" />
                            <p className="text-[9px] font-bold leading-relaxed">{info}</p>
                          </div>
                        ))}
                        {readinessReport.errors.length === 0 && readinessReport.warnings.length === 0 && (
                          <div className="flex gap-2 text-emerald-600 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                            <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                            <p className="text-[9px] font-bold leading-relaxed">System confirmed: Dataset is optimal for training.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Training trigger */}
                {!trainingResult && !isTraining && (
                  <div className={cn(
                    "p-5 rounded-xl transition-all",
                    readinessReport?.status === 'blocked' ? "bg-slate-100 opacity-50 grayscale" : "bg-blue-50 border border-blue-100"
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Brain size={20} className="text-blue-600" />
                        <div>
                          <p className="text-sm font-black text-slate-900">
                            {readinessReport?.status === 'blocked' ? 'Training Blocked' : 'Ready for Local Training'}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {readinessReport?.status === 'blocked' ? 'Critical errors detected' : '50 epochs • LR 0.001 • ε = 1.0'}
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleStartTraining(uploadResult.id)} 
                        className="shadow-lg shadow-blue-200"
                        disabled={readinessReport?.status === 'blocked'}
                      >
                         <Play size={14} className="mr-1" /> Start Training
                      </Button>
                    </div>
                  </div>
                )}

                {/* Training in progress */}
                {isTraining && !trainingResult && (
                  <div className="bg-blue-900 text-white p-6 rounded-xl space-y-4 animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Loader2 size={24} className="animate-spin text-blue-400" />
                        <div>
                          <p className="text-sm font-black">Neural Network Training...</p>
                          <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Executing background task</p>
                        </div>
                      </div>
                      <span className="bg-blue-800 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-700">In Progress</span>
                    </div>
                    <div className="h-2 bg-blue-800 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-400 rounded-full animate-progress-indeterminate w-1/3" />
                    </div>
                  </div>
                )}

                {/* Training result */}
                {trainingResult && (
                  <div className="bg-slate-900 text-white p-5 rounded-xl space-y-4">
                    <div className="flex items-center gap-3">
                      <Zap size={20} className="text-emerald-400" />
                      <div>
                        <p className="text-sm font-black">Training Complete</p>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Model weights generated with differential privacy</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                        <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Accuracy</p>
                        <p className="text-xl font-black text-emerald-400">{(parseFloat(trainingResult.accuracy || '0') * 100).toFixed(1)}%</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                        <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Loss</p>
                        <p className="text-xl font-black text-blue-400">{parseFloat(trainingResult.loss || '0').toFixed(4)}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                        <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Samples</p>
                        <p className="text-xl font-black text-white">{trainingResult.num_samples.toLocaleString()}</p>
                      </div>
                    </div>
                    <Button size="sm" className="w-full bg-amber-600 hover:bg-amber-700" onClick={() => handleSubmitForReview(trainingResult.id)}>
                      <Send size={14} className="mr-2" /> Submit for Admin Review
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Panel */}
        <div className="lg:col-span-5 space-y-8">
          {/* Privacy Info */}
          <Card className="border-none shadow-2xl shadow-slate-100 bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-12 text-white/5"><ShieldCheck size={200} /></div>
            <CardContent className="p-8 relative space-y-6">
              <h3 className="text-xl font-black italic">Privacy <span className="text-blue-400">Protocol</span></h3>
              <div className="space-y-4">
                {[
                  { label: 'Differential Privacy', desc: 'ε = 1.0 noise applied', icon: Shield },
                  { label: 'Data Anonymization', desc: 'PII auto-stripped on upload', icon: Lock },
                  { label: 'Blockchain Hash', desc: 'Immutable integrity proof', icon: Database },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <item.icon size={18} className="text-blue-400 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-white">{item.label}</p>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Training History */}
          <Card className="border-none shadow-2xl shadow-slate-100">
            <CardHeader className="border-b border-slate-50 pb-5">
              <CardTitle className="text-lg font-black">Training <span className="text-blue-600">History</span></CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {trainingJobs.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm font-bold text-slate-400">No training jobs yet.</p>
                    <p className="text-[10px] font-bold text-slate-300 mt-1">Upload a dataset and start training</p>
                  </div>
                ) : (
                  trainingJobs.map((job) => (
                    <div key={job.id} className="px-5 py-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <BarChart3 size={14} className="text-blue-600" />
                          <p className="text-[10px] font-black text-slate-900 truncate max-w-[150px]" title={job.source_filename || "Direct DB"}>
                            {job.source_filename || "Direct DB"}
                          </p>
                          <span className="text-slate-300 mx-1">•</span>
                          <p className="text-xs font-black text-slate-900">{job.epochs} ep • {job.num_samples.toLocaleString()} records</p>
                        </div>
                        <span className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border", statusColor(job.status))}>
                          {job.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-3">
                          <span className="text-[10px] font-bold text-slate-400">Acc: <span className="text-emerald-600 font-black">{job.accuracy ? (parseFloat(job.accuracy) * 100).toFixed(1) + '%' : '—'}</span></span>
                          <span className="text-[10px] font-bold text-slate-400">Loss: <span className="text-blue-600 font-black">{job.loss || '—'}</span></span>
                        </div>
                        <div className="flex gap-2">
                          {job.status === 'completed' && (
                            <Button size="sm" variant="outline" className="h-6 px-2 text-[8px] font-black uppercase" onClick={() => handleSubmitForReview(job.id)} disabled={isSubmitting === job.id}>
                              {isSubmitting === job.id ? <Loader2 size={10} className="animate-spin" /> : <><Send size={10} className="mr-1" /> Submit</>}
                            </Button>
                          )}
                          {job.review_notes && (
                            <span className="text-[9px] font-bold text-slate-400" title={job.review_notes}>💬 {job.review_notes.substring(0, 20)}...</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upload History */}
          <Card className="border-none shadow-2xl shadow-slate-100">
            <CardHeader className="border-b border-slate-50 pb-5">
              <CardTitle className="text-lg font-black">Upload <span className="text-blue-600">History</span></CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50 max-h-[200px] overflow-y-auto">
                {recentUploads.length === 0 ? (
                  <div className="p-6 text-center"><p className="text-sm font-bold text-slate-400">No uploads yet.</p></div>
                ) : (
                  recentUploads.map((upload) => (
                    <div key={upload.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText size={14} className="text-blue-600" />
                        <div>
                          <p className="text-xs font-black text-slate-900">{upload.filename}</p>
                          <p className="text-[10px] font-bold text-slate-400">{upload.record_count.toLocaleString()} records</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="h-6 px-2 text-[8px] font-black uppercase" onClick={() => handleStartTraining(upload.id)} disabled={isTraining}>
                        <Play size={10} className="mr-1" /> Train
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </RoleGuard>
  );
}
