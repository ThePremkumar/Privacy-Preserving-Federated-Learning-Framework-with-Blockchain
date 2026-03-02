'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  ShieldCheck, 
  Activity, 
  Database, 
  BrainCircuit, 
  Hospital,
  ChevronRight,
  LogOut,
  ChevronLeft,
  FileText,
  AlertTriangle,
  FileSearch,
  Heart
} from 'lucide-react';
import { useAuth, UserRole } from '@/hooks/useAuth';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavItem {
  name: string;
  icon: any;
  href: string;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', roles: ['super_admin', 'admin', 'hospital', 'doctor'] },
  { name: 'Patients', icon: Users, href: '/dashboard/patients', roles: ['super_admin', 'admin', 'hospital', 'doctor'] },
  { name: 'Predictions', icon: Activity, href: '/dashboard/predictions', roles: ['super_admin', 'admin', 'doctor'] },
  { name: 'Anomalies', icon: AlertTriangle, href: '/dashboard/anomalies', roles: ['super_admin', 'admin', 'doctor'] },
  { name: 'NLP Insights', icon: FileSearch, href: '/dashboard/nlp', roles: ['super_admin', 'admin', 'doctor'] },
  { name: 'Model Health', icon: Heart, href: '/dashboard/model-health', roles: ['super_admin', 'admin', 'hospital'] },
  { name: 'Federated Training', icon: BrainCircuit, href: '/dashboard/federated', roles: ['super_admin', 'admin', 'hospital'] },
  { name: 'Blockchain Trail', icon: ShieldCheck, href: '/dashboard/blockchain', roles: ['super_admin', 'admin'] },
  { name: 'Settings', icon: Settings, href: '/dashboard/settings', roles: ['super_admin', 'admin', 'hospital', 'doctor'] },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { user, hasRole } = useAuth();
  const [collapsed, setCollapsed] = React.useState(false);

  // Filter items based on user role
  const filteredItems = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div className={cn(
      "relative flex h-screen flex-col border-r border-slate-200 bg-white transition-all duration-300",
      collapsed ? "w-20" : "w-64"
    )}>
      <div className="flex h-16 items-center border-b border-slate-100 px-6 justify-between">
        <div className={cn("flex items-center gap-2", collapsed && "hidden")}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-100">
            <Activity size={18} />
          </div>
          <span className="text-lg font-black tracking-tight text-slate-900 leading-none">Health<span className="text-blue-600">Connect</span></span>
        </div>
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-blue-600 transition-all active:scale-95"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200",
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"
              )}
            >
              <item.icon className={cn(
                "shrink-0 transition-transform group-hover:scale-110",
                isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600"
              )} size={20} />
              {!collapsed && (
                <span className="truncate tracking-tight">{item.name}</span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="border-t border-slate-100 p-4">
        {user && !collapsed && (
          <div className="mb-4 flex items-center gap-3 px-2 py-3 rounded-xl bg-slate-50 border border-slate-100">
             <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 font-black text-xs">
                {user.name.charAt(0)}
             </div>
             <div className="flex flex-col">
                <span className="text-xs font-black text-slate-900 leading-none truncate w-32">{user.name}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.role.replace('_', ' ')}</span>
             </div>
          </div>
        )}
        <button className={cn(
          "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-500 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
        )}>
          <LogOut size={20} className="shrink-0" />
          {!collapsed && <span className="tracking-tight">Sign Out</span>}
        </button>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};
