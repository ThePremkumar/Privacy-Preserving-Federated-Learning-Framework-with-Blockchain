import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, User, Mail, Phone, MapPin, X, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import api from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const editSchema = z.object({
  name: z.string().min(1, 'Organization Name is required'),
  organization_type: z.enum(['Hospital', 'Clinic', 'Research Institute', 'Diagnostic Center']),
  admin_name: z.string(),
  contact_email: z.string().email('Valid email is required'),
  contact_phone: z.string(),
  address: z.string().min(1, 'Address Line 1 is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string(),
  country: z.string().min(1, 'Country is required'),
  zip_code: z.string(),
  is_active: z.boolean(),
});

type EditFormValues = z.infer<typeof editSchema>;

interface EditOrganizationDrawerProps {
  hospital: any;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function EditOrganizationDrawer({ hospital, onClose, onSuccess }: EditOrganizationDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isDirty, dirtyFields }
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    mode: 'onBlur',
    defaultValues: {
      name: hospital.name || '',
      organization_type: (hospital.organization_type as any) || 'Hospital',
      admin_name: hospital.admin_name || '',
      contact_email: hospital.contact_email || '',
      contact_phone: hospital.contact_phone || '',
      address: hospital.address || '',
      city: hospital.city || '',
      state: hospital.state || '',
      country: hospital.country || 'India',
      zip_code: hospital.zip_code || '',
      is_active: hospital.is_active,
    }
  });

  const isActive = watch('is_active');
  const orgTypes = ['Hospital', 'Clinic', 'Research Institute', 'Diagnostic Center'];

  const onSubmit = async (data: EditFormValues) => {
    if (!isDirty) return;
    setIsSubmitting(true);
    try {
      await api.put(`/auth/hospitals/${hospital.id}`, data);
      onSuccess("Organization updated successfully");
    } catch (err) {
      console.error('Failed to update hospital:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== hospital.name) return;
    setIsDeleting(true);
    try {
      await api.delete(`/auth/hospitals/${hospital.id}`);
      onSuccess("Organization deleted");
    } catch (err) {
      console.error('Failed to delete hospital:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (isDirty) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  // Section dirty states
  const sec1Dirty = dirtyFields.name || dirtyFields.organization_type;
  const sec2Dirty = dirtyFields.admin_name || dirtyFields.contact_email || dirtyFields.contact_phone;
  const sec3Dirty = dirtyFields.address || dirtyFields.city || dirtyFields.state || dirtyFields.country || dirtyFields.zip_code;
  const sec4Dirty = dirtyFields.is_active;

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={handleClose} />
      
      <div className="fixed inset-y-0 right-0 z-[101] w-full md:w-[520px] bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-lg border border-blue-200">
              {hospital.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">{hospital.name}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: {hospital.id}</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          <form id="edit-org-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Section 1 */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Organization details</h4>
                {sec1Dirty && <span className="text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Modified</span>}
              </div>
              <div className="space-y-5">
                <div className={cn("relative", dirtyFields.name && "before:absolute before:left-[-12px] before:top-0 before:bottom-0 before:w-1 before:bg-[#EF9F27] before:rounded-r-full")}>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Organization Name *</label>
                  <input
                    {...register('name')}
                    className={cn(
                      "w-full h-10 px-3 rounded-lg border-[0.5px] text-sm transition-all outline-none focus:ring-4 focus:ring-blue-500/20",
                      errors.name ? "border-red-500" : dirtyFields.name ? "border-[#EF9F27]" : "border-slate-300 focus:border-[#378ADD]"
                    )}
                  />
                  {errors.name && <p className="mt-1 text-[10px] font-bold text-red-500">{errors.name.message}</p>}
                </div>
                
                <div className={cn("relative", dirtyFields.organization_type && "before:absolute before:left-[-12px] before:top-0 before:bottom-0 before:w-1 before:bg-[#EF9F27] before:rounded-r-full")}>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Organization Type *</label>
                  <Controller
                    name="organization_type"
                    control={control}
                    render={({ field }) => (
                      <div className="flex flex-wrap gap-2">
                        {orgTypes.map(type => (
                          <button
                            key={type} type="button" onClick={() => field.onChange(type)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                              field.value === type ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            )}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    )}
                  />
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Administrator contact</h4>
                {sec2Dirty && <span className="text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Modified</span>}
              </div>
              <div className="space-y-5">
                <div className={cn("relative", dirtyFields.admin_name && "before:absolute before:left-[-12px] before:top-0 before:bottom-0 before:w-1 before:bg-[#EF9F27] before:rounded-r-full")}>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Admin Full Name</label>
                  <input
                    {...register('admin_name')}
                    className={cn(
                      "w-full h-10 px-3 rounded-lg border-[0.5px] text-sm transition-all outline-none focus:ring-4 focus:ring-blue-500/20",
                      dirtyFields.admin_name ? "border-[#EF9F27]" : "border-slate-300 focus:border-[#378ADD]"
                    )}
                  />
                </div>
                
                <div className={cn("relative", dirtyFields.contact_email && "before:absolute before:left-[-12px] before:top-0 before:bottom-0 before:w-1 before:bg-[#EF9F27] before:rounded-r-full")}>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Admin Email *</label>
                  <input
                    {...register('contact_email')} type="email"
                    className={cn(
                      "w-full h-10 px-3 rounded-lg border-[0.5px] text-sm transition-all outline-none focus:ring-4 focus:ring-blue-500/20",
                      errors.contact_email ? "border-red-500" : dirtyFields.contact_email ? "border-[#EF9F27]" : "border-slate-300 focus:border-[#378ADD]"
                    )}
                  />
                  {errors.contact_email && <p className="mt-1 text-[10px] font-bold text-red-500">{errors.contact_email.message}</p>}
                </div>

                <div className={cn("relative", dirtyFields.contact_phone && "before:absolute before:left-[-12px] before:top-0 before:bottom-0 before:w-1 before:bg-[#EF9F27] before:rounded-r-full")}>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Contact Phone</label>
                  <input
                    {...register('contact_phone')} type="tel"
                    className={cn(
                      "w-full h-10 px-3 rounded-lg border-[0.5px] text-sm transition-all outline-none focus:ring-4 focus:ring-blue-500/20",
                      dirtyFields.contact_phone ? "border-[#EF9F27]" : "border-slate-300 focus:border-[#378ADD]"
                    )}
                  />
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Location</h4>
                {sec3Dirty && <span className="text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Modified</span>}
              </div>
              <div className="space-y-5">
                <div className={cn("relative", dirtyFields.address && "before:absolute before:left-[-12px] before:top-0 before:bottom-0 before:w-1 before:bg-[#EF9F27] before:rounded-r-full")}>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Address Line 1 *</label>
                  <input
                    {...register('address')}
                    className={cn(
                      "w-full h-10 px-3 rounded-lg border-[0.5px] text-sm transition-all outline-none focus:ring-4 focus:ring-blue-500/20",
                      errors.address ? "border-red-500" : dirtyFields.address ? "border-[#EF9F27]" : "border-slate-300 focus:border-[#378ADD]"
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className={cn("relative", dirtyFields.city && "before:absolute before:left-[-12px] before:top-0 before:bottom-0 before:w-1 before:bg-[#EF9F27] before:rounded-r-full")}>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">City *</label>
                    <input
                      {...register('city')}
                      className={cn(
                        "w-full h-10 px-3 rounded-lg border-[0.5px] text-sm transition-all outline-none focus:ring-4 focus:ring-blue-500/20",
                        errors.city ? "border-red-500" : dirtyFields.city ? "border-[#EF9F27]" : "border-slate-300 focus:border-[#378ADD]"
                      )}
                    />
                  </div>
                  <div className={cn("relative", dirtyFields.state && "before:absolute before:left-[-12px] before:top-0 before:bottom-0 before:w-1 before:bg-[#EF9F27] before:rounded-r-full")}>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">State</label>
                    <input
                      {...register('state')}
                      className={cn(
                        "w-full h-10 px-3 rounded-lg border-[0.5px] text-sm transition-all outline-none focus:ring-4 focus:ring-blue-500/20",
                        dirtyFields.state ? "border-[#EF9F27]" : "border-slate-300 focus:border-[#378ADD]"
                      )}
                    />
                  </div>
                  <div className={cn("relative", dirtyFields.zip_code && "before:absolute before:left-[-12px] before:top-0 before:bottom-0 before:w-1 before:bg-[#EF9F27] before:rounded-r-full")}>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Zip/Pin</label>
                    <input
                      {...register('zip_code')}
                      className={cn(
                        "w-full h-10 px-3 rounded-lg border-[0.5px] text-sm transition-all outline-none focus:ring-4 focus:ring-blue-500/20",
                        dirtyFields.zip_code ? "border-[#EF9F27]" : "border-slate-300 focus:border-[#378ADD]"
                      )}
                    />
                  </div>
                </div>

                <div className={cn("relative", dirtyFields.country && "before:absolute before:left-[-12px] before:top-0 before:bottom-0 before:w-1 before:bg-[#EF9F27] before:rounded-r-full")}>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Country *</label>
                  <select
                    {...register('country')}
                    className={cn(
                      "w-full h-10 px-3 rounded-lg border-[0.5px] text-sm transition-all outline-none focus:ring-4 focus:ring-blue-500/20 bg-white",
                      errors.country ? "border-red-500" : dirtyFields.country ? "border-[#EF9F27]" : "border-slate-300 focus:border-[#378ADD]"
                    )}
                  >
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Australia">Australia</option>
                    <option value="Canada">Canada</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Network status</h4>
                {sec4Dirty && <span className="text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Modified</span>}
              </div>
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Organization is active on the network</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded flex items-center gap-1",
                      isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    )}>
                      {isActive ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                    <Controller
                      name="is_active"
                      control={control}
                      render={({ field }) => (
                        <button
                          type="button"
                          onClick={() => field.onChange(!field.value)}
                          className={cn(
                            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500",
                            field.value ? "bg-[#378ADD]" : "bg-slate-300"
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                              field.value ? "translate-x-5" : "translate-x-0"
                            )}
                          />
                        </button>
                      )}
                    />
                  </div>
                </div>
                {!isActive && (
                  <p className="text-xs font-medium text-amber-700 bg-amber-50 p-2 rounded flex items-start gap-2">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                    Deactivating this organization will prevent it from submitting training jobs.
                  </p>
                )}
              </div>
            </section>
          </form>

          {/* Danger Zone */}
          <section className="mt-10 pt-8 border-t border-red-100">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-red-500 mb-4">Danger zone</h4>
            <div className="bg-[#FCEBEB] border border-[#F09595] rounded-xl p-5">
              <h5 className="text-sm font-bold text-red-900 mb-1">Delete organization</h5>
              <p className="text-xs text-red-700 mb-4">This action cannot be undone. All associated users will be disassociated.</p>
              
              {!showDeleteConfirm ? (
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 border border-[#F09595] text-red-700 text-xs font-bold rounded-lg hover:bg-red-50 transition-colors"
                >
                  Delete organization
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-red-900">Type <strong>{hospital.name}</strong> to confirm:</p>
                  <input
                    value={deleteConfirmText}
                    onChange={e => setDeleteConfirmText(e.target.value)}
                    className="w-full h-9 px-3 rounded border border-[#F09595] text-sm text-red-900 outline-none focus:ring-2 focus:ring-red-200"
                    placeholder={hospital.name}
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white rounded"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleDelete}
                      disabled={deleteConfirmText !== hospital.name || isDeleting}
                      className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sticky Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div>
            {isDirty && (
              <button
                type="button"
                onClick={() => reset()}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
              >
                Discard changes
              </button>
            )}
          </div>
          <button
            form="edit-org-form"
            type="submit"
            disabled={!isDirty || isSubmitting}
            className={cn(
              "px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-all shadow-sm flex items-center justify-center min-w-[140px]",
              (!isDirty || isSubmitting) ? "bg-slate-300 cursor-not-allowed" : "bg-[#185FA5] hover:bg-[#124b85] hover:shadow-md"
            )}
          >
            {isSubmitting ? (
              <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              'Save changes'
            )}
          </button>
        </div>
      </div>

      {/* Unsaved Changes Confirm Dialog */}
      {showConfirmClose && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl p-6">
            <h3 className="text-lg font-black text-slate-900 mb-2">Unsaved changes</h3>
            <p className="text-sm text-slate-500 mb-6">You have unsaved changes. Discard them?</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowConfirmClose(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={() => onClose()}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
