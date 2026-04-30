import React from 'react';
import { User, Smartphone, MapPin, Hash, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step1Props {
  formData: any;
  setFormData: (data: any) => void;
  errors: any;
}

export const Step1Identification: React.FC<Step1Props> = ({ formData, setFormData, errors }) => {
  const generatePatientId = () => {
    const id = `PAT-${Math.floor(1000 + Math.random() * 9000)}`;
    setFormData({ ...formData, patient_id_manual: id });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="border-b pb-4">
        <h3 className="text-xl font-black italic flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
            <User size={18} />
          </div>
          Patient <span className="text-blue-600">Identification</span>
        </h3>
        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Enter the patient's personal and contact details</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</label>
          <input 
            className={cn(
              "w-full h-12 px-4 bg-slate-50 border rounded-xl text-sm font-bold transition-all focus:ring-4 focus:ring-blue-100 focus:outline-none",
              errors.name ? "border-red-500" : "border-slate-100"
            )}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Ravi Kumar"
          />
          {errors.name && <p className="text-[10px] font-bold text-red-500">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Patient ID</label>
              <button 
                type="button" 
                onClick={generatePatientId}
                className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:underline"
              >
                <Sparkles size={10} /> Auto-generate
              </button>
            </div>
            <input 
              className={cn(
                "w-full h-12 px-4 bg-slate-50 border rounded-xl text-sm font-bold transition-all focus:ring-4 focus:ring-blue-100 focus:outline-none",
                errors.patient_id_manual ? "border-red-500" : "border-slate-100"
              )}
              value={formData.patient_id_manual}
              onChange={(e) => setFormData({ ...formData, patient_id_manual: e.target.value })}
              placeholder="PAT-0000"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Age</label>
            <input 
              type="number"
              className={cn(
                "w-full h-12 px-4 bg-slate-50 border rounded-xl text-sm font-bold transition-all focus:ring-4 focus:ring-blue-100 focus:outline-none",
                errors.age ? "border-red-500" : "border-slate-100"
              )}
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              placeholder="e.g. 45"
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gender</label>
          <div className="flex gap-4">
            {['Male', 'Female', 'Other'].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setFormData({ ...formData, gender: g })}
                className={cn(
                  "flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all",
                  formData.gender === g 
                    ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100" 
                    : "bg-white border-slate-100 text-slate-400 hover:border-blue-200"
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Number</label>
          <div className="relative">
            <Smartphone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
            <input 
              className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-100 focus:outline-none"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 00000 00000"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Home Address</label>
          <div className="relative">
            <MapPin size={16} className="absolute left-4 top-4 text-slate-300" />
            <textarea 
              className="w-full h-24 pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-100 focus:outline-none"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter full residential address..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};
