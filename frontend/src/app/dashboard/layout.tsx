'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  Hospital,
  Building2,
  ExternalLink
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const roleConfig: Record<string, { label: string; orgLabel: string; color: string; bgColor: string }> = {
  super_admin: { label: 'Super Admin', orgLabel: 'HealthConnect Platform', color: 'text-indigo-600', bgColor: 'bg-indigo-50 border-indigo-100' },
  admin: { label: 'Admin', orgLabel: 'HealthConnect Platform', color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-100' },
  hospital: { label: 'Organization Admin', orgLabel: 'Hospital Node', color: 'text-emerald-600', bgColor: 'bg-emerald-50 border-emerald-100' },
  doctor: { label: 'Clinical Doctor', orgLabel: 'Medical Staff', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-100' },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const alertsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const config = user ? roleConfig[user.role] || roleConfig.doctor : roleConfig.doctor;

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (alertsRef.current && !alertsRef.current.contains(e.target as Node)) setIsAlertsOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setIsProfileOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const alerts = [
    { title: 'High-Risk Prediction', msg: 'Risk prediction alert detected', type: 'error', time: 'Recent' },
    { title: 'Model Drift Detected', msg: 'Feature distribution shift on a node', type: 'warning', time: 'Recent' },
    { title: 'Blockchain Verified', msg: 'Latest round immutably stored', type: 'success', time: 'Recent' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden scroll-smooth">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-100 bg-white/90 backdrop-blur-xl px-6 shadow-sm shadow-slate-100/50">
          {/* Left: Org Name + Breadcrumb */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-slate-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-900">{config.orgLabel}</span>
            </div>
            <div className="hidden md:flex items-center">
              <div className="h-4 w-px bg-slate-200 mx-3" />
              <div className="relative group max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-600 transition-colors" size={14} />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="h-8 w-56 rounded-lg bg-slate-50 pl-9 pr-3 text-[11px] font-bold transition-all border border-slate-100 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none focus:w-80"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative" ref={alertsRef}>
              <button 
                onClick={() => { setIsAlertsOpen(!isAlertsOpen); setIsProfileOpen(false); }}
                className={cn(
                  "relative rounded-xl p-2 transition-all duration-200",
                  isAlertsOpen ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-slate-400 hover:bg-slate-50 hover:text-blue-600"
                )}
              >
                <Bell size={18} />
                {!isAlertsOpen && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white" />}
              </button>

              {isAlertsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white shadow-2xl shadow-slate-200/80 border border-slate-100 overflow-hidden z-50">
                   <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/50">
                      <div className="flex items-center justify-between">
                         <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Alerts</h4>
                         <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest cursor-pointer hover:underline">Mark Read</span>
                      </div>
                   </div>
                   <div className="divide-y divide-slate-50 max-h-[320px] overflow-y-auto">
                      {alerts.map((alert, i) => (
                        <div key={i} className="px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                           <div className="flex gap-3">
                              <div className={cn(
                                "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                                alert.type === 'error' ? "bg-red-50 text-red-600" : 
                                alert.type === 'warning' ? "bg-amber-50 text-amber-600" :
                                "bg-emerald-50 text-emerald-700"
                              )}>
                                 {alert.type === 'error' ? <AlertTriangle size={14} /> : 
                                  alert.type === 'warning' ? <ShieldCheck size={14} /> : <Zap size={14} />}
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                 <div className="flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight truncate">{alert.title}</span>
                                    <span className="text-[9px] font-bold text-slate-400 shrink-0">{alert.time}</span>
                                 </div>
                                 <p className="text-[10px] font-medium text-slate-500 leading-relaxed truncate">{alert.msg}</p>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                   <div className="px-5 py-3 bg-slate-50 text-center border-t border-slate-100">
                      <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">View All →</button>
                   </div>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-slate-100 mx-1" />
            
            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => { setIsProfileOpen(!isProfileOpen); setIsAlertsOpen(false); }}
                className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-slate-50 transition-all group"
              >
                <div className="flex flex-col items-end">
                  <span className="text-[11px] font-black tracking-tight text-slate-900 uppercase group-hover:text-blue-600 transition-colors">{user?.username || 'Guest'}</span>
                  <span className={cn("text-[9px] font-black uppercase tracking-widest px-1.5 py-0 rounded border", config.bgColor, config.color)}>
                    {config.label}
                  </span>
                </div>
                <div className="relative">
                   <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 border border-slate-200 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <User size={16} />
                   </div>
                   <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <ChevronDown size={12} className={cn("text-slate-400 transition-transform", isProfileOpen && "rotate-180")} />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-2xl shadow-slate-200/80 border border-slate-100 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50">
                    <p className="text-xs font-black text-slate-900 truncate">{user?.username}</p>
                    <p className="text-[10px] font-medium text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <div className="p-2">
                    <button 
                      onClick={() => { router.push('/dashboard/settings'); setIsProfileOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all"
                    >
                      <Settings size={14} /> Profile Settings
                    </button>
                    <button 
                      onClick={() => { logout(); setIsProfileOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
