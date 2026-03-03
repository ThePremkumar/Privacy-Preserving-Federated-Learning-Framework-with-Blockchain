'use client';

import React, { useState } from 'react';
import {
  GitBranch,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  RotateCcw,
  Play,
  Pause,
  Shield,
  Cpu,
  Layers,
  RefreshCw,
  Settings,
  Zap,
  ChevronRight,
  History,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const modelVersions = [
  { version: 'v2.4.1', status: 'Active', accuracy: '94.8%', rounds: 482, date: '2024-03-01', author: 'FedAvg Aggregation', approvedBy: 'superadmin' },
  { version: 'v2.3.0', status: 'Archived', accuracy: '92.1%', rounds: 420, date: '2024-02-15', author: 'FedAvg Aggregation', approvedBy: 'superadmin' },
  { version: 'v2.2.0', status: 'Archived', accuracy: '89.5%', rounds: 385, date: '2024-01-28', author: 'FedAvg Aggregation', approvedBy: 'admin' },
  { version: 'v2.1.0', status: 'Rolled Back', accuracy: '87.2%', rounds: 340, date: '2024-01-10', author: 'FedAvg + DP Noise', approvedBy: 'superadmin' },
  { version: 'v2.0.0', status: 'Archived', accuracy: '85.0%', rounds: 280, date: '2023-12-20', author: 'Initial LSTM Deploy', approvedBy: 'admin' },
];

const pendingModels = [
  { name: 'CNN-ResNet Hybrid', submittedBy: 'Node-112 (Hopkins)', date: '2h ago', type: 'New Architecture' },
  { name: 'XGBoost Ensemble Layer', submittedBy: 'Node-142 (Stanford)', date: '1d ago', type: 'Enhancement' },
];

const policyConfig = [
  { label: 'Aggregation Frequency', value: 'Every 6 hours', icon: Clock },
  { label: 'Min Node Quorum', value: '5 / 12 nodes', icon: Layers },
  { label: 'Privacy Budget ε', value: '1.0 per round', icon: Shield },
  { label: 'Auto-Rollback', value: 'Enabled (< 85% acc)', icon: RotateCcw },
];

export default function ModelGovernancePage() {
  const [selectedVersion, setSelectedVersion] = useState(modelVersions[0].version);

  return (
    <RoleGuard allowedRoles={['super_admin', 'admin']}>
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">Model <span className="text-blue-600">Governance</span></h1>
          <p className="mt-1 text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
             <GitBranch size={14} className="text-blue-600" /> Version Control, Approval & Policy Management
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="h-11 px-6 border-2">
            <Settings size={16} className="mr-2" /> Training Policy
          </Button>
          <Button className="h-11 px-6 shadow-xl shadow-blue-200">
            <Zap size={16} className="mr-2" /> Force Aggregation
          </Button>
        </div>
      </div>

      {/* Active Model Card */}
      <Card className="border-none shadow-2xl shadow-slate-100 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 text-blue-500/10 opacity-20 transform translate-x-1/4 -translate-y-1/4">
          <Cpu size={300} />
        </div>
        <CardContent className="p-8 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="h-16 w-16 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-600/30">
                <Cpu size={32} />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-black italic">LSTM Healthcare Model</h2>
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-500/30">Active</span>
                </div>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Version v2.4.1 • 482 Rounds Complete • 112 Participating Nodes</p>
              </div>
            </div>
            <div className="flex gap-8">
              <div className="text-center">
                <p className="text-3xl font-black text-blue-400 italic">94.8%</p>
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Accuracy</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-emerald-400 italic">0.155</p>
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Loss</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Version History */}
        <Card className="lg:col-span-7 border-none shadow-2xl shadow-slate-100 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-5 p-6">
            <div>
              <CardTitle className="text-xl font-black">Version <span className="text-blue-600">History</span></CardTitle>
              <CardDescription className="text-sm font-bold text-slate-400">Model checkpoints with rollback capability</CardDescription>
            </div>
            <History size={18} className="text-slate-300" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {modelVersions.map((model) => (
                <div
                  key={model.version}
                  onClick={() => setSelectedVersion(model.version)}
                  className={cn(
                    "flex items-center justify-between px-6 py-5 cursor-pointer transition-all border-l-4 group",
                    selectedVersion === model.version ? "bg-blue-50/50 border-blue-600" : "hover:bg-slate-50 border-transparent"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center font-mono text-xs font-black border",
                      model.status === 'Active' ? "bg-blue-600 text-white border-blue-700" :
                      model.status === 'Rolled Back' ? "bg-amber-50 text-amber-700 border-amber-100" :
                      "bg-slate-50 text-slate-500 border-slate-100"
                    )}>
                      {model.version.slice(0, 4)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-slate-900">{model.version}</p>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                          model.status === 'Active' ? "bg-emerald-100 text-emerald-700" :
                          model.status === 'Rolled Back' ? "bg-amber-100 text-amber-700" :
                          "bg-slate-100 text-slate-500"
                        )}>
                          {model.status}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">{model.author} • {model.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900">{model.accuracy}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{model.rounds} rounds</p>
                    </div>
                    {model.status === 'Archived' && (
                      <Button size="sm" variant="outline" className="h-7 px-3 text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                        <RotateCcw size={10} className="mr-1" /> Rollback
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right Panel */}
        <div className="lg:col-span-5 space-y-8">
          {/* Pending Approvals */}
          <Card className="border-none shadow-2xl shadow-slate-100">
            <CardHeader className="border-b border-slate-50 pb-5">
              <CardTitle className="text-lg font-black">Pending <span className="text-amber-600">Approvals</span></CardTitle>
              <CardDescription className="text-xs font-bold text-slate-400">New model submissions awaiting review</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {pendingModels.map((model, i) => (
                <div key={i} className="px-6 py-5 flex items-center justify-between border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">{model.name}</p>
                      <p className="text-[10px] font-bold text-slate-400">{model.submittedBy} • {model.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 px-3 text-[9px] font-black uppercase bg-emerald-600 hover:bg-emerald-700 shadow-sm">Approve</Button>
                    <Button size="sm" variant="outline" className="h-7 px-3 text-[9px] font-black uppercase text-red-500 border-red-200 hover:bg-red-50">Reject</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Training Policy */}
          <Card className="border-none shadow-2xl shadow-slate-100">
            <CardHeader className="border-b border-slate-50 pb-5">
              <CardTitle className="text-lg font-black">Global <span className="text-blue-600">Training Policy</span></CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {policyConfig.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 group hover:border-blue-100 transition-all">
                  <div className="flex items-center gap-3">
                    <item.icon size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                    <span className="text-xs font-bold text-slate-600">{item.label}</span>
                  </div>
                  <span className="text-xs font-black text-slate-900">{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </RoleGuard>
  );
}
