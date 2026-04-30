import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Referral } from '@/hooks/useReferrals';
import { cn } from '@/lib/utils';
import { Loader2, ReplyAll } from 'lucide-react';

interface AdminReviewFormProps {
  referral: Referral;
  onSubmit: (review: { status: string; admin_notes: string; priority: string }) => Promise<void>;
}

export function AdminReviewForm({ referral, onSubmit }: AdminReviewFormProps) {
  const [status, setStatus] = useState(referral.status === 'pending' ? 'reviewed' : referral.status);
  const [priority, setPriority] = useState<'normal' | 'urgent' | 'critical'>(referral.priority || 'normal');
  const [notes, setNotes] = useState(referral.admin_notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({ status, admin_notes: notes, priority });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mt-8">
      <h3 className="text-lg font-black italic mb-4">Admin Review</h3>
      
      <div className="space-y-6">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Review Status</label>
          <div className="flex gap-4">
            {['pending', 'reviewed', 'flagged'].map((s) => (
              <label key={s} className="flex items-center gap-2 cursor-pointer group">
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                  status === s ? "border-blue-600" : "border-slate-300 group-hover:border-blue-400"
                )}>
                  {status === s && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                </div>
                <span className="text-sm font-bold text-slate-700 capitalize">{s === 'flagged' ? 'Flagged for escalation' : s}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Priority Level</label>
          <div className="flex gap-2">
            {[
              { id: 'normal', label: 'Normal', color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200', active: 'bg-slate-800 text-white border-slate-800' },
              { id: 'urgent', label: 'Urgent', color: 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200', active: 'bg-amber-600 text-white border-amber-600' },
              { id: 'critical', label: 'Critical', color: 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200', active: 'bg-red-600 text-white border-red-600' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPriority(p.id as any)}
                className={cn(
                  "px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest transition-colors",
                  priority === p.id ? p.active : p.color
                )}
              >
                {priority === p.id && <span className="mr-1.5">•</span>}
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Admin Notes (visible to doctor)</label>
          <textarea
            className="w-full min-h-[100px] p-4 rounded-xl border border-slate-200 text-sm font-medium focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all resize-none outline-none"
            placeholder="Add your review comments, recommendations, or actions taken..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
          <Button 
            className="flex-1 h-12 shadow-xl shadow-blue-200" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Save Review'}
          </Button>
          <Button 
            variant="outline" 
            className="h-12 px-6 bg-white hover:bg-slate-100"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            Notify Doctor <ReplyAll size={16} className="ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
