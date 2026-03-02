'use client';

import React from 'react';
import { 
  BrainCircuit, 
  Activity, 
  ShieldCheck, 
  Database,
  RefreshCcw,
  Plus,
  ArrowUpRight,
  Hospital as HospitalIcon,
  Globe,
  Loader2,
  ChevronRight,
  TrendingUp,
  Cpu,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { RoleGuard } from '@/components/guards/RoleGuard';

const flData = [
  { round: 1, accuracy: 68, loss: 0.85 },
  { round: 2, accuracy: 72, loss: 0.72 },
  { round: 3, accuracy: 78, loss: 0.61 },
  { round: 4, accuracy: 81, loss: 0.52 },
  { round: 5, accuracy: 84, loss: 0.44 },
  { round: 6, accuracy: 88, loss: 0.38 },
  { round: 7, accuracy: 91, loss: 0.31 },
  { round: 8, accuracy: 94, loss: 0.26 },
];

const nodes = [
  { name: 'Node-101 (Mayo)', status: 'Active', latency: '24ms', contribution: 450 },
  { name: 'Node-112 (Hopkins)', status: 'Active', latency: '42ms', contribution: 820 },
  { name: 'Node-142 (Stanford)', status: 'Active', latency: '18ms', contribution: 310 },
  { name: 'Node-156 (Cleveland)', status: 'Idle', latency: '-', contribution: 200 },
];

export default function FederatedTrainingPage() {
  const [isSyncing, setIsSyncing] = React.useState(false);

  return (
    <RoleGuard allowedRoles={['super_admin', 'admin', 'hospital']}>
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-tight">Federated <span className="text-blue-600">Model Orchestration</span></h1>
          <p className="mt-2 text-base font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <BrainCircuit size={16} className="text-blue-600" /> Multi-Institutional Model Training Loop
          </p>
        </div>
        <div className="flex gap-4">
           <Button variant="outline" className="h-12 border-2 px-6" onClick={() => setIsSyncing(true)}>
              {isSyncing ? <RefreshCcw className="animate-spin mr-2" size={18} /> : <RefreshCcw className="mr-2" size={18} />} Refresh Network
           </Button>
           <Button className="h-12 px-8 shadow-xl shadow-blue-200">Initialize New Round <Plus size={18} className="ml-2" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Convergence Chart */}
        <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-100">
           <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-6">
              <div>
                <CardTitle className="text-2xl font-black">Global <span className="text-blue-600">Convergence</span></CardTitle>
                <CardDescription className="text-base font-bold text-slate-400">Accuracy & Loss trends across training rounds</CardDescription>
              </div>
              <div className="flex gap-2">
                 <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 italic">Accuracy</div>
                 <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100 italic">Loss</div>
              </div>
           </CardHeader>
           <CardContent className="h-[400px] w-full pt-8 -ml-8">
              <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={flData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="round" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 700, fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 700, fontSize: 12}} />
                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 50px -12px rgb(0 0 0 / 0.1)'}} />
                    <Line type="monotone" dataKey="accuracy" stroke="#2563eb" strokeWidth={5} dot={{r: 6, fill: '#2563eb', strokeWidth: 2, stroke: '#fff'}} />
                    <Line type="monotone" dataKey="loss" stroke="#ef4444" strokeWidth={5} strokeDasharray="10 5" dot={{r: 6, fill: '#ef4444', strokeWidth: 2, stroke: '#fff'}} />
                 </LineChart>
              </ResponsiveContainer>
           </CardContent>
        </Card>

        {/* Node Distribution */}
        <Card className="border-none shadow-2xl shadow-slate-100">
           <CardHeader className="border-b border-slate-50 pb-6">
              <CardTitle className="text-2xl font-black">Active <span className="text-blue-600">Nodes</span></CardTitle>
              <CardDescription className="text-base font-bold text-slate-400">Institutional participants</CardDescription>
           </CardHeader>
           <CardContent className="p-0">
               <div className="space-y-4 pt-6">
                  {nodes.map(node => (
                    <div key={node.name} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors cursor-pointer group">
                       <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 flex items-center justify-center rounded-xl ${node.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                             <HospitalIcon size={20} className="group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-sm font-black text-slate-900 leading-none">{node.name}</span>
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{node.latency} Latency</span>
                          </div>
                       </div>
                       <ChevronRight size={16} className="text-slate-300" />
                    </div>
                  ))}
               </div>
               <div className="p-6 border-t border-slate-50 mt-4">
                  <Button variant="ghost" className="w-full text-blue-600 font-black tracking-widest uppercase text-[10px] h-10 hover:bg-blue-50">View Network Map <Globe size={14} className="ml-2" /></Button>
               </div>
           </CardContent>
        </Card>
      </div>

      {/* Global Configuration Grid */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
         <ConfigItem label="Privacy Budget" value="ε = 1.0" icon={ShieldCheck} desc="Differential Privacy Budget" />
         <ConfigItem label="Min Nodes" value="5 / 12" icon={Layers} desc="Required for aggregation" />
         <ConfigItem label="Epochs / Round" value="3" icon={RefreshCcw} desc="Local training passes" />
         <ConfigItem label="Aggregator" value="FedAvg" icon={Cpu} desc="Aggregation algorithm" />
      </div>
    </div>
    </RoleGuard>
  );
}

const ConfigItem = ({ label, value, icon: Icon, desc }: any) => (
  <Card className="border-none shadow-xl shadow-slate-100 hover:shadow-2xl transition-all duration-300">
     <CardContent className="p-6">
        <div className="flex items-start justify-between">
           <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <Icon size={20} />
           </div>
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Configured</span>
        </div>
        <div className="mt-6">
           <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</h4>
           <p className="text-xl font-black text-slate-900 leading-tight mt-1">{value}</p>
           <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{desc}</p>
        </div>
     </CardContent>
  </Card>
);
