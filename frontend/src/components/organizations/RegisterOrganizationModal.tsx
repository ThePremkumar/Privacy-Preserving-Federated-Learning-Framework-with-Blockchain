import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, User, Mail, Phone, Lock, CheckCircle2, X } from 'lucide-react';
import api from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const registerSchema = z.object({
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

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterOrganizationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function RegisterOrganizationModal({ onClose, onSuccess }: RegisterOrganizationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isValid }
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: {
      organization_type: 'Hospital',
      country: 'India',
      is_active: true,
      admin_name: '',
      contact_phone: '',
      state: '',
      zip_code: '',
    }
  });

  const emailValue = watch('contact_email');
  const isEmailValid = emailValue && !errors.contact_email && z.string().email().safeParse(emailValue).success;

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

  const orgTypes = ['Hospital', 'Clinic', 'Research Institute', 'Diagnostic Center'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-xl shadow-2xl flex flex-col md:flex-row overflow-hidden my-auto border-[0.5px] border-slate-200">
        
        {/* Left Panel */}
        <div className="w-full md:w-5/12 bg-slate-50 p-8 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col">
          <div className="mb-8">
            <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-6">
              <Building2 size={24} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Register Organization</h2>
            <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">
              Onboard a new hospital node to the federated learning network.
            </p>
          </div>
          
          <div className="flex-1">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">Post-Registration Checklist</h4>
            <ul className="space-y-4">
              {[
                'Node securely added to the decentralized network',
                'Admin receives a secure invite email',
                'Hospital can begin local data upload',
                'Compliance certificates provisioned',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black">
                    {i + 1}
                  </div>
                  <span className="text-sm font-medium text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full md:w-7/12 bg-white flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h3 className="text-lg font-black text-slate-900">Registration Form</h3>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col">
            <div className="flex-1 p-6 space-y-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
              
              {/* Section 1: Organization details */}
              <section>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">Organization details</h4>
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Organization Name *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building2 size={16} className="text-slate-400" />
                      </div>
                      <input
                        {...register('name')}
                        placeholder="e.g. Apollo Hospitals, Chennai"
                        className={cn(
                          "w-full h-10 pl-10 pr-3 rounded-lg border-[0.5px] text-sm transition-all outline-none focus:ring-4 focus:ring-blue-500/20",
                          errors.name ? "border-red-500 focus:border-red-500" : "border-slate-300 focus:border-[#378ADD]"
                        )}
                      />
                    </div>
                    {errors.name && <p className="mt-1.5 text-[10px] font-bold text-red-500">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Organization Type *</label>
                    <Controller
                      name="organization_type"
                      control={control}
                      render={({ field }) => (
                        <div className="flex flex-wrap gap-2">
                          {orgTypes.map(type => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => field.onChange(type)}
                              className={cn(
                                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                                field.value === type 
                                  ? "bg-blue-50 border-blue-200 text-blue-700" 
                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
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

              {/* Section 2: Administrator contact */}
              <section>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">Administrator contact</h4>
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Admin Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User size={16} className="text-slate-400" />
                      </div>
                      <input
                        {...register('admin_name')}
                        placeholder="Dr. Sarah Connor"
                        className={cn(
                          "w-full h-10 pl-10 pr-3 rounded-lg border-[0.5px] text-sm transition-all outline-none focus:ring-4 focus:ring-blue-500/20",
                          errors.admin_name ? "border-red-500 focus:border-red-500" : "border-slate-300 focus:border-[#378ADD]"
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Admin Email *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail size={16} className="text-slate-400" />
                      </div>
                      <input
                        {...register('contact_email')}
                        type="email"
                        placeholder="admin@hospital.org"
                        className={cn(
                          "w-full h-10 pl-10 pr-10 rounded-lg border-[0.5px] text-sm transition-all outline-none focus:ring-4 focus:ring-blue-500/20",
                          errors.contact_email ? "border-red-500 focus:border-red-500" : isEmailValid ? "border-emerald-500 focus:border-emerald-500" : "border-slate-300 focus:border-[#378ADD]"
                        )}
                      />
                      {isEmailValid && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <CheckCircle2 size={16} className="text-emerald-500" />
                        </div>
                      )}
                    </div>
                    {errors.contact_email && <p className="mt-1.5 text-[10px] font-bold text-red-500">{errors.contact_email.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Contact Phone</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone size={16} className="text-slate-400" />
                      </div>
                      <input
                        {...register('contact_phone')}
                        type="tel"
                        placeholder="+91 98765 43210"
                        className={cn(
                          "w-full h-10 pl-10 pr-3 rounded-lg border-[0.5px] text-sm transition-all outline-none focus:ring-4 focus:ring-blue-500/20",
                          errors.contact_phone ? "border-red-500 focus:border-red-500" : "border-slate-300 focus:border-[#378ADD]"
                        )}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 3: Location */}
              <section>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">Location</h4>
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Address Line 1 *</label>
                    <input
                      {...register('address')}
                      placeholder="123 Health Avenue"
                      className={cn(
                        "w-full h-10 px-3 rounded-lg border-[0.5px] text-sm transition-all outline-none focus:ring-4 focus:ring-blue-500/20",
                        errors.address ? "border-red-500 focus:border-red-500" : "border-slate-300 focus:border-[#378ADD]"
                      )}
                    />
                    {errors.address && <p className="mt-1.5 text-[10px] font-bold text-red-500">{errors.address.message}</p>}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">City *</label>
                      <input
                        {...register('city')}
                        placeholder="City"
                        className={cn(
                          "w-full h-10 px-3 rounded-lg border-[0.5px] text-sm transition-all outline-none focus:ring-4 focus:ring-blue-500/20",
                          errors.city ? "border-red-500 focus:border-red-500" : "border-slate-300 focus:border-[#378ADD]"
                        )}
                      />
                      {errors.city && <p className="mt-1.5 text-[10px] font-bold text-red-500">{errors.city.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">State</label>
                      <input
                        {...register('state')}
                        placeholder="State"
                        className={cn(
                          "w-full h-10 px-3 rounded-lg border-[0.5px] text-sm transition-all outline-none focus:ring-4 focus:ring-blue-500/20",
                          errors.state ? "border-red-500 focus:border-red-500" : "border-slate-300 focus:border-[#378ADD]"
                        )}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">Zip/Pin Code</label>
                      <input
                        {...register('zip_code')}
                        placeholder="600001"
                        className={cn(
                          "w-full h-10 px-3 rounded-lg border-[0.5px] text-sm transition-all outline-none focus:ring-4 focus:ring-blue-500/20",
                          errors.zip_code ? "border-red-500 focus:border-red-500" : "border-slate-300 focus:border-[#378ADD]"
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Country *</label>
                    <select
                      {...register('country')}
                      className={cn(
                        "w-full h-10 px-3 rounded-lg border-[0.5px] text-sm transition-all outline-none focus:ring-4 focus:ring-blue-500/20 bg-white",
                        errors.country ? "border-red-500 focus:border-red-500" : "border-slate-300 focus:border-[#378ADD]"
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

              {/* Section 4: Status */}
              <section>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">Status</h4>
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Active Status</p>
                    <p className="text-xs text-slate-500 mt-0.5">Activate immediately upon registration</p>
                  </div>
                  <Controller
                    name="is_active"
                    control={control}
                    render={({ field }) => (
                      <button
                        type="button"
                        onClick={() => field.onChange(!field.value)}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                          field.value ? "bg-[#378ADD]" : "bg-slate-200"
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
              </section>

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between mt-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className={cn(
                  "px-5 py-2.5 rounded-lg text-sm font-bold text-white flex items-center gap-2 transition-all shadow-sm",
                  (!isValid || isSubmitting) ? "bg-slate-300 cursor-not-allowed" : "bg-[#185FA5] hover:bg-[#124b85] hover:shadow-md"
                )}
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <Lock size={14} />
                )}
                Register organization
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
