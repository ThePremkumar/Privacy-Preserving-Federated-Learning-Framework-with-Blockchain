'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Search, Map as MapIcon, Activity, Filter, ChevronRight } from 'lucide-react';
import { HospitalNode } from './types';
import MapOverlays from './MapOverlays';
import HospitalSidePanel from './HospitalSidePanel';
import { AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

// Import MapView dynamically to avoid SSR issues with Leaflet
const MapView = dynamic(() => import('./MapView'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-50 flex items-center justify-center rounded-[32px] border border-slate-100">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Initializing Neural Map...</p>
      </div>
    </div>
  )
});

export default function NetworkMapPage() {
  const [nodes, setNodes] = useState<HospitalNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<HospitalNode | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'idle' | 'offline'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const res = await api.get('/admin/hospitals');
        // Map backend hospital data to HospitalNode interface
        const mappedNodes: HospitalNode[] = res.data.map((h: any) => {
          // Add a tiny random jitter to prevent overlapping
          const jitterLat = (Math.random() - 0.5) * 0.005;
          const jitterLng = (Math.random() - 0.5) * 0.005;
          
          return {
            id: h.id,
            name: h.name,
            city: h.city,
            state: h.state,
            lat: (h.lat || 20.5937 + (Math.random() * 10 - 5)) + jitterLat,
            lng: (h.lng || 78.9629 + (Math.random() * 10 - 5)) + jitterLng,
            status: h.status || 'active',
            lastSeen: 'Live',
            trainingJobs: h.training_jobs || 0,
            approvedJobs: h.approved_jobs || 0,
            privacyBudgetUsed: h.privacy_budget_used || 0,
            contributionScore: h.contribution_score || 0,
            isActive: true
          };
        });
        setNodes(mappedNodes);
      } catch (err) { 
        console.error('Failed to fetch hospital nodes:', err); 
      }
    };
    fetchNodes();
  }, []);

  const filteredNodes = useMemo(() => {
    return nodes.filter(n => {
      const matchesFilter = filter === 'all' || n.status === filter;
      const matchesSearch = n.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           n.city.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [nodes, filter, searchQuery]);

  const activeCount = nodes.filter(n => n.status === 'active').length;
  const idleCount = nodes.filter(n => n.status === 'idle').length;
  const offlineCount = nodes.filter(n => n.status === 'offline').length;

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col space-y-4 animate-fade-in">
      {/* Header & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic uppercase">
            Hospital <span className="text-blue-600">Network Map</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Activity size={12} className="text-blue-600" /> 
            {nodes.length} Nodes &bull; {activeCount} Active &bull; {idleCount} Idle &bull; {offlineCount} Offline
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search hospitals..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all w-64 italic"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-100">
            {(['all', 'active', 'idle', 'offline'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === f 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative">
        <MapView 
          nodes={filteredNodes} 
          onNodeClick={setSelectedNode} 
          selectedNode={selectedNode}
        />
        
        {/* Overlays */}
        <MapOverlays nodes={nodes} />

        {/* Side Panel */}
        <AnimatePresence>
          {selectedNode && (
            <HospitalSidePanel 
              hospital={selectedNode} 
              onClose={() => setSelectedNode(null)} 
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
