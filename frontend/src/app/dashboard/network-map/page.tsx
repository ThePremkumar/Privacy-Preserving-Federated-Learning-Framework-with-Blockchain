'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Search, Map as MapIcon, Activity, Filter, ChevronRight } from 'lucide-react';
import { HospitalNode } from './types';
import MapOverlays from './MapOverlays';
import HospitalSidePanel from './HospitalSidePanel';
import { AnimatePresence } from 'framer-motion';

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

const MOCK_HOSPITALS: HospitalNode[] = [
  { id: 'h1', name: 'Apollo Hospitals', city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, status: 'active', lastSeen: 'Just now', trainingJobs: 12, approvedJobs: 10, privacyBudgetUsed: 3.2, contributionScore: 87, isActive: true },
  { id: 'h2', name: 'AIIMS Delhi', city: 'New Delhi', state: 'Delhi', lat: 28.5672, lng: 77.2100, status: 'active', lastSeen: '5 min ago', trainingJobs: 18, approvedJobs: 16, privacyBudgetUsed: 5.1, contributionScore: 94, isActive: true },
  { id: 'h3', name: 'Fortis Bangalore', city: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946, status: 'idle', lastSeen: '3 hours ago', trainingJobs: 7, approvedJobs: 5, privacyBudgetUsed: 1.8, contributionScore: 61, isActive: true },
  { id: 'h4', name: 'Kokilaben Hospital', city: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777, status: 'active', lastSeen: '12 min ago', trainingJobs: 15, approvedJobs: 13, privacyBudgetUsed: 4.4, contributionScore: 91, isActive: true },
  { id: 'h5', name: 'PGIMER', city: 'Chandigarh', state: 'Punjab', lat: 30.7333, lng: 76.7794, status: 'offline', lastSeen: '2 days ago', trainingJobs: 3, approvedJobs: 2, privacyBudgetUsed: 0.6, contributionScore: 22, isActive: false },
  { id: 'h6', name: 'Narayana Health', city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639, status: 'idle', lastSeen: '6 hours ago', trainingJobs: 9, approvedJobs: 7, privacyBudgetUsed: 2.3, contributionScore: 55, isActive: true },
  { id: 'h7', name: 'Care Hospitals', city: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867, status: 'active', lastSeen: '1 min ago', trainingJobs: 11, approvedJobs: 10, privacyBudgetUsed: 3.9, contributionScore: 83, isActive: true },
  { id: 'h8', name: 'Medanta', city: 'Gurugram', state: 'Haryana', lat: 28.4595, lng: 77.0266, status: 'idle', lastSeen: '4 hours ago', trainingJobs: 6, approvedJobs: 4, privacyBudgetUsed: 1.1, contributionScore: 48, isActive: true },
];

export default function NetworkMapPage() {
  const [nodes, setNodes] = useState<HospitalNode[]>(MOCK_HOSPITALS);
  const [selectedNode, setSelectedNode] = useState<HospitalNode | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'idle' | 'offline'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // TODO: Replace with API call
  /*
  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const res = await api.get('/auth/hospitals');
        // Map and set nodes...
      } catch (err) { console.error(err); }
    };
    fetchNodes();
  }, []);
  */

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
