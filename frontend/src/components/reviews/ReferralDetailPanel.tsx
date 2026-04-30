import React from 'react';
import { Referral } from '@/hooks/useReferrals';
import { X, MessageSquareWarning, FileText, FileSpreadsheet, Download, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { VitalStatusCard } from './VitalStatusCard';
import { AdminReviewForm } from './AdminReviewForm';

interface ReferralDetailPanelProps {
  referral: Referral;
  onClose: () => void;
  onSubmitReview: (review: { status: string; admin_notes: string; priority: string }) => Promise<void>;
}

export function ReferralDetailPanel({ referral, onClose, onSubmitReview }: ReferralDetailPanelProps) {
  const p = referral.patient;
  if (!p) return null;

  const getVitalStatus = (value: string | number, type: 'bp' | 'sugar' | 'hr' | 'temp') => {
    if (!value || value === 'N/A') return 'unknown';
    if (type === 'bp') {
      const sys = parseInt(String(value).split('/')[0]);
      if (sys > 160 || sys < 90) return 'critical';
      if (sys > 130) return 'warning';
      return 'normal';
    }
    if (type === 'sugar') {
      const s = parseInt(String(value));
      if (s > 200 || s < 70) return 'critical';
      if (s > 140) return 'warning';
      return 'normal';
    }
    if (type === 'hr') {
      const h = parseInt(String(value));
      if (h > 120 || h < 50) return 'critical';
      if (h > 100 || h < 60) return 'warning';
      return 'normal';
    }
    if (type === 'temp') {
      const t = parseFloat(String(value));
      if (t > 39 || t < 35) return 'critical';
      if (t > 37.5) return 'warning';
      return 'normal';
    }
    return 'unknown';
  };

  const getRiskScore = () => {
    const historyCount = p.medical_history?.length || 0;
    if (historyCount > 3) return 85;
    if (historyCount > 1) return 55;
    return 20;
  };

  const riskScore = getRiskScore();
  const riskLabel = riskScore > 60 ? 'HIGH' : riskScore > 30 ? 'MODERATE' : 'LOW';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex items-start justify-between p-6 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-10">
        <div>
          <h2 className="text-2xl font-black text-slate-900">{p.name}</h2>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">
            {p.patient_id_manual || p._id.slice(0,8)} • {p.gender} • {p.age} years
          </p>
          <p className="text-xs font-semibold text-slate-400 mt-2">
            Referred by Dr. {referral.sending_doctor.name} • {new Date(referral.created_at).toLocaleString()}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10 text-slate-400 hover:text-slate-700 hover:bg-slate-200">
          <X size={20} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Doctor Note */}
        {referral.notification.message && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-xl text-amber-900 shadow-sm relative">
            <MessageSquareWarning size={20} className="absolute top-5 right-5 text-amber-500/20" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">Note from Dr. {referral.sending_doctor.name}</h4>
            <p className="text-sm font-medium italic">"{referral.notification.message.split('Note: ')[1] || 'Review requested'}"</p>
          </div>
        )}

        {/* Vitals */}
        <section>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Vitals</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <VitalStatusCard label="Blood Pressure" value={p.blood_pressure} unit="mmHg" range="90-120/60-80" status={getVitalStatus(p.blood_pressure, 'bp')} />
            <VitalStatusCard label="Sugar Level" value={p.sugar_level} unit="mg/dL" range="70-140" status={getVitalStatus(p.sugar_level, 'sugar')} />
            <VitalStatusCard label="Heart Rate" value={p.heart_rate} unit="BPM" range="60-100" status={getVitalStatus(p.heart_rate, 'hr')} />
            <VitalStatusCard label="Temperature" value={p.temperature} unit="°C" range="36.5-37.5" status={getVitalStatus(p.temperature, 'temp')} />
          </div>
        </section>

        {/* Clinical Info */}
        <section className="bg-slate-50 p-6 rounded-xl border border-slate-100">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Clinical Info</h3>
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Current Symptoms</span>
              <p className="text-sm font-medium text-slate-700">{p.current_symptoms || 'None reported'}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Pre-existing Medical History</span>
              <div className="flex flex-wrap gap-2">
                {p.medical_history?.length > 0 ? p.medical_history.map((h: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600">{h}</span>
                )) : <span className="text-sm font-medium text-slate-400">None</span>}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Diagnosis Notes</span>
              <div className="bg-white p-4 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 whitespace-pre-wrap">
                {p.diagnosis_notes || 'No diagnosis notes provided.'}
              </div>
            </div>
          </div>
        </section>

        {/* Documents */}
        <section>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Documents</h3>
          <div className="space-y-3">
            {p.reports?.length > 0 ? p.reports.map((doc: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                    {doc.type?.includes('csv') || doc.type?.includes('excel') ? <FileSpreadsheet size={20} /> : <FileText size={20} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">{doc.filename}</p>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest"><Maximize2 size={14} className="mr-2" /> Preview</Button>
                  <Button size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest"><Download size={14} className="mr-2" /> Download</Button>
                </div>
              </div>
            )) : <p className="text-sm font-medium text-slate-400">No documents attached.</p>}
          </div>
        </section>

        {/* AI Risk Summary */}
        <section className="bg-slate-900 text-white p-6 rounded-2xl relative overflow-hidden">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">AI Risk Assessment</h3>
          
          <div className="flex flex-col gap-2 relative z-10">
            <span className="text-4xl font-black italic">{riskScore} <span className="text-xl text-slate-400">/ 100</span></span>
            <span className={`text-xs font-black tracking-[0.3em] uppercase ${riskScore > 60 ? 'text-red-400' : riskScore > 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {riskLabel} RISK
            </span>
          </div>

          <div className="mt-6 w-full h-3 bg-slate-800 rounded-full overflow-hidden relative z-10">
            <div 
              className={`h-full ${riskScore > 60 ? 'bg-gradient-to-r from-amber-500 to-red-500' : riskScore > 30 ? 'bg-gradient-to-r from-emerald-500 to-amber-500' : 'bg-emerald-500'}`} 
              style={{ width: `${riskScore}%` }} 
            />
          </div>

          {/* Decorative */}
          <div className="absolute -right-10 -bottom-10 text-white/5 pointer-events-none">
            <div className="text-[200px] font-black italic leading-none">{riskLabel[0]}</div>
          </div>
        </section>

        <AdminReviewForm referral={referral} onSubmit={onSubmitReview} />
      </div>
    </div>
  );
}
