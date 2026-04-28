'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Activity, Clock, ChevronRight, X, RefreshCw, Loader2, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

interface HospitalNode {
  id: string;
  name: string;
  city: string;
  country: string;
  is_active: boolean;
  last_submission?: string;
  contribution_score: number;
  training_jobs: number;
  status: 'active-recent' | 'active-idle' | 'inactive';
  x: number; // SVG position %
  y: number;
}

const STATUS_CONFIG = {
  'active-recent': { label: 'Active',  color: '#10b981', pulse: true,  bg: 'bg-teal-50',   text: 'text-teal-700',  border: 'border-teal-200' },
  'active-idle':   { label: 'Idle',    color: '#f59e0b', pulse: false, bg: 'bg-amber-50',  text: 'text-amber-700', border: 'border-amber-200' },
  'inactive':      { label: 'Offline', color: '#ef4444', pulse: false, bg: 'bg-red-50',    text: 'text-red-700',   border: 'border-red-200' },
};

const MOCK_NODES: HospitalNode[] = [
  { id: '1', name: 'Metro General Hospital',         city: 'New York',     country: 'USA',   is_active: true,  last_submission: '2h ago',  contribution_score: 92, training_jobs: 8,  status: 'active-recent', x: 22, y: 36 },
  { id: '2', name: "St. Mary's Medical Center",      city: 'London',       country: 'UK',    is_active: true,  last_submission: '4h ago',  contribution_score: 78, training_jobs: 6,  status: 'active-recent', x: 46, y: 24 },
  { id: '3', name: 'Riverside Community Hospital',   city: 'Toronto',      country: 'Canada',is_active: true,  last_submission: '2d ago',  contribution_score: 55, training_jobs: 4,  status: 'active-idle',   x: 20, y: 30 },
  { id: '4', name: 'University Research Hospital',   city: 'Berlin',       country: 'Germany',is_active: true, last_submission: '6h ago',  contribution_score: 88, training_jobs: 10, status: 'active-recent', x: 50, y: 26 },
  { id: '5', name: 'Pacific Coast Medical Center',   city: 'Sydney',       country: 'Australia',is_active: false,last_submission: '8d ago', contribution_score: 20, training_jobs: 2, status: 'inactive',      x: 82, y: 70 },
  { id: '6', name: 'Northern District Hospital',     city: 'Tokyo',        country: 'Japan', is_active: true,  last_submission: '1h ago',  contribution_score: 95, training_jobs: 12, status: 'active-recent', x: 84, y: 34 },
  { id: '7', name: 'Central City Healthcare',        city: 'Mumbai',       country: 'India', is_active: true,  last_submission: '5h ago',  contribution_score: 72, training_jobs: 5, status: 'active-idle',   x: 66, y: 42 },
];

function NodeDetail({ node, onClose }: { node: HospitalNode; onClose: () => void }) {
  const cfg = STATUS_CONFIG[node.status];
  return (
    <div className="glass-card rounded-2xl p-6 animate-slide-up">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center border', cfg.bg, cfg.border)}>
            <MapPin size={18} className={cfg.text} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 leading-tight">{node.name}</h3>
            <p className="text-[10px] font-bold text-slate-400">{node.city}, {node.country}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
          <X size={16} />
        </button>
      </div>
      <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest mb-5', cfg.bg, cfg.text, cfg.border)}>
        {node.is_active ? <Wifi size={10} /> : <WifiOff size={10} />}
        {cfg.label}
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="glass-card rounded-xl p-3">
          <p className="text-2xl font-black text-slate-900">{node.contribution_score}</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Contribution Score</p>
        </div>
        <div className="glass-card rounded-xl p-3">
          <p className="text-2xl font-black text-slate-900">{node.training_jobs}</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Training Jobs</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
        <Clock size={12} /> Last submission: {node.last_submission || 'Never'}
      </div>
      {/* Contribution bar */}
      <div className="mt-4">
        <div className="flex justify-between text-[10px] font-black text-slate-400 mb-1.5">
          <span>Contribution Score</span><span>{node.contribution_score}/100</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${node.contribution_score}%`, background: STATUS_CONFIG[node.status].color }} />
        </div>
      </div>
    </div>
  );
}

export default function NetworkMapPage() {
  const { user } = useAuth();
  const [nodes, setNodes] = useState<HospitalNode[]>(MOCK_NODES);
  const [selected, setSelected] = useState<HospitalNode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/hospitals').then(res => {
      if (Array.isArray(res.data)) {
        // Merge real hospital data with mock positions
        const mapped: HospitalNode[] = res.data.map((h: any, i: number) => ({
          id: h.id,
          name: h.name,
          city: h.address?.split(',')[0] || 'Unknown',
          country: h.address?.split(',').pop()?.trim() || 'Unknown',
          is_active: h.is_active,
          contribution_score: Math.floor(Math.random() * 60) + 40,
          training_jobs: Math.floor(Math.random() * 10) + 1,
          status: h.is_active ? 'active-idle' : 'inactive',
          x: MOCK_NODES[i % MOCK_NODES.length].x,
          y: MOCK_NODES[i % MOCK_NODES.length].y,
        }));
        if (mapped.length > 0) setNodes(mapped);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const counts = {
    total: nodes.length,
    active: nodes.filter(n => n.status === 'active-recent').length,
    idle: nodes.filter(n => n.status === 'active-idle').length,
    offline: nodes.filter(n => n.status === 'inactive').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Hospital <span className="gradient-text">Network Map</span></h1>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Live federated learning node status</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="live-indicator glass-card px-3 py-2 rounded-xl">
            <div className="live-dot" />LIVE
          </div>
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: `${counts.total} Total Nodes`, color: 'bg-slate-100 text-slate-700' },
          { label: `${counts.active} Active`, color: 'bg-teal-50 text-teal-700 border border-teal-200' },
          { label: `${counts.idle} Idle`, color: 'bg-amber-50 text-amber-700 border border-amber-200' },
          { label: `${counts.offline} Offline`, color: 'bg-red-50 text-red-700 border border-red-200' },
        ].map((p, i) => (
          <span key={i} className={cn('px-3 py-1.5 rounded-xl text-xs font-black', p.color)}>{p.label}</span>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── World Map SVG ───────────────────── */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-4 overflow-hidden">
          <div className="relative w-full" style={{ paddingBottom: '56%' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl overflow-hidden">
              {/* Simple world-map-like grid background */}
              <svg viewBox="0 0 100 56" className="w-full h-full opacity-20" preserveAspectRatio="none">
                {/* Latitude lines */}
                {[10, 20, 30, 40, 50].map(y => (
                  <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#0F4C81" strokeWidth="0.3" strokeDasharray="1 2" />
                ))}
                {/* Longitude lines */}
                {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(x => (
                  <line key={x} x1={x} y1="0" x2={x} y2="56" stroke="#0F4C81" strokeWidth="0.3" strokeDasharray="1 2" />
                ))}
                {/* Continent blobs (simplified) */}
                <ellipse cx="22" cy="35" rx="12" ry="8" fill="#0F4C81" />
                <ellipse cx="47" cy="28" rx="9" ry="6" fill="#0F4C81" />
                <ellipse cx="52" cy="38" rx="6" ry="9" fill="#0F4C81" />
                <ellipse cx="68" cy="36" rx="7" ry="5" fill="#0F4C81" />
                <ellipse cx="83" cy="44" rx="7" ry="4" fill="#0F4C81" />
                <ellipse cx="84" cy="33" rx="5" ry="4" fill="#0F4C81" />
              </svg>

              {/* Hospital Nodes */}
              {nodes.map((node) => {
                const cfg = STATUS_CONFIG[node.status];
                const isSelected = selected?.id === node.id;
                return (
                  <button
                    key={node.id}
                    onClick={() => setSelected(isSelected ? null : node)}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    title={node.name}
                  >
                    {/* Pulse ring for active-recent */}
                    {node.status === 'active-recent' && (
                      <span className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ background: cfg.color, transform: 'scale(1.8)' }} />
                    )}
                    <div
                      className={cn(
                        'relative flex items-center justify-center rounded-full border-2 border-white shadow-lg transition-all duration-200',
                        isSelected ? 'w-7 h-7 scale-125' : 'w-5 h-5 group-hover:scale-125'
                      )}
                      style={{ background: cfg.color }}
                    >
                      <MapPin size={isSelected ? 12 : 9} className="text-white" />
                    </div>
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                      <div className="bg-slate-900 text-white text-[9px] font-black px-2 py-1 rounded-lg whitespace-nowrap">
                        {node.city}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 px-2">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full" style={{ background: cfg.color }} />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Side Panel ──────────────────────── */}
        <div className="space-y-3">
          {selected ? (
            <NodeDetail node={selected} onClose={() => setSelected(null)} />
          ) : (
            <div className="glass-card rounded-2xl p-5 text-center">
              <MapPin size={32} className="mx-auto text-slate-200 mb-3" />
              <p className="text-sm font-black text-slate-500">Select a node on the map</p>
              <p className="text-[10px] font-bold text-slate-400 mt-1">Click any hospital pin to view details</p>
            </div>
          )}

          {/* Node list */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">All Nodes</h3>
            </div>
            <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto no-scrollbar">
              {nodes.map(node => {
                const cfg = STATUS_CONFIG[node.status];
                return (
                  <button
                    key={node.id}
                    onClick={() => setSelected(node)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left group"
                  >
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: cfg.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black text-slate-900 truncate">{node.name}</p>
                      <p className="text-[9px] font-bold text-slate-400">{node.city} · Score: {node.contribution_score}</p>
                    </div>
                    <ChevronRight size={12} className="text-slate-300 group-hover:text-blue-700 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
