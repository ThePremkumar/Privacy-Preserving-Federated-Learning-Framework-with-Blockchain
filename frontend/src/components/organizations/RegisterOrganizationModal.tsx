'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, User, Mail, Phone, Lock, CheckCircle2, X, ChevronDown, Activity, Stethoscope, Search, Info } from 'lucide-react';
import api from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const registerSchema = z.object({
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
  lat: z.number().optional(),
  lng: z.number().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterOrganizationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function RegisterOrganizationModal({ onClose, onSuccess }: RegisterOrganizationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [catalog, setCatalog] = useState<any>(null);
  const [specMap, setSpecMap] = useState<any>(null);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: {
      organization_type: 'General clinic',
      country: 'India',
      is_active: true,
      admin_name: '',
      contact_phone: '',
      state: '',
      zip_code: '',
      active_specializations: [],
      active_departments: [],
      lat: 20.5937,
      lng: 78.9629,
    }
  });

  const selectedType = watch('organization_type');
  const selectedSpecs = watch('active_specializations') || [];
  const selectedDepts = watch('active_departments') || [];
  const emailValue = watch('contact_email');
  const isEmailValid = emailValue && !errors.contact_email && z.string().email().safeParse(emailValue).success;

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

  // Handle cascading logic when organization type changes
  useEffect(() => {
    if (!catalog || !selectedType) return;
    const typeData = catalog[selectedType];
    if (typeData) {
      setValue('active_specializations', typeData.specializations);
      setValue('active_departments', typeData.departments);
    }
  }, [selectedType, catalog, setValue]);

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    try {
      await api.post('/auth/register-hospital', data);
      onSuccess();
    } catch (err) {
      console.error('Failed to register hospital:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSelection = (field: 'active_specializations' | 'active_departments', value: string) => {
    const current = watch(field) || [];
    if (current.includes(value)) {
      setValue(field, current.filter(v => v !== value));
    } else {
      setValue(field, [...current, value]);
      
      // If adding a specialization, suggest related departments
      if (field === 'active_specializations' && specMap?.[value]) {
        const suggestedDepts = specMap[value];
        const currentDepts = watch('active_departments') || [];
        const newDepts = Array.from(new Set([...currentDepts, ...suggestedDepts]));
        setValue('active_departments', newDepts);
      }
    }
  };

  const orgTypes = catalog ? Object.keys(catalog) : ['General clinic', 'Heart hospital', 'Neuro center', 'Oncology clinic', 'Multi-specialty hospital'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-white rounded-xl shadow-2xl flex flex-col md:flex-row overflow-hidden my-auto border-[0.5px] border-slate-200 animate-in zoom-in-95 duration-200">
        
        {/* Left Panel */}
        <div className="w-full md:w-4/12 bg-slate-50 p-8 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col">
          <div className="mb-8">
            <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-6 shadow-sm border border-blue-200/50">
              <Building2 size={24} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Onboard Node</h2>
            <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">
              Register a new facility and configure its identity catalog.
            </p>
          </div>
          
          <div className="flex-1 space-y-6">
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                <Activity size={12} className="text-blue-500" /> Identity Logic
              </h4>
              <p className="text-xs font-bold text-slate-600 leading-relaxed bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                Selecting an <span className="text-blue-600 font-black">Organization Type</span> auto-populates standard specializations and departments. These will power doctor registration forms for this node.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { title: 'Three-Tier Data Model', desc: 'Org → Spec → Dept cascade enabled' },
                { title: 'Isolated Catalog', desc: 'Node-specific overrides supported' },
                { title: 'Network Policy', desc: 'Standardized identity across federated cluster' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white transition-colors border border-transparent hover:border-slate-100">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{item.title}</p>
                    <p className="text-[10px] font-medium text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <div className="flex gap-3">
              <Info size={16} className="text-indigo-600 shrink-0" />
              <p className="text-[10px] font-bold text-indigo-700 leading-relaxed">
                Admins can later add custom departments and specializations that are unique to this specific facility.
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full md:w-8/12 bg-white flex flex-col h-[85vh]">
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
               <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs">1</div>
               <h3 className="text-lg font-black text-slate-900">Facility Configuration</h3>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 p-6 space-y-10 overflow-y-auto custom-scrollbar">
              
              {/* Section 1: Core Identity */}
              <section className="space-y-6">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Building2 size={12} /> Core Identity
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">Organization Name *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Building2 size={18} />
                      </div>
                      <input
                        {...register('name')}
                        placeholder="e.g. Apollo Multi-specialty Hospital"
                        className={cn(
                          "w-full h-12 pl-11 pr-4 rounded-xl border-2 text-sm font-bold transition-all outline-none focus:ring-4 focus:ring-blue-500/10",
                          errors.name ? "border-red-200 bg-red-50/30" : "border-slate-100 bg-slate-50/50 focus:border-blue-500 focus:bg-white"
                        )}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">Organization Type *</label>
                    <div className="flex flex-wrap gap-2.5">
                      {orgTypes.map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setValue('organization_type', type)}
                          className={cn(
                            "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-tight border-2 transition-all",
                            selectedType === type 
                              ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100" 
                              : "bg-white border-slate-100 text-slate-500 hover:border-slate-300"
                          )}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 2: Catalog Configuration (The new parts) */}
              <section className="space-y-6 pt-2 border-t border-slate-50">
                <div className="flex items-center justify-between">
                   <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                     <Activity size={12} /> Catalog Configuration
                   </h4>
                   <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-widest">Dynamic Cascade</span>
                </div>

                <div className="space-y-6">
                  {/* Specializations */}
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
                      Active Specializations
                      <span className="text-slate-400 normal-case font-bold">{selectedSpecs.length} selected</span>
                    </label>
                    <div className="bg-slate-50/50 border-2 border-slate-100 rounded-2xl p-4 min-h-[80px]">
                      {isLoadingCatalog ? (
                        <div className="flex items-center justify-center h-10"><div className="h-4 w-4 border-2 border-blue-500 border-t-transparent animate-spin rounded-full" /></div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {catalog?.[selectedType]?.specializations.map((spec: string) => (
                            <button
                              key={spec}
                              type="button"
                              onClick={() => toggleSelection('active_specializations', spec)}
                              className={cn(
                                "group px-3 py-1.5 rounded-lg text-[11px] font-bold border-2 transition-all flex items-center gap-2",
                                selectedSpecs.includes(spec)
                                  ? "bg-blue-50 border-blue-200 text-blue-700"
                                  : "bg-white border-slate-200 text-slate-400 opacity-60 hover:opacity-100 hover:border-slate-300"
                              )}
                            >
                              <Stethoscope size={12} className={selectedSpecs.includes(spec) ? "text-blue-600" : "text-slate-300"} />
                              {spec}
                              {selectedSpecs.includes(spec) && <X size={10} className="ml-1 opacity-40 group-hover:opacity-100" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Departments */}
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
                      Active Departments
                      <span className="text-slate-400 normal-case font-bold">{selectedDepts.length} selected</span>
                    </label>
                    <div className="bg-slate-50/50 border-2 border-slate-100 rounded-2xl p-4 min-h-[100px]">
                      {isLoadingCatalog ? (
                        <div className="flex items-center justify-center h-10"><div className="h-4 w-4 border-2 border-blue-500 border-t-transparent animate-spin rounded-full" /></div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {catalog?.[selectedType]?.departments.map((dept: string) => (
                            <button
                              key={dept}
                              type="button"
                              onClick={() => toggleSelection('active_departments', dept)}
                              className={cn(
                                "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight text-left border-2 transition-all flex items-center justify-between",
                                selectedDepts.includes(dept)
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                  : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                              )}
                            >
                              <span className="truncate">{dept}</span>
                              {selectedDepts.includes(dept) ? <CheckCircle2 size={12} /> : <div className="h-2 w-2 rounded-full bg-slate-100" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="mt-3 text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                      <Search size={10} /> Searching for a specialization auto-selects its primary department.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 3: Contact & Address */}
              <section className="space-y-6 pt-2 border-t border-slate-50">
                 <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                   <Mail size={12} /> Contact & Location
                 </h4>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">Admin Full Name</label>
                      <input {...register('admin_name')} placeholder="Dr. Sarah Connor" className="w-full h-11 px-4 rounded-xl border-2 border-slate-100 bg-slate-50/50 text-sm font-bold focus:border-blue-500 focus:bg-white transition-all outline-none" />
                    </div>

                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">Admin Email *</label>
                      <input {...register('contact_email')} type="email" placeholder="admin@hospital.org" className={cn("w-full h-11 px-4 rounded-xl border-2 text-sm font-bold transition-all outline-none", errors.contact_email ? "border-red-200 bg-red-50/30" : "border-slate-100 bg-slate-50/50 focus:border-blue-500 focus:bg-white")} />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">Address *</label>
                      <input {...register('address')} placeholder="123 Health Avenue" className="w-full h-11 px-4 rounded-xl border-2 border-slate-100 bg-slate-50/50 text-sm font-bold focus:border-blue-500 focus:bg-white transition-all outline-none" />
                    </div>

                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">City *</label>
                      <input {...register('city')} placeholder="City" className="w-full h-11 px-4 rounded-xl border-2 border-slate-100 bg-slate-50/50 text-sm font-bold focus:border-blue-500 focus:bg-white transition-all outline-none" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">Zip Code</label>
                        <input {...register('zip_code')} placeholder="600001" className="w-full h-11 px-4 rounded-xl border-2 border-slate-100 bg-slate-50/50 text-sm font-bold focus:border-blue-500 focus:bg-white transition-all outline-none" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">Country</label>
                        <select {...register('country')} className="w-full h-11 px-4 rounded-xl border-2 border-slate-100 bg-slate-50/50 text-sm font-bold focus:border-blue-500 focus:bg-white transition-all outline-none">
                          <option value="India">India</option>
                          <option value="USA">USA</option>
                          <option value="UK">UK</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">Latitude (Map)</label>
                        <input {...register('lat', { valueAsNumber: true })} type="number" step="any" className="w-full h-11 px-4 rounded-xl border-2 border-slate-100 bg-slate-50/50 text-sm font-bold focus:border-blue-500 focus:bg-white transition-all outline-none" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">Longitude (Map)</label>
                        <input {...register('lng', { valueAsNumber: true })} type="number" step="any" className="w-full h-11 px-4 rounded-xl border-2 border-slate-100 bg-slate-50/50 text-sm font-bold focus:border-blue-500 focus:bg-white transition-all outline-none" />
                      </div>
                    </div>
                 </div>
              </section>

              {/* Section 4: Status */}
              <section className="pt-2 border-t border-slate-50">
                <div className="flex items-center justify-between p-5 rounded-2xl border-2 border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-4">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-colors shadow-sm", watch('is_active') ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500")}>
                       <Activity size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Active Deployment</p>
                      <p className="text-[10px] font-bold text-slate-500">Enable blockchain syncing immediately</p>
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
                          field.value ? "bg-emerald-500" : "bg-slate-300"
                        )}
                      >
                        <span className={cn(
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                          field.value ? "translate-x-5" : "translate-x-0"
                        )} />
                      </button>
                    )}
                  />
                </div>
              </section>

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className={cn(
                  "px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white flex items-center gap-3 transition-all shadow-xl",
                  (!isValid || isSubmitting) ? "bg-slate-300 cursor-not-allowed shadow-none" : "bg-blue-600 hover:bg-blue-700 shadow-blue-200 hover:-translate-y-0.5 active:translate-y-0"
                )}
              >
                {isSubmitting ? <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Lock size={14} />}
                Complete Onboarding
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
