import React, { useState } from 'react';
import { X, Send, Paperclip, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import api from '@/lib/api';

interface SendToAdminModalProps {
  patient: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const SendToAdminModal: React.FC<SendToAdminModalProps> = ({ patient, onClose, onSuccess }) => {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await api.post(`/patients/${patient._id}/send-to-admin`, { note });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to send details to admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg border-none shadow-2xl animate-in fade-in zoom-in duration-200">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Send size={20} />
            </div>
            <div>
              <CardTitle className="text-xl font-black">Send to <span className="text-blue-600">Admin</span></CardTitle>
              <CardDescription className="text-xs font-bold text-slate-400">Share clinical records for review</CardDescription>
            </div>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}><X size={20}/></Button>
        </CardHeader>
        
        <CardContent className="py-6 space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400">Patient:</span>
              <span className="text-slate-900">{patient.name} ({patient.patient_id_manual || patient._id.slice(-8)})</span>
            </div>
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400">Recipient:</span>
              <span className="text-slate-900">Hospital Administrator</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">What will be included:</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                <CheckCircle2 size={14} className="text-emerald-500" /> Basic identification
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                <CheckCircle2 size={14} className="text-emerald-500" /> Vital signs
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                <CheckCircle2 size={14} className="text-emerald-500" /> Symptoms & diagnosis
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                <CheckCircle2 size={14} className="text-emerald-500" /> Medical history
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                <X size={14} className="text-red-400" /> Attached documents
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Add a note (optional)</label>
            <textarea 
              className="w-full h-24 p-4 bg-slate-50 border rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
              placeholder="e.g. Requesting urgent review for high BP readings..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-bold flex items-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-slate-50/50 p-6 flex gap-3 justify-end">
          <Button variant="outline" className="h-10 px-6 font-black uppercase tracking-widest text-[10px]" onClick={onClose}>Cancel</Button>
          <Button 
            className="h-10 px-8 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-200" 
            onClick={handleSend}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin mr-2" /> : <Send size={14} className="mr-2" />}
            Send to Admin
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
