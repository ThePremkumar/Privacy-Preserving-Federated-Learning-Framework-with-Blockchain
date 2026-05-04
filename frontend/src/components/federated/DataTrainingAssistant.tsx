'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { 
  BrainCircuit, 
  Database, 
  FileText, 
  ShieldCheck, 
  ShieldAlert, 
  Filter, 
  Settings2, 
  Play, 
  ChevronRight, 
  ChevronLeft,
  Info,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Stethoscope,
  Building2,
  Calendar,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface AssistantProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'source' | 'privacy' | 'filters' | 'config' | 'review';

export const DataTrainingAssistant = ({ onClose, onSuccess }: AssistantProps) => {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('source');
  const [loading, setLoading] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  
  // Form State
  const [dataSource, setDataSource] = useState<'direct_db' | 'csv'>('direct_db');
  const [selectedUploadId, setSelectedUploadId] = useState<string>('');
  const [privacyMode, setPrivacyMode] = useState<'anonymized' | 'identified'>('anonymized');
  const [filters, setFilters] = useState({
    department_id: '',
    doctor_id: '',
    dateFrom: '',
    dateTo: '',
  });
  const [config, setConfig] = useState({
    epochs: 50,
    learningRate: 0.001,
    batchSize: 64,
    patience: 7,
    epsilon: 1.0,
    dropout: 0.3
  });
  const [confirmForce, setConfirmForce] = useState(false);

  const [uploads, setUploads] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);

  useEffect(() => {
    // Fetch data for selects
    const fetchData = async () => {
      try {
        const [upRes, deptRes, docRes] = await Promise.all([
          api.get('/data/my-uploads'),
          api.get('/orgs/'),
          api.get('/doctor/hospital-doctors')
        ]);
        setUploads(upRes.data);
        setDepartments(deptRes.data);
        setDoctors(docRes.data);
      } catch (err) {
        console.error('Failed to fetch assistant data', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    // Fetch preview count when source/filters change
    const fetchPreview = async () => {
      if (currentStep === 'config' || currentStep === 'review') {
        try {
          const res = await api.get('/training/preview-count', {
            params: {
              training_source: dataSource,
              upload_id: selectedUploadId,
              department_id: filters.department_id || undefined,
              doctor_id: filters.doctor_id || undefined
            }
          });
          setPreviewCount(res.data.count);
        } catch (err) {
          console.error('Preview count failed', err);
        }
      }
    };
    fetchPreview();
  }, [currentStep, dataSource, selectedUploadId, filters.department_id, filters.doctor_id]);

  const handleLaunch = async () => {
    setLoading(true);
    try {
      const endpoint = dataSource === 'direct_db' ? '/training/start-from-org-data' : '/training/start';
      await api.post(endpoint, {
        upload_id: dataSource === 'csv' ? selectedUploadId : undefined,
        department_id: filters.department_id ? parseInt(filters.department_id) : undefined,
        epochs: config.epochs,
        learning_rate: config.learningRate,
        batch_size: config.batchSize,
        patience: config.patience,
        training_source: dataSource,
        privacy_mode: privacyMode,
        epsilon: config.epsilon,
        doctor_id: filters.doctor_id || undefined,
        force: confirmForce
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert('Failed to launch training job. Check logs.');
    } finally {
      setLoading(false);
    }
  };



  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8 px-2">
      {(['source', 'privacy', 'filters', 'config', 'review'] as Step[]).map((s, i) => (
        <React.Fragment key={s}>
          <div className={cn(
            "flex flex-col items-center gap-2 transition-all",
            currentStep === s ? "opacity-100 scale-110" : "opacity-40"
          )}>
            <div className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center font-black text-xs border-2",
              currentStep === s ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200" : "bg-white border-slate-200 text-slate-400"
            )}>
              {i + 1}
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest">{s}</span>
          </div>
          {i < 4 && <div className="h-[2px] flex-1 bg-slate-100 mx-2" />}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <Card className="w-full max-w-3xl border-none shadow-2xl bg-white overflow-hidden flex flex-col max-h-[90vh]">
        <CardHeader className="bg-slate-900 text-white p-8 relative">
          <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
          <div className="flex items-center gap-4 mb-2">
            <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
              <BrainCircuit size={28} className="text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black italic tracking-tight">Data Training <span className="text-blue-400">Assistant</span></CardTitle>
              <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Prepare, Anonymize & Launch Training Jobs</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 flex-1 overflow-y-auto no-scrollbar">
          {renderStepIndicator()}

          {/* STEP 1: DATA SOURCE */}
          {currentStep === 'source' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-black italic text-slate-900">Choose <span className="text-blue-600">Data Source</span></h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className={cn(
                    "p-6 rounded-2xl border-2 transition-all cursor-pointer group",
                    dataSource === 'direct_db' ? "border-blue-600 bg-blue-50/50" : "border-slate-100 hover:border-blue-200"
                  )}
                  onClick={() => setDataSource('direct_db')}
                >
                  <Database size={32} className={cn("mb-4", dataSource === 'direct_db' ? "text-blue-600" : "text-slate-300")} />
                  <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-2">Option A: Direct Database</h4>
                  <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-wider">
                    Pull patient records directly from this node's live database. Auto-assembles a training-ready dataset.
                  </p>
                </div>
                <div 
                  className={cn(
                    "p-6 rounded-2xl border-2 transition-all cursor-pointer group",
                    dataSource === 'csv' ? "border-blue-600 bg-blue-50/50" : "border-slate-100 hover:border-blue-200"
                  )}
                  onClick={() => setDataSource('csv')}
                >
                  <FileText size={32} className={cn("mb-4", dataSource === 'csv' ? "text-blue-600" : "text-slate-300")} />
                  <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-2">Option B: Uploaded CSV</h4>
                  <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-wider">
                    Use any CSV file previously uploaded to the platform's dataset registry.
                  </p>
                </div>
              </div>

              {dataSource === 'csv' && (
                <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Dataset File</label>
                    {uploads.length === 0 && (
                      <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1">
                        <AlertCircle size={12} /> No uploads found
                      </span>
                    )}
                  </div>
                  
                  {uploads.length > 0 ? (
                    <select 
                      className="w-full h-12 rounded-xl bg-slate-50 border-2 border-slate-100 px-4 font-bold text-slate-700 outline-none focus:border-blue-600 transition-all"
                      value={selectedUploadId}
                      onChange={(e) => setSelectedUploadId(e.target.value)}
                    >
                      <option value="">Choose a CSV upload...</option>
                      {uploads.map(u => (
                        <option key={u.id} value={u.id}>{u.filename} ({u.record_count} rows)</option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center gap-3">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-relaxed">
                        You haven't uploaded any datasets yet. <br/>You need to upload a CSV before you can train on it.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-2 font-black uppercase tracking-widest text-[9px] h-9"
                        onClick={() => router.push('/dashboard/data-upload')}
                      >
                        <Play size={12} className="mr-2" /> Go to Local Data Upload
                      </Button>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* STEP 2: PRIVACY MODE */}
          {currentStep === 'privacy' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-black italic text-slate-900">Privacy <span className="text-blue-600">Mode</span></h3>
              <div className="grid grid-cols-1 gap-4">
                <div 
                  className={cn(
                    "p-6 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden",
                    privacyMode === 'anonymized' ? "border-blue-600 bg-blue-50/50" : "border-slate-100 hover:border-blue-200"
                  )}
                  onClick={() => setPrivacyMode('anonymized')}
                >
                  <div className="flex items-start gap-4">
                    <ShieldCheck size={32} className={cn(privacyMode === 'anonymized' ? "text-blue-600" : "text-slate-300")} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs">Mode 2: Anonymized</h4>
                        <span className="bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Recommended for Federated</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-wider">
                        Doctor identity (ID/Name) and patient identifiers are completely stripped. Safe for global federated aggregation across hospitals.
                      </p>
                      {privacyMode === 'anonymized' && (
                        <div className="mt-4 flex items-center gap-2 text-blue-600 animate-in fade-in slide-in-from-left-2">
                           <CheckCircle2 size={14} />
                           <span className="text-[9px] font-black uppercase tracking-widest">Identities will be stripped</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div 
                  className={cn(
                    "p-6 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden",
                    privacyMode === 'identified' ? "border-amber-600 bg-amber-50/50" : "border-slate-100 hover:border-blue-200"
                  )}
                  onClick={() => setPrivacyMode('identified')}
                >
                  <div className="flex items-start gap-4">
                    <ShieldAlert size={32} className={cn(privacyMode === 'identified' ? "text-amber-600" : "text-slate-300")} />
                    <div className="flex-1">
                      <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-1">Mode 1: Include Doctor Name</h4>
                      <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-wider">
                        Doctor ID and name columns are retained. Suitable for internal audits or department-level analysis only.
                      </p>
                      {privacyMode === 'identified' && (
                        <div className="mt-4 flex items-center gap-2 text-amber-600 animate-in fade-in slide-in-from-left-2">
                           <AlertCircle size={14} />
                           <span className="text-[9px] font-black uppercase tracking-widest">Warning: Cannot be used for federated aggregation</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: FILTERS */}
          {currentStep === 'filters' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
               <h3 className="text-xl font-black italic text-slate-900">Refine <span className="text-blue-600">Dataset</span></h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Building2 size={12} /> Department</label>
                     <select 
                        className="w-full h-12 rounded-xl bg-slate-50 border-2 border-slate-100 px-4 font-bold text-slate-700 outline-none focus:border-blue-600 transition-all"
                        value={filters.department_id}
                        onChange={(e) => setFilters(prev => ({ ...prev, department_id: e.target.value }))}
                     >
                        <option value="">All Departments</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Calendar size={12} /> Date Range</label>
                     <div className="flex items-center gap-2">
                        <input type="date" className="flex-1 h-12 rounded-xl bg-slate-50 border-2 border-slate-100 px-4 font-bold text-[10px] uppercase text-slate-700 outline-none" />
                        <span className="text-slate-300 text-xs">—</span>
                        <input type="date" className="flex-1 h-12 rounded-xl bg-slate-50 border-2 border-slate-100 px-4 font-bold text-[10px] uppercase text-slate-700 outline-none" />
                     </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Stethoscope size={12} /> Specific Doctor</label>
                     <select 
                        className="w-full h-12 rounded-xl bg-slate-50 border-2 border-slate-100 px-4 font-bold text-slate-700 outline-none focus:border-blue-600 transition-all"
                        value={filters.doctor_id}
                        onChange={(e) => setFilters(prev => ({ ...prev, doctor_id: e.target.value }))}
                     >
                        <option value="">All Doctors</option>
                        {doctors.map(d => (
                          <option key={d.id} value={d.id}>{d.username}</option>
                        ))}
                     </select>
                  </div>
               </div>
            </div>
          )}

          {/* STEP 4: CONFIGURATION */}
          {currentStep === 'config' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
               <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black italic text-slate-900">Training <span className="text-blue-600">Parameters</span></h3>
                  <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                     <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                        <Filter size={12} /> {previewCount !== null ? `${previewCount} Records Found` : 'Calculating...'}
                     </span>
                  </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Epochs</label>
                     <input 
                        type="number" 
                        value={config.epochs}
                        onChange={(e) => setConfig(prev => ({ ...prev, epochs: parseInt(e.target.value) }))}
                        className="w-full h-12 rounded-xl bg-slate-50 border-2 border-slate-100 px-4 font-black text-slate-900 outline-none" 
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Learning Rate</label>
                     <input 
                        type="number" 
                        step="0.0001"
                        value={config.learningRate}
                        onChange={(e) => setConfig(prev => ({ ...prev, learningRate: parseFloat(e.target.value) }))}
                        className="w-full h-12 rounded-xl bg-slate-50 border-2 border-slate-100 px-4 font-black text-slate-900 outline-none" 
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Batch Size</label>
                     <input 
                        type="number" 
                        value={config.batchSize}
                        onChange={(e) => setConfig(prev => ({ ...prev, batchSize: parseInt(e.target.value) }))}
                        className="w-full h-12 rounded-xl bg-slate-50 border-2 border-slate-100 px-4 font-black text-slate-900 outline-none" 
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Privacy ε</label>
                     <input 
                        type="number" 
                        step="0.1"
                        value={config.epsilon}
                        onChange={(e) => setConfig(prev => ({ ...prev, epsilon: parseFloat(e.target.value) }))}
                        className="w-full h-12 rounded-xl bg-slate-50 border-2 border-slate-100 px-4 font-black text-slate-900 outline-none" 
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dropout</label>
                     <input 
                        type="number" 
                        step="0.1"
                        value={config.dropout}
                        onChange={(e) => setConfig(prev => ({ ...prev, dropout: parseFloat(e.target.value) }))}
                        className="w-full h-12 rounded-xl bg-slate-50 border-2 border-slate-100 px-4 font-black text-slate-900 outline-none" 
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Patience</label>
                     <input 
                        type="number" 
                        value={config.patience}
                        onChange={(e) => setConfig(prev => ({ ...prev, patience: parseInt(e.target.value) }))}
                        className="w-full h-12 rounded-xl bg-slate-50 border-2 border-slate-100 px-4 font-black text-slate-900 outline-none" 
                     />
                  </div>
               </div>

               {previewCount !== null && previewCount < 100 && (
                 <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="text-amber-600 mt-1" size={20} />
                    <div>
                       <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Low Record Count Warning</p>
                       <p className="text-[9px] font-bold text-amber-700 uppercase mt-1 leading-relaxed">
                          Only {previewCount} records match your criteria. Datasets under 100 records may produce unstable models or poor accuracy. Proceed with caution.
                       </p>
                    </div>
                 </div>
               )}
            </div>
          )}

          {/* STEP 5: REVIEW */}
          {currentStep === 'review' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
               <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black italic text-slate-900">Final <span className="text-blue-600">Review</span></h3>
                  {dataSource === 'csv' && selectedUploadId && (() => {
                    const suspiciousKeywords = ["COVID", "nursing_home", "CMS", "census", "billing_only"];
                    const upload = uploads.find(u => u.id === selectedUploadId);
                    if (!upload) return null;
                    const filename = upload.filename.toUpperCase();
                    const orgType = user?.hospital?.organization_type?.toUpperCase() || "";
                    
                    let foundKeyword = "";
                    const isSuspicious = suspiciousKeywords.some(kw => {
                      if (filename.includes(kw.toUpperCase())) {
                        if (orgType.includes(kw.toUpperCase())) return false;
                        foundKeyword = kw;
                        return true;
                      }
                      return false;
                    });

                    if (isSuspicious) {
                      return (
                        <div className="px-4 py-2 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 animate-pulse">
                          <AlertCircle className="text-red-600" size={14} />
                          <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Unrelated Dataset Flagged</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <div className="space-y-1">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Data Source</span>
                        <div className="flex items-center gap-2 text-slate-900 font-black italic">
                           <Database size={16} /> {dataSource === 'direct_db' ? 'Direct Database Export' : `CSV Upload: ${uploads.find(u => u.id === selectedUploadId)?.filename}`}
                        </div>
                     </div>
                     <div className="space-y-1">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Privacy Mode</span>
                        <div className={cn(
                           "flex items-center gap-2 font-black italic",
                           privacyMode === 'anonymized' ? "text-blue-600" : "text-amber-600"
                        )}>
                           {privacyMode === 'anonymized' ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />} 
                           {privacyMode === 'anonymized' ? 'Anonymized (No PII)' : 'Identified (Incl. Doctors)'}
                        </div>
                     </div>
                     <div className="space-y-1">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Target Volume</span>
                        <div className="flex items-center gap-2 text-slate-900 font-black italic">
                           <Info size={16} /> {previewCount} Training Records
                        </div>
                     </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Config Summary</h4>
                     <div className="grid grid-cols-2 gap-y-3">
                        <div className="flex flex-col">
                           <span className="text-[8px] font-black text-slate-400 uppercase">Epochs</span>
                           <span className="text-sm font-black text-slate-900 italic">{config.epochs}</span>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[8px] font-black text-slate-400 uppercase">Learning Rate</span>
                           <span className="text-sm font-black text-slate-900 italic">{config.learningRate}</span>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[8px] font-black text-slate-400 uppercase">Epsilon ε</span>
                           <span className="text-sm font-black text-slate-900 italic">{config.epsilon}</span>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[8px] font-black text-slate-400 uppercase">Batch Size</span>
                           <span className="text-sm font-black text-slate-900 italic">{config.batchSize}</span>
                        </div>
                     </div>
                  </div>
               </div>

               {privacyMode === 'anonymized' ? (
                 <div className="p-6 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-200 flex items-center justify-between">
                    <div className="space-y-1">
                       <p className="text-sm font-black italic">Safety Check Passed</p>
                       <p className="text-[9px] font-bold uppercase tracking-widest opacity-80">This dataset is safe for global federated submission.</p>
                    </div>
                    <Lock size={32} className="opacity-20" />
                 </div>
               ) : (
                 <div className="p-6 bg-amber-600 text-white rounded-2xl shadow-xl shadow-amber-200 flex items-center justify-between">
                    <div className="space-y-1">
                       <p className="text-sm font-black italic">Federation Restricted</p>
                       <p className="text-[9px] font-bold uppercase tracking-widest opacity-80">This dataset cannot be submitted for global aggregation.</p>
                    </div>
                    <ShieldAlert size={32} className="opacity-20" />
                 </div>
               )}

               {dataSource === 'csv' && selectedUploadId && (() => {
                  const suspiciousKeywords = ["COVID", "nursing_home", "CMS", "census", "billing_only"];
                  const upload = uploads.find(u => u.id === selectedUploadId);
                  if (!upload) return null;
                  const filename = upload.filename.toUpperCase();
                  const orgType = user?.hospital?.organization_type?.toUpperCase() || "HOSPITAL";
                  
                  const isSuspicious = suspiciousKeywords.some(kw => {
                    if (filename.includes(kw.toUpperCase())) {
                      if (orgType.includes(kw.toUpperCase())) return false;
                      return true;
                    }
                    return false;
                  });

                  if (isSuspicious) {
                    return (
                      <div className="p-6 bg-red-50 border-2 border-red-200 rounded-2xl space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                            <ShieldAlert size={24} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-red-900 italic">Dataset Specialty Mismatch</p>
                            <p className="text-[10px] font-bold text-red-700 uppercase mt-1 leading-relaxed">
                              Warning: The selected dataset filename does not match this node's organization type ({orgType}). 
                              Clinical models should not be trained on administrative or unrelated datasets.
                            </p>
                          </div>
                        </div>
                        <label className="flex items-center gap-3 p-4 bg-white rounded-xl border border-red-100 cursor-pointer hover:bg-red-50 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={confirmForce}
                            onChange={(e) => setConfirmForce(e.target.checked)}
                            className="h-5 w-5 rounded border-red-200 text-red-600 focus:ring-red-500"
                          />
                          <span className="text-[10px] font-black text-red-900 uppercase tracking-widest">Confirm this is the correct file before proceeding</span>
                        </label>
                      </div>
                    );
                  }
                  return null;
               })()}
            </div>
          )}
        </CardContent>

        <CardHeader className="border-t border-slate-100 p-8 bg-slate-50/50 flex flex-row items-center justify-between">
           <div className="flex gap-3">
              {currentStep !== 'source' && (
                <Button 
                  variant="outline" 
                  className="h-12 px-6 border-2 font-black uppercase tracking-widest text-[10px]"
                  onClick={() => {
                    const steps: Step[] = ['source', 'privacy', 'filters', 'config', 'review'];
                    setCurrentStep(steps[steps.indexOf(currentStep) - 1]);
                  }}
                >
                  <ChevronLeft size={16} className="mr-2" /> Back
                </Button>
              )}
              <Button 
                variant="ghost" 
                className="h-12 px-6 text-slate-400 hover:text-slate-900 font-black uppercase tracking-widest text-[10px]"
                onClick={onClose}
              >
                Cancel
              </Button>
           </div>
           
           <div className="flex gap-3">
              {currentStep === 'review' ? (
                <Button 
                  className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200 font-black uppercase tracking-widest text-[10px]"
                  onClick={handleLaunch}
                  disabled={loading || (previewCount !== null && previewCount === 0) || (dataSource === 'csv' && (() => {
                    const suspiciousKeywords = ["COVID", "nursing_home", "CMS", "census", "billing_only"];
                    const upload = uploads.find(u => u.id === selectedUploadId);
                    if (!upload) return false;
                    const filename = upload.filename.toUpperCase();
                    const orgType = user?.hospital?.organization_type?.toUpperCase() || "HOSPITAL";
                    return suspiciousKeywords.some(kw => filename.includes(kw.toUpperCase()) && !orgType.includes(kw.toUpperCase()));
                  })() && !confirmForce)}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <><Play size={16} className="mr-2" /> Launch Training</>}
                </Button>
              ) : (
                <Button 
                  className="h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-200 font-black uppercase tracking-widest text-[10px]"
                  onClick={() => {
                    const steps: Step[] = ['source', 'privacy', 'filters', 'config', 'review'];
                    setCurrentStep(steps[steps.indexOf(currentStep) + 1]);
                  }}
                  disabled={currentStep === 'source' && dataSource === 'csv' && !selectedUploadId}
                >
                  Continue <ChevronRight size={16} className="ml-2" />
                </Button>
              )}
           </div>
        </CardHeader>
      </Card>
    </div>
  );
};
