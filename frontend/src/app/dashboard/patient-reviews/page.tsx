'use client';

import React, { useState } from 'react';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { ClipboardCheck, CheckCheck, ListFilter, Search } from 'lucide-react';
import { useReferrals } from '@/hooks/useReferrals';
import { ReferralList } from '@/components/reviews/ReferralList';
import { ReferralDetailPanel } from '@/components/reviews/ReferralDetailPanel';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export default function PatientReviewsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { referrals, fetchReferrals, markAsRead, submitReview } = useReferrals(activeTab);

  const filteredReferrals = referrals.filter(r => 
    (r.patient?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    r.sending_doctor.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedReferral = referrals.find(r => r.id === selectedId);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const ref = referrals.find(r => r.id === id);
    if (ref && ref.notification && !ref.notification.is_read) {
      markAsRead(id);
    }
  };

  const handleReviewSubmit = async (review: { status: string; admin_notes: string; priority: string }) => {
    if (!selectedId) return;
    await submitReview(selectedId, review);
    // Optionally deselect or keep selected, keeping selected to see updated status
  };

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'reviewed', label: 'Reviewed' },
    { id: 'flagged', label: 'Flagged' }
  ];

  return (
    <RoleGuard allowedRoles={['hospital']}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-tight">Patient <span className="text-blue-600">Reviews</span></h1>
            <p className="mt-2 text-base font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <ClipboardCheck size={16} className="text-blue-600" /> Referrals and records sent by your doctors
            </p>
          </div>
          <div className="flex gap-4">
             <Button variant="outline" className="h-12 bg-white font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-slate-900">
                <ListFilter size={16} className="mr-2" /> Filter
             </Button>
             <Button variant="outline" className="h-12 bg-white font-black text-[10px] uppercase tracking-widest text-blue-600 border-blue-200 hover:bg-blue-50">
                <CheckCheck size={16} className="mr-2" /> Mark all read
             </Button>
          </div>
        </div>

        {/* Filters & Tabs */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex gap-2 p-1.5 bg-slate-100 rounded-xl w-full md:w-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedId(null); }}
                className={cn(
                  "px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                  activeTab === tab.id ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {tab.label} {tab.id === 'pending' && <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full text-[9px]">
                  {referrals.filter(r=>r.status==='pending').length}
                </span>}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="SEARCH PATIENTS..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Main Content Split */}
        <div className="flex-1 flex gap-6 min-h-0 pb-10">
          {/* Left: List */}
          <div className={cn(
            "w-full md:w-[380px] flex-shrink-0 overflow-y-auto custom-scrollbar h-[calc(100vh-280px)] pb-20",
            selectedId && "hidden md:block" // Hide on mobile if a detail is open
          )}>
            <ReferralList 
              referrals={filteredReferrals} 
              selectedId={selectedId} 
              onSelect={handleSelect} 
            />
          </div>

          {/* Right: Detail */}
          <div className={cn(
            "flex-1 min-w-0 h-full",
            !selectedId && "hidden md:flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200"
          )}>
            {selectedReferral ? (
              <ReferralDetailPanel 
                referral={selectedReferral} 
                onClose={() => setSelectedId(null)}
                onSubmitReview={handleReviewSubmit}
              />
            ) : (
              <div className="text-center">
                <ClipboardCheck size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-black text-slate-700 italic">Select a referral</h3>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-2">Choose a patient from the list to begin review</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </RoleGuard>
  );
}
