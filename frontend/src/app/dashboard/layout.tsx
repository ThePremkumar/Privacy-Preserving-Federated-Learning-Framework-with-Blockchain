'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { 
  Search, 
  Bell, 
  User, 
  Globe, 
  Settings, 
  ShieldCheck, 
  Zap, 
  AlertTriangle,
  ChevronDown,
  LogOut,
  ChevronRight,
  Info,
  Hospital
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '@/hooks/useAuth';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [language, setLanguage] = useState<'EN' | 'HI'>('EN');

  const alerts = [
    { title: 'High-Risk Prediction', msg: 'Sam Wilson alert (92% risk)', type: 'error', time: '2m' },
    { title: 'Model Drift Detected', msg: 'Glucose distribution shift @ Node 4', type: 'warning', time: '14m' },
    { title: 'Blockchain Verified', msg: 'Round #482 immutably stored', type: 'success', time: '1h' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden scroll-smooth">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-20 w-full items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-xl px-10 shadow-sm shadow-slate-200/20">
          <div className="flex w-1/2 items-center gap-6">
            <div className="relative w-full max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-600 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search institutional analytics, patients, or rounds..." 
                className="h-11 w-full rounded-2xl bg-slate-100/50 pl-11 pr-4 text-xs font-black uppercase tracking-widest transition-all border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:outline-none"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Language Toggle */}
            <button 
              onClick={() => setLanguage(l => l === 'EN' ? 'HI' : 'EN')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-all hover:bg-white shadow-sm"
            >
              <Globe size={14} />
              {language === 'EN' ? 'English' : 'हिंदी'}
            </button>

            <div className="relative">
              <button 
                onClick={() => setIsAlertsOpen(!isAlertsOpen)}
                className={cn(
                  "relative rounded-2xl p-2.5 transition-all duration-300",
                  isAlertsOpen ? "bg-blue-600 text-white shadow-xl shadow-blue-200" : "text-slate-400 hover:bg-slate-50 hover:text-blue-600"
                )}
              >
                <Bell size={22} className={cn(isAlertsOpen && "animate-none")} />
                {!isAlertsOpen && <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-blue-600 border-2 border-white animate-pulse" />}
              </button>

              {/* Alerts Dropdown */}
              {isAlertsOpen && (
                <div className="absolute right-0 mt-4 w-96 rounded-3xl bg-white shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                   <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                      <div className="flex items-center justify-between">
                         <h4 className="text-sm font-black text-slate-900 uppercase italic">Institutional <span className="text-blue-600">Alerts</span></h4>
                         <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest cursor-pointer hover:underline">Mark All Read</span>
                      </div>
                   </div>
                   <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
                      {alerts.map((alert, i) => (
                        <div key={i} className="p-5 hover:bg-slate-50 transition-colors cursor-pointer group">
                           <div className="flex gap-4">
                              <div className={cn(
                                "h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border",
                                alert.type === 'error' ? "bg-red-50 text-red-600 border-red-100" : 
                                alert.type === 'warning' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                "bg-emerald-50 text-emerald-700 border-emerald-100"
                              )}>
                                 {alert.type === 'error' ? <AlertTriangle size={20} /> : 
                                  alert.type === 'warning' ? <ShieldCheck size={20} /> : <Zap size={20} />}
                              </div>
                              <div className="space-y-1">
                                 <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-slate-900 uppercase tracking-tighter">{alert.title}</span>
                                    <span className="text-[9px] font-bold text-slate-400">{alert.time} ago</span>
                                 </div>
                                 <p className="text-[11px] font-medium text-slate-500 leading-relaxed italic">{alert.msg}</p>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                   <div className="p-4 bg-slate-50 text-center">
                      <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">See Critical History Archive →</button>
                   </div>
                </div>
              )}
            </div>

            <div className="h-8 w-[1px] bg-slate-100" />
            
            <div className="flex items-center gap-4 cursor-pointer group">
              <div className="flex flex-col items-end">
                <span className="text-xs font-black tracking-tight text-slate-900 uppercase group-hover:text-blue-600 transition-colors">{user?.username || 'GUEST-ID'}</span>
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-[0.15em] italic">{user?.role.replace('_', ' ') || 'UNAUTHORIZED'}</span>
              </div>
              <div className="relative">
                 <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 shadow-sm border border-slate-200 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <User size={22} className="group-hover:scale-110 transition-transform" />
                 </div>
                 <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white" />
              </div>
            </div>

          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-10 relative">
          <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none">
             <Hospital size={120} />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
