'use client';

import React from 'react';
import { X, Clock, Shield, TrendingUp, Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import { HospitalNode } from './types';
import { motion, AnimatePresence } from 'framer-motion';

interface HospitalSidePanelProps {
  hospital: HospitalNode | null;
  onClose: () => void;
}

export default function HospitalSidePanel({ hospital, onClose }: HospitalSidePanelProps) {
  if (!hospital) return null;

  const getStatusColor = (status: HospitalNode['status']) => {
    switch (status) {
      case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'idle': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'offline': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const getBudgetColor = (used: number) => {
    if (used < 5) return 'bg-emerald-500';
    if (used < 8) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getScoreColor = (score: number) => {
    if (score > 70) return 'bg-emerald-500';
    if (score > 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed top-0 right-0 h-full w-[320px] bg-white shadow-2xl z-[2000] border-l border-slate-100 flex flex-col"
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-50 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-slate-50 text-slate-400 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-4 mt-2">
          <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-100">
            {hospital.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight leading-tight">{hospital.name}</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{hospital.city}, {hospital.state}</p>
          </div>
        </div>

        <div className="mt-4">
          <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${getStatusColor(hospital.status)}`}>
            {hospital.status}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Training Jobs</p>
            <p className="text-xl font-black text-slate-900">{hospital.trainingJobs}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Approved Jobs</p>
            <p className="text-xl font-black text-slate-900">{hospital.approvedJobs}</p>
          </div>
        </div>

        {/* Privacy Budget */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Shield size={12} className="text-blue-600" /> Privacy Budget (ε)
            </p>
            <p className="text-xs font-black text-slate-900">{hospital.privacyBudgetUsed.toFixed(1)} / 10.0</p>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${getBudgetColor(hospital.privacyBudgetUsed)}`}
              style={{ width: `${(hospital.privacyBudgetUsed / 10) * 100}%` }}
            />
          </div>
        </div>

        {/* Contribution Score */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <TrendingUp size={12} className="text-blue-600" /> Contribution Score
            </p>
            <p className="text-xs font-black text-slate-900">{hospital.contributionScore}%</p>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${getScoreColor(hospital.contributionScore)}`}
              style={{ width: `${hospital.contributionScore}%` }}
            />
          </div>
        </div>

        {/* Last Seen */}
        <div className="flex items-center gap-2 text-slate-400">
          <Clock size={14} />
          <p className="text-xs font-bold italic">Last seen: {hospital.lastSeen}</p>
        </div>

        {/* Warning for Offline */}
        {hospital.status === 'offline' && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3">
            <AlertCircle size={16} className="text-red-600 mt-0.5" />
            <p className="text-[10px] font-black text-red-700 uppercase tracking-tight leading-relaxed">
              This node has been offline for 2+ days. Immediate network verification recommended.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-6 border-t border-slate-50 space-y-3">
        <button className="w-full py-3.5 rounded-2xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-slate-900 transition-all">
          View Training Jobs
        </button>
        <button className="w-full py-3.5 rounded-2xl bg-slate-50 text-slate-900 text-[10px] font-black uppercase tracking-widest border border-slate-100 hover:bg-slate-100 transition-all">
          Edit Organization
        </button>
      </div>
    </motion.div>
  );
}
