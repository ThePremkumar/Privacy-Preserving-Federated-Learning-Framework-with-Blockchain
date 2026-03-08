'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Database,
  ExternalLink,
  Lock,
  Fingerprint,
  Clock,
  Server,
  Network,
  Globe,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Loader2,
  Hash,
  Layers,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { RoleGuard } from '@/components/guards/RoleGuard';
import api from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LedgerEntry {
  id: string;
  type: string;
  round: number;
  hash: string;
  tx_hash: string;
  status: string;
  hospitals: string[];
  samples: number;
  accuracy: string;
  loss: string;
  epsilon: string;
  timestamp: string;
}

export default function BlockchainAuditPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/blockchain/audit-trail');
      setEntries(res.data);
    } catch { setEntries([]); }
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredEntries = entries.filter(e => {
    const matchSearch = searchTerm === '' || e.hash.includes(searchTerm) || e.tx_hash.includes(searchTerm) || e.id.includes(searchTerm);
    const matchType = typeFilter === 'all' || e.type === typeFilter;
    return matchSearch && matchType;
  });

  const totalAggregations = entries.filter(e => e.type === 'aggregation').length;
  const totalSubmissions = entries.filter(e => e.type === 'training_submission').length;
  const totalSamples = entries.reduce((sum, e) => sum + (e.samples || 0), 0);

  return (
    <RoleGuard allowedRoles={['super_admin', 'admin']}>
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">Blockchain <span className="text-blue-600">Audit Trail</span></h1>
          <p className="mt-1 text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck size={14} className="text-blue-600" /> Immutable Integrity Verification Records
          </p>
        </div>
        <Button variant="outline" className="h-11 px-6 border-2" onClick={fetchData}>
          <RefreshCw size={16} className="mr-2" /> Refresh
        </Button>
      </div>

      {/* Chain Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <ChainStat label="Chain Status" value="Operational" icon={Globe} color="emerald" />
        <ChainStat label="Aggregation Rounds" value={totalAggregations.toString()} icon={Layers} color="blue" />
        <ChainStat label="Training Submissions" value={totalSubmissions.toString()} icon={Database} color="amber" />
        <ChainStat label="Total Samples Verified" value={totalSamples.toLocaleString()} icon={Fingerprint} color="purple" />
      </div>

      {/* Network Overview Card */}
      <Card className="border-none shadow-2xl shadow-slate-100 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 text-white/5"><Lock size={250} /></div>
        <CardContent className="p-8 relative">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-600/30">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black italic">Blockchain Network</h2>
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">
                Mock Chain (Development) • Chain ID: 1337 • {entries.length} Transactions Recorded
              </p>
            </div>
            <div className="ml-auto flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-black text-emerald-400">{totalAggregations}</p>
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">On-Chain Rounds</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-blue-400 font-mono">{entries.length > 0 ? entries[0].hash.substring(0, 8) + '...' : '—'}</p>
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Latest Hash</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search & Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search by hash, tx hash, or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-bold focus:border-blue-600 focus:ring-0 outline-none" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-bold focus:border-blue-600 focus:ring-0 outline-none bg-white">
          <option value="all">All Types</option>
          <option value="aggregation">Aggregation</option>
          <option value="training_submission">Training Submission</option>
        </select>
      </div>

      {/* Ledger */}
      <Card className="border-none shadow-2xl shadow-slate-100 overflow-hidden">
        <CardHeader className="border-b border-slate-50 pb-5 p-6">
          <CardTitle className="text-xl font-black">Immutable <span className="text-blue-600">Ledger</span></CardTitle>
          <CardDescription className="text-sm font-bold text-slate-400">{filteredEntries.length} records</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center"><Loader2 size={32} className="animate-spin mx-auto text-blue-600" /></div>
          ) : filteredEntries.length === 0 ? (
            <div className="p-12 text-center">
              <Database size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-400">No audit records yet</p>
              <p className="text-[10px] font-bold text-slate-300 mt-1">Records will appear after training submissions and aggregation rounds</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="px-6 py-5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border",
                        entry.type === 'aggregation' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-amber-50 text-amber-600 border-amber-100"
                      )}>
                        {entry.type === 'aggregation' ? <Globe size={18} /> : <Server size={18} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-slate-900">
                            {entry.type === 'aggregation' ? `Aggregation Round #${entry.round}` : 'Training Submission'}
                          </p>
                          <span className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                            entry.status === 'confirmed' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                            entry.status === 'aggregated' ? "bg-purple-50 text-purple-700 border-purple-100" :
                            "bg-amber-50 text-amber-700 border-amber-100"
                          )}>
                            {entry.status}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                          {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : '—'} • {entry.samples.toLocaleString()} samples • ε = {entry.epsilon}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs font-black text-emerald-600">Acc: {entry.accuracy ? (parseFloat(entry.accuracy) * 100).toFixed(1) + '%' : '—'}</p>
                        <p className="text-[10px] font-bold text-slate-400">Loss: {entry.loss || '—'}</p>
                      </div>
                      <button onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)} className="h-8 w-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-colors">
                        <Eye size={14} />
                      </button>
                    </div>
                  </div>

                  {expandedId === entry.id && (
                    <div className="mt-4 p-4 bg-slate-900 rounded-xl text-white space-y-2">
                      <div className="flex items-center gap-2">
                        <Hash size={12} className="text-blue-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Model Hash</span>
                      </div>
                      <p className="font-mono text-xs text-blue-400 break-all">{entry.hash || 'N/A'}</p>
                      {entry.tx_hash && (
                        <>
                          <div className="flex items-center gap-2 mt-2">
                            <Fingerprint size={12} className="text-emerald-400" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Transaction Hash</span>
                          </div>
                          <p className="font-mono text-xs text-emerald-400 break-all">{entry.tx_hash}</p>
                        </>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Network size={12} className="text-amber-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Participating Hospitals</span>
                      </div>
                      <p className="text-xs text-white/60">{entry.hospitals.join(', ') || 'N/A'}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </RoleGuard>
  );
}

function ChainStat({ label, value, icon: Icon, color }: any) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };
  return (
    <Card className="border-none shadow-xl shadow-slate-100 hover:shadow-2xl transition-all">
      <CardContent className="p-6">
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center border mb-4", colors[color])}>
          <Icon size={20} />
        </div>
        <p className="text-3xl font-black text-slate-900">{value}</p>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}
