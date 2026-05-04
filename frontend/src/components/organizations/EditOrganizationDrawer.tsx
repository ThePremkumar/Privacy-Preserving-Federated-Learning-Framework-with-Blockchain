'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, User, Mail, Phone, MapPin, X, AlertTriangle, CheckCircle2, XCircle, Stethoscope, Activity, Settings, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const editSchema = z.object({
  name: z.string().min(1, 'Organization Name is required'),
  organization_type: z.string().min(1, 'Organization Type is required'),
  admin_name: z.string(),
  contact_email: z.string().email('Valid email is required'),
  contact_phone: z.string(),
  address: z.string().min(1, 'Address Line 1 is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string(),
  country: z.string().min(1, 'Country is required'),
  zip_code: z.string(),
  is_active: z.boolean(),
  active_specializations: z.array(z.string()).default([]),
  active_departments: z.array(z.string()).default([]),
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
  
  const [catalog, setCatalog] = useState<any>(null);
  const [specMap, setSpecMap] = useState<any>(null);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors, isDirty, dirtyFields }
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    mode: 'onBlur',
    defaultValues: {
      name: hospital.name || '',
      organization_type: hospital.organization_type || 'General clinic',
      admin_name: hospital.admin_name || '',
      contact_email: hospital.contact_email || '',
      contact_phone: hospital.contact_phone || '',
      address: hospital.address || '',
      city: hospital.city || '',
      state: hospital.state || '',
      country: hospital.country || 'India',
      zip_code: hospital.zip_code || '',
      is_active: hospital.is_active,
      active_specializations: hospital.active_specializations || [],
      active_departments: hospital.active_departments || [],
    }
  });

  const isActive = watch('is_active');
  const selectedType = watch('organization_type');
  const selectedSpecs = watch('active_specializations') || [];
  const selectedDepts = watch('active_departments') || [];

  // Fetch catalog data
  useEffect(() => {
    async function fetchCatalog() {
      try {
        const [catRes, mapRes] = await Promise.all([
          api.get('/catalog/organization-types'),
          api.get('/catalog/specialization-map')
        ]);
        setCatalog(catRes.data);
        setSpecMap(mapRes.data);
      } catch (err) {
        console.error('Failed to fetch catalog:', err);
      } finally {
        setIsLoadingCatalog(false);
      }
    }
    fetchCatalog();
  }, []);

  const toggleSelection = (field: 'active_specializations' | 'active_departments', value: string) => {
    const current = watch(field) || [];
    if (current.includes(value)) {
      setValue(field, current.filter(v => v !== value), { shouldDirty: true });
    } else {
      setValue(field, [...current, value], { shouldDirty: true });
      
      // Cascade logic for specializations
      if (field === 'active_specializations' && specMap?.[value]) {
        const suggestedDepts = specMap[value];
        const currentDepts = watch('active_departments') || [];
        const newDepts = Array.from(new Set([...currentDepts, ...suggestedDepts]));
        setValue('active_departments', newDepts, { shouldDirty: true });
      }
    }
  };

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

  const orgTypes = catalog ? Object.keys(catalog) : ['General clinic', 'Heart hospital', 'Neuro center', 'Oncology clinic', 'Multi-specialty hospital'];

  // Section dirty states
  const sec1Dirty = dirtyFields.name || dirtyFields.organization_type;
  const sec2Dirty = dirtyFields.active_specializations || dirtyFields.active_departments;
  const sec3Dirty = dirtyFields.admin_name || dirtyFields.contact_email || dirtyFields.contact_phone;
  const sec4Dirty = dirtyFields.address || dirtyFields.city || dirtyFields.state || dirtyFields.country || dirtyFields.zip_code;
  const sec5Dirty = dirtyFields.is_active;

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={handleClose} />
      
      <div className="fixed inset-y-0 right-0 z-[101] w-full md:w-[600px] bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-slate-200 overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-start justify-between p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl border-4 border-blue-100 shadow-lg shadow-blue-100">
              {hospital.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 leading-tight">{hospital.name}</h2>
              <div className="flex items-center gap-3 mt-1">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {hospital.id}</span>
                 <div className="h-1 w-1 rounded-full bg-slate-200" />
                 <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{selectedType}</span>
              </div>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-white hover:shadow-sm transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-12">
          <form id="edit-org-form" onSubmit={handleSubmit(onSubmit)} className="space-y-12">
            
            {/* Section 1: Core details */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Building2 size={12} /> Core Profile
                </h4>
                {sec1Dirty && <span className="text-[9px] font-black uppercase tracking-widest bg-blue-600 text-white px-2 py-0.5 rounded-full shadow-sm">Modified</span>}
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">Organization Name *</label>
                  <input
                    {...register('name')}
                    className={cn(
                      "w-full h-12 px-4 rounded-xl border-2 text-sm font-bold transition-all outline-none",
                      errors.name ? "border-red-200 bg-red-50/30" : dirtyFields.name ? "border-amber-200 bg-amber-50/10" : "border-slate-100 bg-slate-50/50 focus:border-blue-500 focus:bg-white"
                    )}
                  />
                  {errors.name && <p className="mt-1.5 text-[10px] font-bold text-red-500">{errors.name.message}</p>}
                </div>
                
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-3">Facility Classification</label>
                  <div className="grid grid-cols-2 gap-2">
                    {orgTypes.map(type => (
                      <button
                        key={type} type="button" onClick={() => setValue('organization_type', type, { shouldDirty: true })}
                        className={cn(
                          "px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-tight border-2 transition-all text-left flex items-center justify-between",
                          selectedType === type ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-50" : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
                        )}
                      >
                        {type}
                        {selectedType === type && <CheckCircle2 size={14} />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Identity Catalog (Dynamic) */}
            <section className="p-6 rounded-3xl bg-slate-50/50 border-2 border-slate-100">
               <div className="flex items-center justify-between mb-6">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Activity size={12} /> Active Catalog
                </h4>
                {sec2Dirty && <span className="text-[9px] font-black uppercase tracking-widest bg-blue-600 text-white px-2 py-0.5 rounded-full shadow-sm">Modified</span>}
              </div>

              <div className="space-y-8">
                  {/* Specializations */}
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-3">Specializations Allowed</label>
                    <div className="flex flex-wrap gap-2">
                      {isLoadingCatalog ? (
                        <div className="h-8 w-full bg-slate-100 animate-pulse rounded-lg" />
                      ) : (
                        catalog?.[selectedType]?.specializations.map((spec: string) => (
                          <button
                            key={spec}
                            type="button"
                            onClick={() => toggleSelection('active_specializations', spec)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[11px] font-bold border-2 transition-all flex items-center gap-2",
                              selectedSpecs.includes(spec)
                                ? "bg-blue-100 border-blue-300 text-blue-700"
                                : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                            )}
                          >
                            <Stethoscope size={12} />
                            {spec}
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Departments */}
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-3">Enabled Departments</label>
                    <div className="grid grid-cols-2 gap-2">
                      {isLoadingCatalog ? (
                        <div className="h-12 w-full bg-slate-100 animate-pulse rounded-lg" />
                      ) : (
                        catalog?.[selectedType]?.departments.map((dept: string) => (
                          <button
                            key={dept}
                            type="button"
                            onClick={() => toggleSelection('active_departments', dept)}
                            className={cn(
                              "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight text-left border-2 transition-all flex items-center justify-between",
                              selectedDepts.includes(dept)
                                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                            )}
                          >
                            <span className="truncate">{dept}</span>
                            {selectedDepts.includes(dept) && <CheckCircle2 size={12} />}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
              </div>
            </section>

            {/* Section 3: Admin contact */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <User size={12} /> Administrator
                </h4>
                {sec3Dirty && <span className="text-[9px] font-black uppercase tracking-widest bg-blue-600 text-white px-2 py-0.5 rounded-full shadow-sm">Modified</span>}
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">Admin Full Name</label>
                  <input
                    {...register('admin_name')}
                    className={cn(
                      "w-full h-11 px-4 rounded-xl border-2 text-sm font-bold transition-all outline-none",
                      dirtyFields.admin_name ? "border-amber-200 bg-amber-50/10" : "border-slate-100 bg-slate-50/50 focus:border-blue-500 focus:bg-white"
                    )}
                  />
                </div>
                
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">Admin Email *</label>
                  <input
                    {...register('contact_email')} type="email"
                    className={cn(
                      "w-full h-11 px-4 rounded-xl border-2 text-sm font-bold transition-all outline-none",
                      errors.contact_email ? "border-red-200 bg-red-50/30" : dirtyFields.contact_email ? "border-amber-200 bg-amber-50/10" : "border-slate-100 bg-slate-50/50 focus:border-blue-500 focus:bg-white"
                    )}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">Contact Phone</label>
                  <input
                    {...register('contact_phone')} type="tel"
                    className={cn(
                      "w-full h-11 px-4 rounded-xl border-2 text-sm font-bold transition-all outline-none",
                      dirtyFields.contact_phone ? "border-amber-200 bg-amber-50/10" : "border-slate-100 bg-slate-50/50 focus:border-blue-500 focus:bg-white"
                    )}
                  />
                </div>
              </div>
            </section>

            {/* Section 4: Location */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <MapPin size={12} /> Localization
                </h4>
                {sec4Dirty && <span className="text-[9px] font-black uppercase tracking-widest bg-blue-600 text-white px-2 py-0.5 rounded-full shadow-sm">Modified</span>}
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">Address *</label>
                  <input
                    {...register('address')}
                    className={cn(
                      "w-full h-11 px-4 rounded-xl border-2 text-sm font-bold transition-all outline-none",
                      errors.address ? "border-red-200 bg-red-50/30" : dirtyFields.address ? "border-amber-200 bg-amber-50/10" : "border-slate-100 bg-slate-50/50 focus:border-blue-500 focus:bg-white"
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">City *</label>
                    <input {...register('city')} className="w-full h-11 px-4 rounded-xl border-2 border-slate-100 bg-slate-50/50 text-sm font-bold focus:border-blue-500 focus:bg-white outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">State</label>
                    <input {...register('state')} className="w-full h-11 px-4 rounded-xl border-2 border-slate-100 bg-slate-50/50 text-sm font-bold focus:border-blue-500 focus:bg-white outline-none transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">Zip Code</label>
                    <input {...register('zip_code')} className="w-full h-11 px-4 rounded-xl border-2 border-slate-100 bg-slate-50/50 text-sm font-bold focus:border-blue-500 focus:bg-white outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">Country</label>
                    <select {...register('country')} className="w-full h-11 px-4 rounded-xl border-2 border-slate-100 bg-slate-50/50 text-sm font-bold focus:border-blue-500 focus:bg-white outline-none transition-all">
                      <option value="India">India</option>
                      <option value="USA">USA</option>
                      <option value="UK">UK</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5: Status */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Network Governance</h4>
                {sec5Dirty && <span className="text-[9px] font-black uppercase tracking-widest bg-blue-600 text-white px-2 py-0.5 rounded-full shadow-sm">Modified</span>}
              </div>
              <div className="p-6 rounded-3xl border-2 border-slate-100 bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-all shadow-sm border", isActive ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-100")}>
                       <Activity size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Active Node Status</p>
                      <p className="text-[10px] font-bold text-slate-500">Participate in federated training rounds</p>
                    </div>
                  </div>
                  <Controller
                    name="is_active"
                    control={control}
                    render={({ field }) => (
                      <button
                        type="button"
                        onClick={() => field.onChange(!field.value)}
                        className={cn(
                          "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-4 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          field.value ? "bg-emerald-500" : "bg-red-500"
                        )}
                      >
                        <span className={cn(
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out",
                          field.value ? "translate-x-5" : "translate-x-0"
                        )} />
                      </button>
                    )}
                  />
                </div>
              </div>
            </section>
          </form>

          {/* Danger Zone */}
          <section className="mt-16 pt-12 border-t border-red-100">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-red-500 mb-6 flex items-center gap-2">
              <AlertTriangle size={12} /> Danger Operations
            </h4>
            <div className="bg-red-50/50 border-2 border-red-100 rounded-3xl p-6">
              <h5 className="text-sm font-black text-red-900 uppercase tracking-tight">Retire Organization</h5>
              <p className="text-xs font-bold text-red-700/70 mt-1 leading-relaxed">Permanently remove this facility from the network. This will orphan all associated medical records and user accounts.</p>
              
              <div className="mt-6">
                {!showDeleteConfirm ? (
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-red-100 text-red-600 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm"
                  >
                    <Trash2 size={14} /> Retire Facility
                  </button>
                ) : (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-xs font-black text-red-900 uppercase tracking-tight">Type <span className="underline italic">{hospital.name}</span> to confirm removal:</p>
                    <input
                      value={deleteConfirmText}
                      onChange={e => setDeleteConfirmText(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border-2 border-red-200 bg-white text-sm font-black text-red-900 outline-none focus:ring-4 focus:ring-red-100"
                      placeholder={hospital.name}
                    />
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-white rounded-xl"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleDelete}
                        disabled={deleteConfirmText !== hospital.name || isDeleting}
                        className="flex-1 px-4 py-2 bg-red-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-100"
                      >
                        {isDeleting ? 'Processing...' : 'Confirm Destruction'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Sticky Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div>
            {isDirty && (
              <button
                type="button"
                onClick={() => reset()}
                className="px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
              >
                Discard Changes
              </button>
            )}
          </div>
          <button
            form="edit-org-form"
            type="submit"
            disabled={!isDirty || isSubmitting}
            className={cn(
              "px-10 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all shadow-xl flex items-center justify-center min-w-[180px]",
              (!isDirty || isSubmitting) ? "bg-slate-300 cursor-not-allowed shadow-none" : "bg-blue-600 hover:bg-blue-700 shadow-blue-100 hover:-translate-y-0.5 active:translate-y-0"
            )}
          >
            {isSubmitting ? (
              <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                 <Settings size={14} /> Commit Updates
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Unsaved Changes Confirm Dialog */}
      {showConfirmClose && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
            <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-6">
               <AlertTriangle size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900 leading-tight">Unsaved Changes</h3>
            <p className="text-sm font-bold text-slate-400 mt-2 leading-relaxed">You have modified the organization configuration. Discarding will revert all catalog changes.</p>
            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setShowConfirmClose(false)}
                className="flex-1 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 rounded-xl"
              >
                Go Back
              </button>
              <button 
                onClick={() => onClose()}
                className="flex-1 px-5 py-3 text-xs font-black uppercase tracking-widest text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-100"
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
