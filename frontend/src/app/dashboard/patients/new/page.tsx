'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  CheckCircle2, 
  Loader2,
  Lock,
  UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { Step1Identification } from '@/components/patients/Step1Identification';
import { Step2MedicalStatus } from '@/components/patients/Step2MedicalStatus';
import { Step3Documentation } from '@/components/patients/Step3Documentation';
import api from '@/lib/api';
import { RoleGuard } from '@/components/guards/RoleGuard';

export default function RegisterPatientPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    patient_id_manual: '',
    age: '',
    gender: 'Male',
    phone: '',
    address: '',
    symptoms: [],
    diagnosis_notes: '',
    blood_pressure: '',
    sugar_level: '',
    heart_rate: '',
    temperature: '',
    medical_history: []
  });

  const [reportFile, setReportFile] = useState<File | null>(null);
  const [datasetFile, setDatasetFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<any>({});

  const validateStep = (step: number) => {
    const newErrors: any = {};
    if (step === 1) {
      if (!formData.name) newErrors.name = "Full Name is required";
      if (!formData.age) newErrors.age = "Age is required";
      if (!formData.patient_id_manual) newErrors.patient_id_manual = "Patient ID is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSaveDraft = () => {
    localStorage.setItem('patient_form_draft', JSON.stringify(formData));
    alert('Progress saved to local draft');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Create Patient
      const res = await api.post('/patients/', {
        ...formData,
        age: parseInt(formData.age),
        heart_rate: formData.heart_rate ? parseInt(formData.heart_rate) : undefined,
        temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
        current_symptoms: formData.symptoms.join(', '),
      });
      
      const patientId = res.data.id;

      // 2. Upload Files if any
      if (reportFile) {
        const reportData = new FormData();
        reportData.append('file', reportFile);
        await api.post(`/patients/${patientId}/upload-report`, reportData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (datasetFile) {
        const datasetData = new FormData();
        datasetData.append('file', datasetFile);
        await api.post('/data/upload-csv', datasetData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      router.push('/dashboard/patients');
      // In a real app we'd use a toast here
      alert('Patient registered successfully');
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.detail || 'Failed to register patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / 3) * 100;

  return (
    <RoleGuard allowedRoles={['doctor', 'hospital']}>
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()} className="text-slate-400 font-bold hover:text-slate-900">
            <ArrowLeft size={16} className="mr-2" /> Back to Patients
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step {currentStep} of 3</span>
            <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center px-4">
          {[
            { step: 1, label: 'Identification' },
            { step: 2, label: 'Medical Status' },
            { step: 3, label: 'Documentation' }
          ].map((s) => (
            <div key={s.step} className="flex flex-col items-center gap-2">
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                currentStep > s.step ? "bg-emerald-500 border-emerald-500 text-white" :
                currentStep === s.step ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100" :
                "bg-white border-slate-200 text-slate-300"
              )}>
                {currentStep > s.step ? <CheckCircle2 size={20} /> : <span className="text-xs font-black">{s.step}</span>}
              </div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest",
                currentStep === s.step ? "text-blue-600" : "text-slate-400"
              )}>{s.label}</span>
            </div>
          ))}
          {/* Connecting Lines */}
          <div className="absolute left-1/2 top-0 h-1 w-full bg-slate-100 -z-10" />
        </div>

        <Card className="border-none shadow-2xl shadow-slate-200/60 overflow-hidden">
          <div className="p-10">
            {currentStep === 1 && <Step1Identification formData={formData} setFormData={setFormData} errors={errors} />}
            {currentStep === 2 && <Step2MedicalStatus formData={formData} setFormData={setFormData} />}
            {currentStep === 3 && (
              <Step3Documentation 
                formData={formData} 
                setFormData={setFormData} 
                reportFile={reportFile}
                setReportFile={setReportFile}
                datasetFile={datasetFile}
                setDatasetFile={setDatasetFile}
              />
            )}
          </div>

          <div className="p-8 border-t bg-slate-50/50 flex items-center justify-between">
            <div>
              {currentStep > 1 && (
                <Button variant="ghost" onClick={handleBack} className="h-12 px-8 font-black uppercase tracking-widest text-[10px] text-slate-400">
                  <ChevronLeft size={16} className="mr-2" /> Previous Step
                </Button>
              )}
            </div>
            
            <div className="flex gap-4">
              {currentStep < 3 ? (
                <>
                  <Button variant="outline" onClick={handleSaveDraft} className="h-12 px-8 font-black uppercase tracking-widest text-[10px]">
                    Save as Draft
                  </Button>
                  <Button onClick={handleNext} className="h-12 px-10 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-200">
                    Next Step <ChevronRight size={16} className="ml-2" />
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className="h-12 px-12 bg-blue-700 hover:bg-blue-800 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-200"
                >
                  {isSubmitting ? (
                    <><Loader2 size={16} className="animate-spin mr-2" /> Registering...</>
                  ) : (
                    <><Lock size={14} className="mr-2" /> Register Patient ✓</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </Card>

        <div className="p-8 bg-blue-50 rounded-3xl border border-blue-100 flex items-center gap-6">
          <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100">
            <UserPlus size={24} />
          </div>
          <div>
            <h4 className="text-sm font-black text-blue-900">Patient Data Protection Notice</h4>
            <p className="text-[10px] font-bold text-blue-700/60 uppercase tracking-widest">All clinical entries are encrypted and stored in compliance with privacy-preserving protocols.</p>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}

