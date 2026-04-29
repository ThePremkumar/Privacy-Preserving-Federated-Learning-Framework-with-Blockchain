'use client';

import React from 'react';
import { Activity, Users, Database } from 'lucide-react';
import { HospitalNode } from './types';

interface MapOverlaysProps {
  nodes: HospitalNode[];
}

export default function MapOverlays({ nodes }: MapOverlaysProps) {
  const counts = {
    active: nodes.filter(n => n.status === 'active').length,
    idle: nodes.filter(n => n.status === 'idle').length,
    offline: nodes.filter(n => n.status === 'offline').length,
    total: nodes.length,
    avgScore: Math.round(nodes.reduce((s, n) => s + n.contributionScore, 0) / nodes.length) || 0,
    totalJobs: nodes.reduce((s, n) => s + n.trainingJobs, 0),
  };

  return (
    <>
      {/* Stats Card (Top Right) */}
      <div className="absolute top-3 right-3 z-[1000] w-56 bg-white/95 backdrop-blur-sm border border-slate-100 rounded-2xl p-4 shadow-2xl pointer-events-auto">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Activity size={12} className="text-blue-600" /> Network Health
        </h4>
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-600 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {counts.active} Active
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-600 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {counts.idle} Idle
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-600 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> {counts.offline} Offline
            </p>
          </div>
        </div>
        
        <div className="pt-3 border-t border-slate-50 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Avg Contribution</p>
            <p className="text-xs font-black text-slate-900">{counts.avgScore}%</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Total Jobs</p>
            <p className="text-xs font-black text-slate-900">{counts.totalJobs}</p>
          </div>
        </div>
      </div>

      {/* Legend (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm border border-slate-100 px-4 py-2 rounded-full shadow-2xl pointer-events-auto flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Idle</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Offline</span>
        </div>
      </div>
    </>
  );
}
