import React from 'react';
import { Stethoscope, Heart, Thermometer, Droplets, Activity } from 'lucide-react';
import { VitalCard } from './VitalCard';
import { TagInput } from './TagInput';

interface Step2Props {
  formData: any;
  setFormData: (data: any) => void;
}

export const Step2MedicalStatus: React.FC<Step2Props> = ({ formData, setFormData }) => {
  const commonSymptoms = ["Fever", "Headache", "Chest pain", "Shortness of breath", "Fatigue", "Nausea"];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="border-b pb-4">
        <h3 className="text-xl font-black italic flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <Stethoscope size={18} />
          </div>
          Medical <span className="text-emerald-600">Status</span>
        </h3>
        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Record current vitals and clinical observations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <VitalCard 
          icon={Activity}
          label="Blood Pressure"
          value={formData.blood_pressure}
          onChange={(val) => setFormData({ ...formData, blood_pressure: val })}
          unit="mmHg"
          hint="120/80"
          color="red"
          placeholder="120/80"
        />
        <VitalCard 
          icon={Droplets}
          label="Sugar Level"
          value={formData.sugar_level}
          onChange={(val) => setFormData({ ...formData, sugar_level: val })}
          unit="mg/dL"
          hint="70–140"
          color="green"
          placeholder="110"
        />
        <VitalCard 
          icon={Heart}
          label="Heart Rate"
          value={formData.heart_rate}
          onChange={(val) => setFormData({ ...formData, heart_rate: val })}
          unit="BPM"
          hint="60–100"
          color="blue"
          placeholder="72"
        />
        <VitalCard 
          icon={Thermometer}
          label="Temperature"
          value={formData.temperature}
          onChange={(val) => setFormData({ ...formData, temperature: val })}
          unit="°C"
          hint="36.1–37.2"
          color="orange"
          placeholder="36.8"
        />
      </div>

      <div className="space-y-6">
        <TagInput 
          label="Current Symptoms"
          tags={formData.symptoms || []}
          setTags={(tags) => setFormData({ ...formData, symptoms: tags })}
          suggestions={commonSymptoms}
          placeholder="Add symptoms (e.g. Cough)..."
        />

        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Diagnosis Notes</label>
            <span className="text-[10px] font-bold text-slate-300">{formData.diagnosis_notes?.length || 0} / 1000</span>
          </div>
          <textarea 
            className="w-full h-32 p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all"
            value={formData.diagnosis_notes}
            onChange={(e) => setFormData({ ...formData, diagnosis_notes: e.target.value.slice(0, 1000) })}
            placeholder="Enter clinical observations, differential diagnosis, treatment plan..."
          />
        </div>
      </div>
    </div>
  );
};
