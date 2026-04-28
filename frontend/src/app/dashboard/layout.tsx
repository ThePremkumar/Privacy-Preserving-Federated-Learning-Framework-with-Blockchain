'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import {
  Search,
  Bell,
  User,
  Settings,
  ShieldCheck,
  Zap,
  AlertTriangle,
  ChevronDown,
  LogOut,
  ChevronRight,
  X,
  CheckCheck,
  BrainCircuit,
  TrendingUp,
  Activity,
  Building2,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Types ───────────────────────────────────────────────
interface Notification {
  id: string;
  type: 'alert' | 'success' | 'warning' | 'info';
  title: string;
  message: string;
  time: string;
  is_read: boolean;
}

interface SearchResult {
  href: string;
  label: string;
  category: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

// ─── Role config ─────────────────────────────────────────
const roleConfig: Record<string, { label: string; orgLabel: string; color: string; bgColor: string }> = {
  super_admin: { label: 'Super Admin',      orgLabel: 'HealthConnect Platform', color: 'text-indigo-700', bgColor: 'bg-indigo-50 border-indigo-100' },
  admin:       { label: 'Admin',            orgLabel: 'HealthConnect Platform', color: 'text-amber-700',  bgColor: 'bg-amber-50 border-amber-100' },
  hospital:    { label: 'Organization Admin', orgLabel: 'Hospital Node',        color: 'text-teal-700',   bgColor: 'bg-teal-50 border-teal-100' },
  doctor:      { label: 'Clinical Doctor',  orgLabel: 'Medical Staff',          color: 'text-blue-700',   bgColor: 'bg-blue-50 border-blue-100' },
};

// ─── Breadcrumb segments ──────────────────────────────────
const routeLabels: Record<string, string> = {
  'dashboard': 'Dashboard',
  'organizations': 'Organizations',
  'admin-management': 'Admin Management',
  'model-governance': 'Model Governance',
  'federated': 'Network Monitor',
  'blockchain': 'Blockchain Audit',
  'model-health': 'Model Health',
  'compliance': 'Compliance',
  'reports': 'Reports',
  'settings': 'Settings',
  'data-upload': 'Data Upload',
  'doctor-management': 'Doctor Management',
  'patients': 'Patients',
  'predictions': 'Predictions',
  'prediction-history': 'Prediction History',
  'anomalies': 'Anomaly Alerts',
  'nlp': 'NLP Insights',
  'clinical-reports': 'Clinical Reports',
  'audit-logs': 'Audit Logs',
  'analytics': 'Analytics',
  'privacy-budget': 'Privacy Budget',
  'network-map': 'Network Map',
  'model-comparison': 'Model Comparison',
};

// ─── Quick search index ───────────────────────────────────
const searchIndex: SearchResult[] = [
  { href: '/dashboard', label: 'Dashboard Home', category: 'Navigation', icon: Activity },
  { href: '/dashboard/organizations', label: 'Organizations', category: 'Admin', icon: Building2 },
  { href: '/dashboard/patients', label: 'Patient Registry', category: 'Clinical', icon: User },
  { href: '/dashboard/predictions', label: 'Run AI Prediction', category: 'Clinical', icon: BrainCircuit },
  { href: '/dashboard/anomalies', label: 'Anomaly Alerts', category: 'Clinical', icon: AlertTriangle },
  { href: '/dashboard/analytics', label: 'Analytics Dashboard', category: 'Analytics', icon: TrendingUp },
  { href: '/dashboard/model-governance', label: 'Model Governance', category: 'Training', icon: ShieldCheck },
  { href: '/dashboard/blockchain', label: 'Blockchain Audit', category: 'Compliance', icon: ShieldCheck },
  { href: '/dashboard/privacy-budget', label: 'Privacy Budget', category: 'Compliance', icon: ShieldCheck },
  { href: '/dashboard/network-map', label: 'Network Map', category: 'Admin', icon: Activity },
  { href: '/dashboard/model-comparison', label: 'Model Comparison', category: 'Training', icon: TrendingUp },
];

// ─── Default notifications (real ones loaded from API) ────
const DEFAULT_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'alert', title: 'High-Risk Patient', message: 'Anomaly score > 8.5 detected for a patient', time: '2m ago', is_read: false },
  { id: '2', type: 'warning', title: 'Model Drift Detected', message: 'Feature distribution shift on Hospital Node 3', time: '18m ago', is_read: false },
  { id: '3', type: 'success', title: 'Blockchain Verified', message: 'Round #12 immutably stored on-chain', time: '1h ago', is_read: true },
  { id: '4', type: 'info', title: 'Training Completed', message: 'Hospital Node 1 completed local training (94.2% acc)', time: '2h ago', is_read: true },
];

function useBreadcrumbs(pathname: string) {
  return useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((seg, idx) => ({
      label: routeLabels[seg] || seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
      href: '/' + segments.slice(0, idx + 1).join('/'),
      isLast: idx === segments.length - 1,
    }));
  }, [pathname]);
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>(DEFAULT_NOTIFICATIONS);

  const alertsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const breadcrumbs = useBreadcrumbs(pathname);
  const config = user ? roleConfig[user.role] || roleConfig.doctor : roleConfig.doctor;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // ── Close on outside click ──────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (alertsRef.current && !alertsRef.current.contains(e.target as Node)) setIsAlertsOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setIsProfileOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setIsSearchOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Cmd+K command palette ───────────────────────────────
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsAlertsOpen(false);
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  // ── Try fetching real notifications & listen to WebSocket ──
  useEffect(() => {
    // Fetch initial notifications
    api.get('/notifications').then(res => {
      if (Array.isArray(res.data) && res.data.length > 0) {
        setNotifications(res.data.map((n: any) => ({
          ...n,
          time: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' today'
        })));
      }
    }).catch(() => { /* Use defaults */ });

    // WebSocket connection
    let ws: WebSocket;
    if (user?.id) {
      const wsUrl = `ws://localhost:8001/api/v1/ws/notifications?user_id=${user.id}`;
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const newNotif = JSON.parse(event.data);
          setNotifications(prev => [{
            ...newNotif,
            time: new Date(newNotif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' today'
          }, ...prev]);
        } catch (e) {
          console.error("Error parsing notification", e);
        }
      };
    }

    return () => {
      if (ws) ws.close();
    };
  }, [user]);

  const markAllRead = useCallback(() => {
    api.post('/notifications/read-all').then(() => {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }).catch(console.error);
  }, []);

  const markRead = useCallback((id: string) => {
    api.post(`/notifications/${id}/read`).then(() => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    }).catch(console.error);
  }, []);

  // ── Filtered search ─────────────────────────────────────
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return searchIndex.slice(0, 6);
    const q = searchQuery.toLowerCase();
    return searchIndex.filter(
      r => r.label.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQuery]);

  const handleLogout = useCallback(() => {
    logout();
    router.push('/login');
  }, [logout, router]);

  const notifIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    alert: AlertTriangle,
    success: Zap,
    warning: ShieldCheck,
    info: BrainCircuit,
  };

  const notifColors: Record<string, string> = {
    alert: 'bg-red-50 text-red-600 border-red-100',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    info: 'bg-blue-50 text-blue-700 border-blue-100',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        {/* ── Top Bar ─────────────────────────────────── */}
        <header className="sticky top-0 z-40 flex h-[68px] w-full items-center justify-between border-b border-slate-100 bg-white/95 backdrop-blur-xl px-4 md:px-6 shadow-sm shadow-slate-100/50">
          {/* Left: Breadcrumbs */}
          <div className="flex items-center gap-2 min-w-0">
            {/* Org icon — hidden on mobile */}
            <div className="hidden md:flex items-center gap-2">
              <Building2 size={15} className="text-slate-400 shrink-0" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">{config.orgLabel}</span>
              <ChevronRight size={12} className="text-slate-300" />
            </div>
            {/* Breadcrumb trail */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Breadcrumb">
              {breadcrumbs.map((bc, i) => (
                <React.Fragment key={bc.href}>
                  {i > 0 && <ChevronRight size={11} className="text-slate-300 mx-0.5" />}
                  {bc.isLast ? (
                    <span className="text-xs font-black text-slate-900 truncate max-w-[180px]">{bc.label}</span>
                  ) : (
                    <Link href={bc.href} className="text-xs font-bold text-slate-400 hover:text-blue-700 transition-colors truncate max-w-[140px]">
                      {bc.label}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </nav>
            {/* Mobile: just current page */}
            <span className="md:hidden text-sm font-black text-slate-900 truncate">
              {breadcrumbs[breadcrumbs.length - 1]?.label || 'Dashboard'}
            </span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1.5">
            {/* Global Search */}
            <div className="hidden md:flex relative" ref={searchRef}>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-700 transition-colors" size={14} />
                <input
                  type="text"
                  placeholder="Search… (⌘K)"
                  onClick={() => { setIsSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 10); }}
                  readOnly
                  className="h-8 w-44 xl:w-56 rounded-lg bg-slate-50 pl-8 pr-3 text-[11px] font-bold transition-all border border-slate-100 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none cursor-pointer hover:border-blue-200"
                />
              </div>
            </div>

            {/* Notifications bell */}
            <div className="relative" ref={alertsRef}>
              <button
                onClick={() => { setIsAlertsOpen(!isAlertsOpen); setIsProfileOpen(false); }}
                className={cn(
                  'relative rounded-xl p-2 transition-all duration-200',
                  isAlertsOpen ? 'bg-blue-700 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-50 hover:text-blue-700'
                )}
                aria-label={`Notifications (${unreadCount} unread)`}
              >
                <Bell size={18} />
                {unreadCount > 0 && !isAlertsOpen && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white border-2 border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {isAlertsOpen && (
                <div className="absolute right-0 mt-2 w-[340px] rounded-2xl bg-white shadow-2xl shadow-slate-200/80 border border-slate-100 overflow-hidden z-50 animate-slide-up">
                  <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/60 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Notifications</h4>
                      <p className="text-[9px] font-bold text-slate-400 mt-0.5">{unreadCount} unread</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={markAllRead} className="flex items-center gap-1 text-[9px] font-black text-blue-700 uppercase tracking-widest hover:underline">
                        <CheckCheck size={11} /> Mark all read
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-50 max-h-[360px] overflow-y-auto no-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell size={28} className="mx-auto text-slate-200 mb-2" />
                        <p className="text-xs font-bold text-slate-400">No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        const Icon = notifIcons[notif.type] || Bell;
                        return (
                          <div
                            key={notif.id}
                            onClick={() => markRead(notif.id)}
                            className={cn(
                              'px-5 py-4 transition-colors cursor-pointer group',
                              notif.is_read ? 'hover:bg-slate-50' : 'bg-blue-50/30 hover:bg-blue-50/60'
                            )}
                          >
                            <div className="flex gap-3">
                              <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border', notifColors[notif.type])}>
                                <Icon size={14} />
                              </div>
                              <div className="space-y-0.5 min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className={cn('text-[11px] font-black text-slate-900 uppercase tracking-tight truncate', !notif.is_read && 'text-blue-900')}>
                                    {notif.title}
                                  </span>
                                  <span className="text-[9px] font-bold text-slate-400 shrink-0">{notif.time}</span>
                                </div>
                                <p className="text-[10px] font-medium text-slate-500 leading-relaxed">{notif.message}</p>
                              </div>
                              {!notif.is_read && (
                                <div className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="px-5 py-3 bg-slate-50 text-center border-t border-slate-100">
                    <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-700 transition-colors">
                      View All Notifications →
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-slate-100 mx-0.5" />

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => { setIsProfileOpen(!isProfileOpen); setIsAlertsOpen(false); }}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-50 transition-all group"
                aria-label="Profile menu"
              >
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[11px] font-black tracking-tight text-slate-900 uppercase group-hover:text-blue-700 transition-colors">
                    {user?.username || 'Guest'}
                  </span>
                  <span className={cn('text-[8px] font-black uppercase tracking-widest px-1.5 py-0 rounded border', config.bgColor, config.color)}>
                    {config.label}
                  </span>
                </div>
                <div className="relative">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 border border-slate-200 group-hover:bg-blue-700 group-hover:text-white transition-all font-black text-xs">
                    {user?.username?.charAt(0).toUpperCase() || <User size={16} />}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <ChevronDown size={12} className={cn('text-slate-400 transition-transform hidden sm:block', isProfileOpen && 'rotate-180')} />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white shadow-2xl shadow-slate-200/80 border border-slate-100 overflow-hidden z-50 animate-slide-up">
                  <div className="px-4 py-4 border-b border-slate-50 bg-gradient-to-br from-slate-50 to-white">
                    <p className="text-xs font-black text-slate-900 truncate">{user?.username}</p>
                    <p className="text-[10px] font-medium text-slate-400 truncate mt-0.5">{user?.email}</p>
                    <span className={cn('inline-block mt-2 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border', config.bgColor, config.color)}>
                      {config.label}
                    </span>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => { router.push('/dashboard/settings'); setIsProfileOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-700 transition-all"
                    >
                      <Settings size={14} /> Profile Settings
                    </button>
                    <button
                      onClick={() => { handleLogout(); setIsProfileOpen(false); }}
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

        {/* ── Dashboard Content ───────────────────── */}
        <main className="flex-1 p-4 md:p-8 animate-fade-in">
          {children}
        </main>
      </div>

      {/* ── Command Palette (Cmd+K) ──────────────── */}
      {isSearchOpen && (
        <>
          <div className="cmd-palette-overlay" onClick={() => setIsSearchOpen(false)} />
          <div className="cmd-palette">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
              <Search size={18} className="text-slate-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search pages, patients, training jobs…"
                className="flex-1 text-sm font-medium text-slate-900 placeholder-slate-400 bg-transparent outline-none"
              />
              <button onClick={() => setIsSearchOpen(false)} className="rounded-lg p-1 hover:bg-slate-100 text-slate-400">
                <X size={16} />
              </button>
            </div>
            <div className="py-2 max-h-80 overflow-y-auto no-scrollbar">
              {searchResults.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-400 text-sm font-medium">No results found</div>
              ) : (
                searchResults.map((result, i) => {
                  const Icon = result.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => { router.push(result.href); setIsSearchOpen(false); setSearchQuery(''); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left group"
                    >
                      <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 group-hover:bg-blue-100">
                        <Icon size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-slate-900 truncate">{result.label}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{result.category}</p>
                      </div>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-700 shrink-0" />
                    </button>
                  );
                })
              )}
            </div>
            <div className="px-4 py-2.5 border-t border-slate-50 bg-slate-50/50 flex items-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              <span><kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-slate-500">↵</kbd> Select</span>
              <span><kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-slate-500">Esc</kbd> Close</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
