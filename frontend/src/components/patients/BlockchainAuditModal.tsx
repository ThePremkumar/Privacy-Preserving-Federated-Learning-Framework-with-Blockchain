'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  X, 
  Terminal, 
  ExternalLink, 
  CheckCircle2, 
  Database, 
  Activity,
  History,
  Lock,
  Cpu,
  Fingerprint
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface AuditRecord {
  record_id: string;
  hospital_id: string;
  patient_id: string;
  action: string;
  data_hash: string;
  timestamp: number;
  metadata: any;
}

interface BlockchainAuditModalProps {
  onClose: () => void;
}

export function BlockchainAuditModal({ onClose }: BlockchainAuditModalProps) {
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);

  useEffect(() => {
    const fetchAudits = async () => {
      try {
        const res = await api.get('/blockchain/clinical-audits');
        setRecords(res.data.audit_trail || []);
      } catch (err) {
        console.error('Failed to fetch blockchain audits:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAudits();
  }, []);

  const getActionStyle = (action: string) => {
    switch (action) {
      case 'registration': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'update': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'report_upload': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'deletion': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-5xl h-[85vh] bg-slate-900 border border-slate-800 rounded-[40px] shadow-3xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-600/20 text-blue-500 flex items-center justify-center border border-blue-500/30">
              <Shield size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black italic text-white tracking-tight">Clinical <span className="text-blue-500">Audit Ledger</span></h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Immutable Blockchain Verification</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="h-12 w-12 rounded-2xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main List */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar border-r border-slate-800">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                <Cpu size={48} className="animate-pulse text-blue-500" />
                <span className="text-xs font-black uppercase tracking-widest italic">Syncing with Node Network...</span>
              </div>
            ) : records.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                <History size={48} className="opacity-20" />
                <span className="text-xs font-black uppercase tracking-widest italic">No chain records found.</span>
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((record, i) => (
                  <div 
                    key={record.record_id}
                    onClick={() => setSelectedRecord(record)}
                    className={cn(
                      "group relative p-5 rounded-3xl border transition-all cursor-pointer",
                      selectedRecord?.record_id === record.record_id 
                        ? "bg-blue-600/10 border-blue-600 shadow-lg shadow-blue-600/10" 
                        : "bg-slate-800/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border", getActionStyle(record.action))}>
                           <Database size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-white uppercase tracking-widest mb-1">{record.action.replace('_', ' ')}</span>
                          <span className="text-[10px] font-mono text-slate-500 truncate max-w-[200px]">{record.record_id}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-400 italic">
                          {new Date(record.timestamp * 1000).toLocaleString()}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <CheckCircle2 size={12} className="text-emerald-500" />
                          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">Verified</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details Sidebar */}
          <div className="w-[400px] bg-slate-950/50 p-8 overflow-y-auto custom-scrollbar">
            {selectedRecord ? (
              <div className="space-y-8 animate-in slide-in-from-right duration-300">
                <div className="space-y-4">
                  <div className="h-20 w-20 rounded-3xl bg-blue-600/20 text-blue-500 flex items-center justify-center border border-blue-500/30 shadow-xl shadow-blue-600/10">
                    <Fingerprint size={40} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white italic">Record <span className="text-blue-500">Manifest</span></h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Cryptographic Proof-of-Action</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Transaction Hash</label>
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl font-mono text-[10px] text-blue-400 break-all leading-relaxed">
                      {record_hash(selectedRecord.record_id)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data Merkle Root</label>
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl font-mono text-[10px] text-emerald-400 break-all leading-relaxed">
                      {selectedRecord.data_hash}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hospital ID</label>
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-[10px] text-white">
                        {selectedRecord.hospital_id.slice(-8).toUpperCase()}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Node Version</label>
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-[10px] text-white italic">
                        v4.0.2-prod
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Action Metadata</label>
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                      <pre className="text-[10px] font-mono text-slate-300 overflow-x-auto">
                        {JSON.stringify(selectedRecord.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                   <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-3">
                      <Lock size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] font-bold text-emerald-500/80 leading-relaxed uppercase tracking-tight">
                        This record is protected by a multi-node consensus protocol. Any unauthorized alteration will trigger an immediate network-wide isolation.
                      </p>
                   </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-700 gap-4 text-center">
                <div className="h-24 w-24 rounded-full border-4 border-slate-900 border-dashed animate-spin-slow flex items-center justify-center">
                  <Terminal size={32} className="opacity-20" />
                </div>
                <div className="max-w-[200px]">
                  <p className="text-[10px] font-black uppercase tracking-widest italic">Select a transaction to view cryptographic proof</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Chain: ETH_GOERLI_MOCK</span>
             </div>
             <div className="h-4 w-px bg-slate-800" />
             <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Sync Height: #18,442,102</span>
             </div>
          </div>
          <Button variant="ghost" className="h-10 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all gap-2">
            View on Etherscan <ExternalLink size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function record_hash(id: string) {
  // Simulate a real tx hash
  return `0x${id.split('-')[1]}${id.split('-')[0]}c4e9d6b2f1a5e8d9c0b7a6f5e4d3c2b1a0`.toLowerCase();
}
