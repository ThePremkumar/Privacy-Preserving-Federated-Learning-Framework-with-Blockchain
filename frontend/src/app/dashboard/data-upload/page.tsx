'use client';

import React, { useState } from 'react';
import {
  Upload,
  FileUp,
  Shield,
  ShieldCheck,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileText,
  BarChart3,
  Lock,
  Zap,
  Activity,
  X,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { useAuth } from '@/hooks/useAuth';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const recentUploads = [
  { name: 'patient_vitals_feb_2024.csv', records: '2,480', date: 'Feb 28, 2024', hash: '0x7f3d...a8b2', status: 'Verified' },
  { name: 'lab_results_jan_2024.csv', records: '1,820', date: 'Jan 31, 2024', hash: '0x4e2c...d1f9', status: 'Verified' },
  { name: 'clinical_notes_dec.json', records: '942', date: 'Dec 15, 2023', hash: '0x8a1b...e3c4', status: 'Verified' },
];

export default function DataUploadPage() {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const handleSimulateUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setUploadComplete(true);
          setTimeout(() => { setUploadComplete(false); setSelectedFile(null); }, 3000);
          return 100;
        }
        return prev + 5;
      });
    }, 120);
  };

  return (
    <RoleGuard allowedRoles={['hospital']}>
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">Local Data <span className="text-blue-600">Upload</span></h1>
          <p className="mt-1 text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
             <Upload size={14} className="text-blue-600" /> Secure Dataset Submission for Federated Training
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Upload Zone */}
        <Card className="lg:col-span-7 border-none shadow-2xl shadow-slate-100">
          <CardHeader className="border-b border-slate-50 pb-5">
            <CardTitle className="text-xl font-black">Upload <span className="text-blue-600">Dataset</span></CardTitle>
            <CardDescription className="text-sm font-bold text-slate-400">CSV or JSON files with patient records</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); setSelectedFile('patient_data_march_2024.csv'); }}
              className={cn(
                "border-2 border-dashed rounded-2xl p-12 text-center transition-all",
                isDragging ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
              )}
            >
              <div className={cn(
                "mx-auto h-16 w-16 rounded-2xl flex items-center justify-center mb-6 transition-all",
                isDragging ? "bg-blue-600 text-white scale-110" : "bg-slate-100 text-slate-400"
              )}>
                <FileUp size={32} />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">
                {isDragging ? 'Release to upload' : 'Drag & drop your dataset'}
              </h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">CSV, JSON • Max 100MB • PII auto-anonymized</p>
              <Button variant="outline" className="border-2" onClick={() => setSelectedFile('custom_dataset.csv')}>
                Browse Files <FileText size={14} className="ml-2" />
              </Button>
            </div>

            {/* Selected file indicator */}
            {selectedFile && (
              <div className="flex items-center justify-between p-5 rounded-xl bg-blue-50 border border-blue-100">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-blue-600" />
                  <div>
                    <p className="text-sm font-black text-slate-900">{selectedFile}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ready to process</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelectedFile(null)}>
                    <X size={12} />
                  </Button>
                  <Button size="sm" onClick={handleSimulateUpload} disabled={isUploading}>
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
                <div className="flex gap-4">
                  {uploadProgress > 20 && <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1"><CheckCircle2 size={10} /> Validated</span>}
                  {uploadProgress > 50 && <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1"><Lock size={10} /> Encrypted</span>}
                  {uploadProgress > 80 && <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1"><ShieldCheck size={10} /> Hashed</span>}
                </div>
              </div>
            )}

            {uploadComplete && (
              <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-xl flex items-center gap-3 text-emerald-700">
                <CheckCircle2 size={20} />
                <div>
                  <p className="text-sm font-black">Upload verified & blockchain hash recorded</p>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Data integrity proof stored on-chain</p>
                </div>
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

          {/* Upload History */}
          <Card className="border-none shadow-2xl shadow-slate-100">
            <CardHeader className="border-b border-slate-50 pb-5">
              <CardTitle className="text-lg font-black">Upload <span className="text-blue-600">History</span></CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {recentUploads.map((upload, i) => (
                  <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                        <FileText size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900">{upload.name}</p>
                        <p className="text-[10px] font-bold text-slate-400">{upload.records} records • {upload.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-mono text-slate-400">{upload.hash}</span>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[8px] font-black uppercase tracking-widest border border-emerald-100">{upload.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </RoleGuard>
  );
}
