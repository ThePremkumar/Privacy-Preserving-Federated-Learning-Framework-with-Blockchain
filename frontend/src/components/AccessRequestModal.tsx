import React, { useState } from 'react';
import { X, Building2, User, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

export function AccessRequestModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'new_user' | 'new_hospital'>('new_user');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [hospitals, setHospitals] = useState<{id: string, name: string}[]>([]);

  React.useEffect(() => {
    // Fetch active hospitals for the dropdown
    api.get('/access-requests/public/hospitals')
      .then(res => setHospitals(res.data))
      .catch(err => console.error('Failed to load hospitals:', err));
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    designation: '',
    hospital_name: '',
    location: '',
    contact_number: '',
    email: '',
    num_users: '',
    hospital_id: '',
    reason: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await api.post('/access-requests', {
        request_type: tab,
        ...formData,
        num_users: formData.num_users ? parseInt(formData.num_users) : undefined
      });
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Request failed:', err);
      setError(err.response?.data?.detail || 'An error occurred while submitting your request.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-8 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-2xl font-black text-slate-900">Request Submitted</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Your access request has been successfully submitted. Our team will review your details and notify you via email shortly.
          </p>
          <Button onClick={onClose} className="w-full mt-6 h-12 rounded-xl">Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative my-8">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-2xl font-black text-slate-900">Request Platform Access</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setTab('new_user')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-bold transition-all ${tab === 'new_user' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <User size={18} /> New User
            </button>
            <button
              type="button"
              onClick={() => setTab('new_hospital')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-bold transition-all ${tab === 'new_hospital' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Building2 size={18} /> New Hospital
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tab === 'new_user' ? (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Full Name *</label>
                    <input required type="text" name="full_name" value={formData.full_name} onChange={handleChange} className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Official Email *</label>
                    <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Designation / Role *</label>
                    <div className="relative">
                      <select required name="designation" value={formData.designation} onChange={handleChange as any} className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none appearance-none bg-white">
                        <option value="" disabled>Select a role...</option>
                        <option value="Doctor">Doctor / Physician</option>
                        <option value="Nurse">Nurse / Practitioner</option>
                        <option value="Researcher">Medical Researcher</option>
                        <option value="Administrator">Hospital Administrator</option>
                        <option value="IT Staff">IT / Technical Staff</option>
                        <option value="Other">Other</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Hospital/Org Name *</label>
                    <div className="relative">
                      <select 
                        required 
                        name="hospital_name" 
                        value={formData.hospital_name} 
                        onChange={(e) => {
                          const h = hospitals.find(h => h.name === e.target.value);
                          setFormData({ ...formData, hospital_name: e.target.value, hospital_id: h?.id || '' });
                        }} 
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none appearance-none bg-white"
                      >
                        <option value="" disabled>Select your organization...</option>
                        {hospitals.map(h => (
                          <option key={h.id} value={h.name}>{h.name}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Contact Number *</label>
                    <input required type="text" name="contact_number" value={formData.contact_number} onChange={handleChange} className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Hospital Name *</label>
                    <input required type="text" name="hospital_name" value={formData.hospital_name} onChange={handleChange} className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Location / Address *</label>
                    <input required type="text" name="location" value={formData.location} onChange={handleChange} className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Auth Contact Person *</label>
                    <input required type="text" name="full_name" value={formData.full_name} onChange={handleChange} className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Official Email *</label>
                    <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Contact Number *</label>
                    <input required type="text" name="contact_number" value={formData.contact_number} onChange={handleChange} className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Expected Users *</label>
                    <input required type="number" name="num_users" value={formData.num_users} onChange={handleChange} min="1" className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" />
                  </div>
                </>
              )}
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Reason for Access *</label>
                <textarea required name="reason" value={formData.reason} onChange={handleChange} rows={3} className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none resize-none" placeholder="Briefly describe why you need access to the federated learning network..." />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold">
                {error}
              </div>
            )}

            <div className="pt-4 flex gap-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-12 rounded-xl">Cancel</Button>
              <Button type="submit" className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : 'Submit Request'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
