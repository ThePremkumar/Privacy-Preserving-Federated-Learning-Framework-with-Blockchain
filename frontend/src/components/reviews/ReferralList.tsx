import React from 'react';
import { cn } from '@/lib/utils';
import { Referral } from '@/hooks/useReferrals';

interface ReferralListProps {
  referrals: Referral[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ReferralList({ referrals, selectedId, onSelect }: ReferralListProps) {
  
  const getRiskScore = (patient: any) => {
    // Basic mock logic based on medical history
    if (!patient) return 0;
    const historyCount = patient.medical_history?.length || 0;
    if (historyCount > 3) return 85;
    if (historyCount > 1) return 55;
    return 20;
  };

  const getRiskLabel = (score: number) => {
    if (score > 60) return { label: 'HIGH', color: 'text-red-600', fill: '████░░' };
    if (score > 30) return { label: 'MODERATE', color: 'text-amber-600', fill: '██░░░░' };
    return { label: 'LOW', color: 'text-emerald-600', fill: '█░░░░░' };
  };

  return (
    <div className="flex flex-col gap-3 pr-2">
      {referrals.length === 0 ? (
        <div className="text-center p-8 text-slate-400 font-bold text-sm">No referrals found.</div>
      ) : (
        referrals.map((ref) => {
          const isSelected = selectedId === ref.id;
          const isNew = ref.status === 'pending' && !ref.notification.is_read;
          
          let borderClass = 'border-slate-200 border-l-slate-300';
          if (ref.status === 'flagged') borderClass = 'border-red-200 border-l-red-500 bg-red-50/30';
          else if (isNew) borderClass = 'border-blue-200 border-l-blue-500 bg-blue-50/30';
          else if (ref.status === 'reviewed') borderClass = 'border-slate-200 border-l-slate-300 opacity-75';

          const risk = getRiskScore(ref.patient);
          const riskDetails = getRiskLabel(risk);

          return (
            <div
              key={ref.id}
              onClick={() => onSelect(ref.id)}
              className={cn(
                "p-4 rounded-xl border border-l-4 cursor-pointer transition-all hover:shadow-md",
                borderClass,
                isSelected && "ring-2 ring-blue-500 shadow-md",
                !isSelected && "hover:border-slate-300"
              )}
            >
              <div className="flex items-start gap-2 mb-2">
                {isNew && <span className="flex-shrink-0 mt-0.5 h-2 w-2 rounded-full bg-blue-600"></span>}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    {isNew && <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">NEW</span>}
                    {ref.status === 'flagged' && <span className="text-[9px] font-black uppercase text-red-600 bg-red-100 px-1.5 py-0.5 rounded">FLAGGED</span>}
                    <span className="text-sm font-black text-slate-900">{ref.patient?.name || 'Unknown'}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{ref.patient?.patient_id_manual || ref.patient_id?.slice(0,8)}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold mt-1">Sent by Dr. {ref.sending_doctor.name}</span>
                </div>
              </div>
              
              {ref.notification.message && (
                <div className="mt-2 text-xs italic text-slate-600 border-l-2 border-slate-200 pl-2 line-clamp-2">
                  "{ref.notification.message.split('Note: ')[1] || 'Review requested'}"
                </div>
              )}

              <hr className="my-3 border-slate-100" />
              
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                <span>BP: {ref.patient?.blood_pressure || '--'}</span>
                <span>·</span>
                <span>HR: {ref.patient?.heart_rate || '--'}</span>
                <span>·</span>
                <span>Temp: {ref.patient?.temperature || '--'}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className={cn("text-[10px] font-black tracking-widest uppercase", riskDetails.color)}>
                  Risk: {riskDetails.fill} {riskDetails.label} ({risk})
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  {new Date(ref.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
