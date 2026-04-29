'use client';

import React, { useState, useCallback } from 'react';
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
  PlusCircle,
  History,
  Bell,
  Map,
  TrendingUp,
  LineChart,
  type LucideIcon,
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
  highlight?: boolean;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

// ── Super Admin Navigation ──────────────────────────────
const superAdminNav: NavSection[] = [
  {
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    ],
  },
  {
    title: 'Platform Governance',
    items: [
      { name: 'Organizations', icon: Building2, href: '/dashboard/organizations' },
      { name: 'User Management', icon: UserCog, href: '/dashboard/admin-management' },
      { name: 'Model Governance', icon: GitBranch, href: '/dashboard/model-governance' },
    ],
  },
  {
    title: 'Analytics & Network',
    items: [
      { name: 'Analytics', icon: LineChart, href: '/dashboard/analytics', highlight: true },
      { name: 'Network Monitor', icon: Network, href: '/dashboard/federated' },
      { name: 'Network Map', icon: Map, href: '/dashboard/network-map', highlight: true },
      { name: 'Model Comparison', icon: TrendingUp, href: '/dashboard/model-comparison', highlight: true },
    ],
  },
  {
    title: 'Compliance & Audit',
    items: [
      { name: 'Blockchain Audit', icon: ShieldCheck, href: '/dashboard/blockchain' },
      { name: 'Model Health', icon: Heart, href: '/dashboard/model-health' },
      { name: 'Privacy Budget', icon: Lock, href: '/dashboard/privacy-budget', highlight: true },
      { name: 'Compliance', icon: ScrollText, href: '/dashboard/compliance' },
      { name: 'Reports', icon: BarChart3, href: '/dashboard/reports' },
      { name: 'System Settings', icon: Settings, href: '/dashboard/settings' },
    ],
  },
];

// ── Admin Navigation ────────────────────────────────────
const adminNav: NavSection[] = [
  {
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { name: 'Organizations', icon: Building2, href: '/dashboard/organizations' },
      { name: 'Model Governance', icon: GitBranch, href: '/dashboard/model-governance' },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { name: 'Analytics', icon: LineChart, href: '/dashboard/analytics', highlight: true },
      { name: 'Network Monitor', icon: Network, href: '/dashboard/federated' },
      { name: 'Network Map', icon: Map, href: '/dashboard/network-map', highlight: true },
      { name: 'Model Comparison', icon: TrendingUp, href: '/dashboard/model-comparison', highlight: true },
    ],
  },
  {
    title: 'Monitoring',
    items: [
      { name: 'Model Health', icon: Heart, href: '/dashboard/model-health' },
      { name: 'Blockchain Audit', icon: ShieldCheck, href: '/dashboard/blockchain' },
      { name: 'Privacy Budget', icon: Lock, href: '/dashboard/privacy-budget', highlight: true },
      { name: 'Reports', icon: BarChart3, href: '/dashboard/reports' },
      { name: 'Settings', icon: Settings, href: '/dashboard/settings' },
    ],
  },
];

// ── Hospital Navigation ─────────────────────────────────
const hospitalAdminNav: NavSection[] = [
  {
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    ],
  },
  {
    title: 'Management',
    items: [
      { name: 'Doctor Management', icon: Stethoscope, href: '/dashboard/doctor-management' },
      { name: 'Patient Management', icon: Users, href: '/dashboard/patients' },
    ],
  },
  {
    title: 'Data & Training',
    items: [
      { name: 'Local Data Upload', icon: Upload, href: '/dashboard/data-upload' },
      { name: 'Model Participation', icon: Cpu, href: '/dashboard/federated' },
      { name: 'Analytics', icon: LineChart, href: '/dashboard/analytics', highlight: true },
      { name: 'Local Reports', icon: ClipboardList, href: '/dashboard/reports' },
    ],
  },
  {
    title: 'Compliance',
    items: [
      { name: 'Audit Logs', icon: ScrollText, href: '/dashboard/audit-logs' },
      { name: 'Profile Settings', icon: Settings, href: '/dashboard/settings' },
    ],
  },
];

// ── Doctor Navigation ───────────────────────────────────
const doctorNav: NavSection[] = [
  {
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    ],
  },
  {
    title: 'Patient Care',
    items: [
      { name: 'My Patients', icon: Users, href: '/dashboard/patients' },
      { name: 'Clinical Reports', icon: ClipboardList, href: '/dashboard/clinical-reports' },
    ],
  },
  {
    title: 'AI Diagnostics',
    items: [
      { name: 'New Prediction', icon: PlusCircle, href: '/dashboard/predictions' },
      { name: 'Prediction History', icon: History, href: '/dashboard/prediction-history' },
      { name: 'Anomaly Alerts', icon: AlertTriangle, href: '/dashboard/anomalies', badge: '!', highlight: true },
      { name: 'NLP Insights', icon: FileSearch, href: '/dashboard/nlp' },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { name: 'Clinical Analytics', icon: LineChart, href: '/dashboard/analytics', highlight: true },
    ],
  },
  {
    title: 'Account',
    items: [
      { name: 'Profile', icon: Settings, href: '/dashboard/settings' },
    ],
  },
];

// ── Mobile bottom nav items per role ────────────────────
const mobileNavItems: Record<UserRole, NavItem[]> = {
  super_admin: [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Orgs', icon: Building2, href: '/dashboard/organizations' },
    { name: 'Analytics', icon: LineChart, href: '/dashboard/analytics' },
    { name: 'Governance', icon: GitBranch, href: '/dashboard/model-governance' },
    { name: 'Settings', icon: Settings, href: '/dashboard/settings' },
  ],
  admin: [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Orgs', icon: Building2, href: '/dashboard/organizations' },
    { name: 'Analytics', icon: LineChart, href: '/dashboard/analytics' },
    { name: 'Governance', icon: GitBranch, href: '/dashboard/model-governance' },
    { name: 'Settings', icon: Settings, href: '/dashboard/settings' },
  ],
  hospital: [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Doctors', icon: Stethoscope, href: '/dashboard/doctor-management' },
    { name: 'Upload', icon: Upload, href: '/dashboard/data-upload' },
    { name: 'Analytics', icon: LineChart, href: '/dashboard/analytics' },
    { name: 'Settings', icon: Settings, href: '/dashboard/settings' },
  ],
  doctor: [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Patients', icon: Users, href: '/dashboard/patients' },
    { name: 'Predict', icon: BrainCircuit, href: '/dashboard/predictions' },
    { name: 'Alerts', icon: AlertTriangle, href: '/dashboard/anomalies' },
    { name: 'Profile', icon: Settings, href: '/dashboard/settings' },
  ],
};

function getNavForRole(role: UserRole): NavSection[] {
  switch (role) {
    case 'super_admin': return superAdminNav;
    case 'admin': return adminNav;
    case 'hospital': return hospitalAdminNav;
    case 'doctor': return doctorNav;
    default: return doctorNav;
  }
}

const roleConfig: Record<UserRole, { label: string; color: string; gradient: string }> = {
  super_admin: { label: 'Super Admin', color: 'bg-indigo-600', gradient: 'from-indigo-600 to-indigo-700' },
  admin:       { label: 'Admin',       color: 'bg-amber-600',  gradient: 'from-amber-600 to-amber-700' },
  hospital:    { label: 'Organization', color: 'bg-teal-600',  gradient: 'from-teal-600 to-emerald-700' },
  doctor:      { label: 'Doctor',      color: 'bg-blue-600',   gradient: 'from-blue-600 to-blue-700' },
};

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = useCallback(() => {
    logout();
    router.push('/login');
  }, [logout, router]);

  if (!user) return null;

  const navSections = getNavForRole(user.role);
  const mobileItems = mobileNavItems[user.role];
  const role = roleConfig[user.role];

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === href
      : pathname.startsWith(href);

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────── */}
      <aside
        className={cn(
          'desktop-sidebar relative flex h-screen flex-col border-r border-slate-100 bg-white transition-all duration-300 ease-in-out shrink-0',
          collapsed ? 'w-[76px]' : 'w-[264px]'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-[68px] items-center justify-between border-b border-slate-100 px-4 shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className={cn(
                'flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg shadow-blue-200 shrink-0',
                role.gradient
              )}>
                <Activity size={18} />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[15px] font-black tracking-tight text-slate-900">
                  Health<span className="text-blue-700">Connect</span>
                </span>
                <span className={cn(
                  'text-[8px] font-black uppercase tracking-[0.2em] mt-0.5 px-1.5 py-0.5 rounded text-white w-fit',
                  role.color
                )}>
                  {role.label}
                </span>
              </div>
            </div>
          )}
          {collapsed && (
            <div className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg shadow-blue-200 mx-auto',
              role.gradient
            )}>
              <Activity size={18} />
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-blue-700 transition-all active:scale-95"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-1 no-scrollbar">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className={cn(sIdx > 0 && 'mt-5')}>
              {section.title && !collapsed && (
                <h4 className="px-3 mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400/80">
                  {section.title}
                </h4>
              )}
              {sIdx > 0 && collapsed && (
                <div className="mx-3 mb-3 h-px bg-slate-100" />
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      title={collapsed ? item.name : undefined}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-bold transition-all duration-200',
                        active
                          ? 'bg-blue-700 text-white shadow-lg shadow-blue-200/60'
                          : item.highlight
                          ? 'text-teal-700 hover:bg-teal-50 hover:text-teal-800'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-blue-700',
                        collapsed && 'justify-center px-0'
                      )}
                    >
                      {/* Active pill indicator */}
                      {active && !collapsed && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-blue-400/60" />
                      )}

                      <item.icon
                        size={18}
                        className={cn(
                          'shrink-0 transition-transform group-hover:scale-110',
                          active
                            ? 'text-white'
                            : item.highlight
                            ? 'text-teal-600 group-hover:text-teal-700'
                            : 'text-slate-400 group-hover:text-blue-700'
                        )}
                      />
                      {!collapsed && (
                        <span className="truncate tracking-tight">{item.name}</span>
                      )}
                      {!collapsed && item.badge && (
                        <span className={cn(
                          'ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-md min-w-[18px] text-center',
                          active
                            ? 'bg-white/25 text-white'
                            : 'bg-red-100 text-red-600'
                        )}>
                          {item.badge}
                        </span>
                      )}
                      {!collapsed && item.highlight && !active && (
                        <span className="ml-auto text-[8px] font-black px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 uppercase tracking-widest">
                          New
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Card + Logout */}
        <div className="border-t border-slate-100 p-3 shrink-0">
          {user && !collapsed && (
            <div className="mb-2 flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-50/80 border border-slate-100">
              <div className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg text-white font-black text-xs shrink-0',
                role.color
              )}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-black text-slate-900 leading-none truncate">{user.name}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                  {user.role.replace('_', ' ')}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-bold text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all duration-200',
              collapsed && 'justify-center px-0'
            )}
            aria-label="Sign out"
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span className="tracking-tight">Sign Out</span>}
          </button>
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="absolute -right-3 top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-slate-200 shadow-md text-slate-400 hover:text-blue-700 transition-all hover:scale-110"
            aria-label="Expand sidebar"
          >
            <ChevronRight size={12} />
          </button>
        )}
      </aside>

      {/* ── Mobile Bottom Navigation ─────────────── */}
      <nav className="mobile-bottom-nav">
        {mobileItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center gap-1 min-w-[52px] group"
            >
              <div className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200',
                active
                  ? 'bg-blue-700 text-white shadow-lg shadow-blue-200'
                  : 'text-slate-400 group-hover:bg-slate-100 group-hover:text-blue-700'
              )}>
                <item.icon size={20} />
              </div>
              <span className={cn(
                'text-[9px] font-black uppercase tracking-wide',
                active ? 'text-blue-700' : 'text-slate-400'
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};
