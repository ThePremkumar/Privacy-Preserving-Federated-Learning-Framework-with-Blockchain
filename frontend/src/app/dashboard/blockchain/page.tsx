'use client';

import React from 'react';
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
  RefreshCcw,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { RoleGuard } from '@/components/guards/RoleGuard';

// Ledger data should be fetched from the blockchain audit API
const ledgerData: { id: string; round: number; hash: string; type: string; status: string; time: string; gas: string }[] = [];
// In production, populate from: GET /blockchain/audit-trail

export default function BlockchainAuditPage() {
  const [isVerifying, setIsVerifying] = React.useState(false);

  return (
    <RoleGuard allowedRoles={['super_admin', 'admin', 'hospital']}>
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-tight">Immutable <span className="text-blue-600">Audit Ledger</span></h1>
          <p className="mt-2 text-base font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <ShieldCheck size={16} className="text-blue-600" /> Decentralized Integrity Verification
          </p>
        </div>
        <div className="flex gap-4">
           <Button variant="outline" className="h-12 border-2 px-6" onClick={() => setIsVerifying(true)}>
              {isVerifying ? <RefreshCcw className="animate-spin mr-2" size={18} /> : <ShieldCheck className="mr-2" size={18} />} Verify Entire Chain
           </Button>
           <Button className="h-12 px-8 shadow-xl shadow-blue-200">Export Compliance Report <Database size={18} className="ml-2" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
         <ChainStat label="Current Block" value="—" icon={Network} />
         <ChainStat label="Smart Contract" value="—" icon={Lock} />
         <ChainStat label="Chain Integrity" value="—" icon={CheckCircle2} />
         <ChainStat label="Gas Efficiency" value="—" icon={Activity} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Ledger Table */}
        <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-100 h-full">
           <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-6">
              <div>
                <CardTitle className="text-2xl font-black">Audit <span className="text-blue-600">Transactions</span></CardTitle>
                <CardDescription className="text-base font-bold text-slate-400">Low-level blockchain activity log</CardDescription>
              </div>
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                 <input className="h-9 w-48 rounded-lg bg-slate-50 pl-8 pr-4 text-[10px] font-black uppercase tracking-widest border border-slate-100" placeholder="Tx Hash Search..." />
              </div>
           </CardHeader>
           <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="border-b border-slate-50 bg-slate-50/30">
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Transaction ID</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Type</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Round</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Merkle Hash</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {ledgerData.map(tx => (
                       <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-900">{tx.id}</td>
                          <td className="px-6 py-4">
                             <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${tx.type === 'Aggregation' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{tx.type}</span>
                          </td>
                          <td className="px-6 py-4 text-xs font-black text-slate-600">R-{tx.round}</td>
                          <td className="px-6 py-4 font-mono text-[10px] text-slate-400 group-hover:text-blue-600 transition-colors cursor-pointer">{tx.hash}</td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                                <CheckCircle2 size={12} /> {tx.status}
                             </div>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </CardContent>
        </Card>

        {/* Node Verification Panel */}
        <Card className="border-none shadow-2xl shadow-slate-100 bg-slate-900 text-white overflow-hidden relative">
           <div className="absolute top-0 right-0 p-8 text-blue-500/10">
              <ShieldCheck size={200} />
           </div>
           <CardHeader className="relative border-b border-white/5 pb-8 mb-8">
              <CardTitle className="text-white text-2xl font-black">Node <span className="text-blue-400">Trust Index</span></CardTitle>
              <CardDescription className="text-white/40 font-bold uppercase tracking-widest text-xs">Cryptographic verification</CardDescription>
           </CardHeader>
           <CardContent className="relative space-y-8">
               <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-white/60">Compliance Score</span>
                   <span className="text-4xl font-black text-blue-400 italic">—</span>
               </div>
               <div className="space-y-4">
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full w-0 bg-blue-500 shadow-lg shadow-blue-500/50" />
                  </div>
                  <p className="text-[10px] font-bold text-white/40 leading-relaxed uppercase tracking-widest">
                     Calculated using multi-party computation proof and verified against blockchain state.
                  </p>
               </div>
               <div className="pt-8 grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                     <p className="text-xs font-black text-blue-400 italic">Validated</p>
                     <p className="text-[10px] font-bold text-white/40 uppercase mt-1">Proof Type</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                     <p className="text-xs font-black text-emerald-400 italic">Active</p>
                     <p className="text-[10px] font-bold text-white/40 uppercase mt-1">Smart Monitor</p>
                  </div>
               </div>
           </CardContent>
           <div className="p-6 relative mt-auto">
              <Button className="w-full bg-white text-slate-900 hover:bg-white/90 h-14 font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-white/5">
                 Run Full Verifier
              </Button>
           </div>
        </Card>
      </div>
    </div>
    </RoleGuard>
  );
}

const ChainStat = ({ label, value, icon: Icon }: any) => (
  <Card className="border-none shadow-xl shadow-slate-100 hover:shadow-2xl transition-all duration-300">
     <CardContent className="p-6">
        <div className="mb-4 p-2 bg-blue-50 text-blue-600 rounded-lg w-fit border border-blue-100">
           <Icon size={18} />
        </div>
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">{label}</h4>
        <p className="text-xl font-black text-slate-900 leading-none mt-2 tracking-tight">{value}</p>
     </CardContent>
  </Card>
);

const Activity = ({ size }: any) => <Globe size={size} />;
