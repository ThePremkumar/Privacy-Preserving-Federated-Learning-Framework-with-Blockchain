'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  Heart,
  Building2,
  UserCog,
  GitBranch,
  Network,
  ScrollText,
  Lock,
  BarChart3,
  Stethoscope,
  Upload,
  Cpu,
  ClipboardList,
  UserPlus,
  FlaskConical,
  Eye,
  PlusCircle,
  History,
  Bell,
  type LucideIcon
} from 'lucide-react';
import { useAuth, UserRole } from '@/hooks/useAuth';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavItem {
  name: string;
  icon: LucideIcon;
  href: string;
  badge?: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

// ── Super Admin Navigation ──
const superAdminNav: NavSection[] = [
  {
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    ]
  },
  {
    title: 'Platform Governance',
    items: [
      { name: 'Organizations', icon: Building2, href: '/dashboard/organizations' },
      { name: 'User Management', icon: UserCog, href: '/dashboard/admin-management' },
      { name: 'Model Governance', icon: GitBranch, href: '/dashboard/model-governance' },
    ]
  },
  {
    title: 'Network & Audit',
    items: [
      { name: 'Network Monitor', icon: Network, href: '/dashboard/federated' },
      { name: 'Blockchain Audit', icon: ShieldCheck, href: '/dashboard/blockchain' },
      { name: 'Model Health', icon: Heart, href: '/dashboard/model-health' },
    ]
  },
  {
    title: 'Compliance',
    items: [
      { name: 'Compliance & Security', icon: Lock, href: '/dashboard/compliance' },
      { name: 'Reports & Analytics', icon: BarChart3, href: '/dashboard/reports' },
      { name: 'System Settings', icon: Settings, href: '/dashboard/settings' },
    ]
  }
];

// ── Organization Admin (Hospital) Navigation ──
const hospitalAdminNav: NavSection[] = [
  {
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    ]
  },
  {
    title: 'Management',
    items: [
      { name: 'Doctor Management', icon: Stethoscope, href: '/dashboard/doctor-management' },
      { name: 'Patient Management', icon: Users, href: '/dashboard/patients' },
    ]
  },
  {
    title: 'Data & Training',
    items: [
      { name: 'Local Data Upload', icon: Upload, href: '/dashboard/data-upload' },
      { name: 'Model Participation', icon: Cpu, href: '/dashboard/federated' },
      { name: 'Local Reports', icon: ClipboardList, href: '/dashboard/reports' },
    ]
  },
  {
    title: 'Compliance',
    items: [
      { name: 'Audit Logs', icon: ScrollText, href: '/dashboard/audit-logs' },
      { name: 'Profile Settings', icon: Settings, href: '/dashboard/settings' },
    ]
  }
];

// ── Admin Navigation ──
const adminNav: NavSection[] = [
  {
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    ]
  },
  {
    title: 'Administration',
    items: [
      { name: 'Organizations', icon: Building2, href: '/dashboard/organizations' },
      { name: 'Model Governance', icon: GitBranch, href: '/dashboard/model-governance' },
    ]
  },
  {
    title: 'Monitoring',
    items: [
      { name: 'Network Monitor', icon: Network, href: '/dashboard/federated' },
      { name: 'Model Health', icon: Heart, href: '/dashboard/model-health' },
      { name: 'Blockchain Audit', icon: ShieldCheck, href: '/dashboard/blockchain' },
    ]
  },
  {
    title: 'Reports',
    items: [
      { name: 'Reports & Analytics', icon: BarChart3, href: '/dashboard/reports' },
      { name: 'Settings', icon: Settings, href: '/dashboard/settings' },
    ]
  }
];

// ── Doctor Navigation ──
const doctorNav: NavSection[] = [
  {
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    ]
  },
  {
    title: 'Clinical',
    items: [
      { name: 'My Patients', icon: Users, href: '/dashboard/patients' },
      { name: 'New Prediction', icon: PlusCircle, href: '/dashboard/predictions' },
      { name: 'Prediction History', icon: History, href: '/dashboard/prediction-history' },
    ]
  },
  {
    title: 'Intelligence',
    items: [
      { name: 'Anomaly Alerts', icon: AlertTriangle, href: '/dashboard/anomalies', badge: '4' },
      { name: 'NLP Insights', icon: FileSearch, href: '/dashboard/nlp' },
    ]
  },
  {
    title: 'Account',
    items: [
      { name: 'Profile', icon: Settings, href: '/dashboard/settings' },
    ]
  }
];

function getNavForRole(role: UserRole): NavSection[] {
  switch (role) {
    case 'super_admin': return superAdminNav;
    case 'admin': return adminNav;
    case 'hospital': return hospitalAdminNav;
    case 'doctor': return doctorNav;
    default: return doctorNav;
  }
}

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = React.useState(false);

  if (!user) return null;

  const navSections = getNavForRole(user.role);

  const roleLabels: Record<UserRole, { label: string; color: string }> = {
    super_admin: { label: 'Super Admin', color: 'bg-indigo-600' },
    admin: { label: 'Admin', color: 'bg-amber-600' },
    hospital: { label: 'Organization', color: 'bg-emerald-600' },
    doctor: { label: 'Doctor', color: 'bg-blue-600' },
  };

  const roleInfo = roleLabels[user.role];

  return (
    <div className={cn(
      "relative flex h-screen flex-col border-r border-slate-200/60 bg-white transition-all duration-300",
      collapsed ? "w-[76px]" : "w-[264px]"
    )}>
      {/* Brand Header */}
      <div className="flex h-[72px] items-center border-b border-slate-100 px-5 justify-between shrink-0">
        <div className={cn("flex items-center gap-2.5 overflow-hidden", collapsed && "hidden")}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200 shrink-0">
            <Activity size={18} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-black tracking-tight text-slate-900">Health<span className="text-blue-600">Connect</span></span>
            <span className={cn(
              "text-[8px] font-black uppercase tracking-[0.2em] mt-0.5 px-1.5 py-0.5 rounded text-white w-fit",
              roleInfo.color
            )}>
              {roleInfo.label}
            </span>
          </div>
        </div>
        {collapsed && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200 mx-auto shrink-0">
            <Activity size={18} />
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-blue-600 transition-all active:scale-95",
            collapsed && "hidden"
          )}
        >
          <ChevronLeft size={16} />
        </button>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className={cn(sIdx > 0 && "mt-6")}>
            {section.title && !collapsed && (
              <h4 className="px-3 mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400/80">
                {section.title}
              </h4>
            )}
            {sIdx > 0 && collapsed && (
              <div className="mx-3 mb-2 h-px bg-slate-100" />
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    title={collapsed ? item.name : undefined}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-bold transition-all duration-200 relative",
                      isActive 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200/60" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-blue-600",
                      collapsed && "justify-center px-0"
                    )}
                  >
                    <item.icon className={cn(
                      "shrink-0 transition-transform group-hover:scale-110",
                      isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600"
                    )} size={18} />
                    {!collapsed && (
                      <span className="truncate tracking-tight">{item.name}</span>
                    )}
                    {!collapsed && item.badge && (
                      <span className={cn(
                        "ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-md",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-red-100 text-red-600"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Card & Sign Out */}
      <div className="border-t border-slate-100 p-3 shrink-0">
        {user && !collapsed && (
          <div className="mb-2 flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-50/80 border border-slate-100">
             <div className={cn(
               "flex h-8 w-8 items-center justify-center rounded-lg text-white font-black text-xs shrink-0",
               roleInfo.color
             )}>
                {user.name.charAt(0).toUpperCase()}
             </div>
             <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-black text-slate-900 leading-none truncate">{user.name}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">{user.role.replace('_', ' ')}</span>
             </div>
          </div>
        )}
        <button 
          onClick={logout}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-bold text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all duration-200",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span className="tracking-tight">Sign Out</span>}
        </button>
      </div>

      {/* Collapsed expand button */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="absolute -right-3 top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-slate-200 shadow-md text-slate-400 hover:text-blue-600 transition-all"
        >
          <ChevronRight size={12} />
        </button>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
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
