import React from 'react';
import { ClipboardList, UploadCloud, FileText, FileJson, X } from 'lucide-react';
import { TagInput } from './TagInput';

interface Step3Props {
  formData: any;
  setFormData: (data: any) => void;
  reportFile: File | null;
  setReportFile: (file: File | null) => void;
  datasetFile: File | null;
  setDatasetFile: (file: File | null) => void;
}

export const Step3Documentation: React.FC<Step3Props> = ({ 
  formData, setFormData, reportFile, setReportFile, datasetFile, setDatasetFile 
}) => {
  const commonHistory = ["Diabetes", "Hypertension", "Asthma", "Heart disease", "Thyroid disorder", "Kidney disease"];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="border-b pb-4">
        <h3 className="text-xl font-black italic flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
            <ClipboardList size={18} />
          </div>
          Records & <span className="text-purple-600">History</span>
        </h3>
        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Attach documents and pre-existing conditions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Attached Documentation</h4>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Medical Report (PDF / Scan)</label>
            {!reportFile ? (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer group">
                <UploadCloud size={24} className="text-slate-300 group-hover:text-blue-500 mb-2" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Drag & drop or click to upload</span>
                <span className="text-[8px] font-bold text-slate-300 mt-1">PDF, JPG, PNG — MAX 10MB</span>
                <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => setReportFile(e.target.files?.[0] || null)} />
              </label>
            ) : (
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 truncate max-w-[150px]">{reportFile.name}</p>
                    <p className="text-[10px] font-bold text-slate-400">{(reportFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button type="button" onClick={() => setReportFile(null)} className="h-8 w-8 rounded-full hover:bg-white flex items-center justify-center text-slate-400 hover:text-red-500 transition-all">
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical Dataset (CSV / JSON)</label>
            {!datasetFile ? (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer group">
                <UploadCloud size={24} className="text-slate-300 group-hover:text-blue-500 mb-2" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Drag & drop or click to upload</span>
                <span className="text-[8px] font-bold text-slate-300 mt-1">CSV, JSON ONLY</span>
                <input type="file" className="hidden" accept=".csv,.json" onChange={(e) => setDatasetFile(e.target.files?.[0] || null)} />
              </label>
            ) : (
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm">
                    <FileJson size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 truncate max-w-[150px]">{datasetFile.name}</p>
                    <p className="text-[10px] font-bold text-slate-400">{(datasetFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button type="button" onClick={() => setDatasetFile(null)} className="h-8 w-8 rounded-full hover:bg-white flex items-center justify-center text-slate-400 hover:text-red-500 transition-all">
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Pre-existing History</h4>
          <TagInput 
            label="History Items"
            tags={formData.medical_history || []}
            setTags={(tags) => setFormData({ ...formData, medical_history: tags })}
            suggestions={commonHistory}
            placeholder="Add conditions (e.g. Asthma)..."
          />

          <div className="p-6 bg-slate-900 rounded-2xl text-white space-y-4">
             <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <ClipboardList size={16} className="text-blue-400" />
                <span className="text-xs font-black italic uppercase tracking-widest">Registration Summary</span>
             </div>
             <div className="space-y-2 text-[11px] font-medium text-white/70">
                <p><span className="text-blue-400 font-bold">Name:</span> {formData.name || '—'} · <span className="text-blue-400 font-bold">Age:</span> {formData.age || '—'} · <span className="text-blue-400 font-bold">Gender:</span> {formData.gender}</p>
                <p><span className="text-blue-400 font-bold">Vitals:</span> BP: {formData.blood_pressure || '—'} · HR: {formData.heart_rate || '—'} · Temp: {formData.temperature || '—'}</p>
                <p><span className="text-blue-400 font-bold">Symptoms:</span> {(formData.symptoms || []).join(', ') || 'None'}</p>
                <p><span className="text-blue-400 font-bold">History:</span> {(formData.medical_history || []).join(', ') || 'None'}</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
