'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ShieldAlert, Key, Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import api from '@/lib/api';

export default function ForcePasswordResetPage() {
  const router = useRouter();
  const { user, isLoading, setUser } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Policy validation state
  const rules = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword)
  };
  const isPolicyMet = Object.values(rules).every(Boolean);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (!user.is_first_login) {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || !user.is_first_login) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isPolicyMet) {
      setError('Please ensure all password policy requirements are met.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    
    if (currentPassword === newPassword) {
      setError('New password must be different from the auto-generated password.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/force-reset-password', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      
      // Update local storage and auth context
      const { access_token, user: newUser } = res.data;
      localStorage.setItem('auth_token', access_token);
      
      setUser({
        ...user,
        ...newUser
      });
      
      setSuccess(true);
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-10 text-center animate-in zoom-in-95 duration-300">
          <div className="mx-auto w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Password Secured</h2>
          <p className="text-slate-600 mb-8">Your password has been set successfully. Welcome to the platform.</p>
          <div className="flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent"></div>
          </div>
          <p className="text-xs text-slate-400 mt-4 font-medium uppercase tracking-wider">Redirecting to Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-lg mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl mb-6">
          <ShieldAlert size={32} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Set Your New Password</h1>
        <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
          For security purposes, you are required to set a new password before accessing the platform. This step is mandatory and can only be done once.
        </p>
      </div>

      <Card className="w-full max-w-lg shadow-2xl border-none animate-in fade-in slide-in-from-bottom-8 duration-700">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-widest px-1">Current Password</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type={showCurrent ? "text" : "password"}
                  placeholder="Auto-generated password" 
                  className="h-14 w-full rounded-xl border-2 border-slate-100 bg-slate-50/50 pl-11 pr-12 font-semibold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  onClick={() => setShowCurrent(!showCurrent)}
                >
                  {showCurrent ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="h-px w-full bg-slate-100 my-4" />

            {/* New Password */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-widest px-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type={showNew ? "text" : "password"}
                  placeholder="••••••••" 
                  className="h-14 w-full rounded-xl border-2 border-slate-100 bg-slate-50/50 pl-11 pr-12 font-semibold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  onClick={() => setShowNew(!showNew)}
                >
                  {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              {/* Password Policy Tracker */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-2 grid grid-cols-2 gap-2 text-xs font-medium">
                <div className={`flex items-center gap-1.5 ${rules.length ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {rules.length ? <CheckCircle2 size={14} /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-0.5"/>} Min 8 characters
                </div>
                <div className={`flex items-center gap-1.5 ${rules.upper ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {rules.upper ? <CheckCircle2 size={14} /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-0.5"/>} Uppercase letter
                </div>
                <div className={`flex items-center gap-1.5 ${rules.lower ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {rules.lower ? <CheckCircle2 size={14} /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-0.5"/>} Lowercase letter
                </div>
                <div className={`flex items-center gap-1.5 ${rules.number ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {rules.number ? <CheckCircle2 size={14} /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-0.5"/>} Number
                </div>
                <div className={`flex items-center gap-1.5 ${rules.special ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {rules.special ? <CheckCircle2 size={14} /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-0.5"/>} Special character
                </div>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-widest px-1">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type={showNew ? "text" : "password"}
                  placeholder="••••••••" 
                  className={`h-14 w-full rounded-xl border-2 bg-slate-50/50 pl-11 pr-4 font-semibold text-slate-900 focus:bg-white focus:outline-none transition-all ${
                    confirmPassword && newPassword !== confirmPassword 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-slate-100 focus:border-blue-500'
                  }`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-600 animate-in fade-in">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              size="lg" 
              className="h-14 w-full text-lg shadow-xl shadow-slate-900/20" 
              isLoading={isSubmitting}
              disabled={!isPolicyMet || !currentPassword || newPassword !== confirmPassword}
            >
              Set Password and Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
