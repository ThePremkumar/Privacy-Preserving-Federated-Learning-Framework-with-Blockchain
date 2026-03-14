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
      const res = await api.post('/data/upload-csv', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadComplete(true);
      setUploadResult({ record_count: res.data.record_count, sha256_hash: res.data.sha256_hash, filename: res.data.filename, id: res.data.id });
      fetchUploadHistory();
    } catch (err: any) {
      clearInterval(progressInterval);
      setErrorMessage(err?.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleStartTraining = async (uploadId: string) => {
    setIsTraining(true);
    setErrorMessage(null);
    try {
      const res = await api.post('/training/start', { upload_id: uploadId, epochs: 3, learning_rate: 0.001 });
      setTrainingResult(res.data);
      fetchTrainingJobs();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.detail || 'Training failed.');
    } finally {
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
            {selectedFile && !uploadComplete && (
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
                    </div>
                  </div>
                </div>

                {/* Training trigger */}
                {!trainingResult && (
                  <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Brain size={20} className="text-blue-600" />
                        <div>
                          <p className="text-sm font-black text-slate-900">Ready for Local Training</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">3 epochs • LR 0.001 • ε = 1.0</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleStartTraining(uploadResult.id)} disabled={isTraining} className="shadow-lg shadow-blue-200">
                        {isTraining ? <><Loader2 size={14} className="animate-spin mr-1" /> Training...</> : <><Play size={14} className="mr-1" /> Start Training</>}
                      </Button>
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
                          <p className="text-xs font-black text-slate-900">{job.epochs} epochs • {job.num_samples.toLocaleString()} samples</p>
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
