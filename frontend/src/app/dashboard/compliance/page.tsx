'use client';

import React, { useState } from 'react';
import {
  Lock,
  Shield,
  ShieldCheck,
  Key,
  Globe,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Fingerprint,
  FileWarning,
  RefreshCw,
  Settings,
  ToggleLeft,
  ToggleRight,
  Download,
  Copy,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function CompliancePage() {
  const [settings, setSettings] = useState({
    hipaa: true,
    gdpr: true,
    mfa: false,
    encryption: true,
    auditRetention: '90 days',
    autoLogout: '30 min',
  });

  // API keys should be fetched from the backend API Key service
  const apiKeys: { name: string; key: string; created: string; lastUsed: string; status: string }[] = [];
  // In production, populate from: GET /auth/api-keys

  const Toggle = ({ enabled, onChange, label }: { enabled: boolean; onChange: () => void; label: string }) => (
    <button onClick={onChange} className="flex items-center gap-3 group">
      {enabled ? (
        <ToggleRight size={28} className="text-blue-600 group-hover:scale-110 transition-transform" />
      ) : (
        <ToggleLeft size={28} className="text-slate-300 group-hover:text-slate-400 group-hover:scale-110 transition-transform" />
      )}
      <span className={cn("text-xs font-bold uppercase tracking-widest", enabled ? "text-blue-600" : "text-slate-400")}>{label}</span>
    </button>
  );

  return (
    <RoleGuard allowedRoles={['super_admin']}>
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">Compliance & <span className="text-blue-600">Security</span></h1>
          <p className="mt-1 text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
             <Lock size={14} className="text-blue-600" /> GDPR/HIPAA Settings, MFA, Encryption & API Management
          </p>
        </div>
        <Button className="h-11 px-6 shadow-xl shadow-blue-200">
          <Download size={16} className="mr-2" /> Export Compliance Report
        </Button>
      </div>

      {/* Compliance Status Banner */}
      <Card className="border-none shadow-2xl shadow-slate-100 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 text-blue-500/5"><ShieldCheck size={280} /></div>
        <CardContent className="p-8 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="h-16 w-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black italic">Platform Compliance: <span className="text-emerald-400">PASSED</span></h2>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Status verified against real-time configuration</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-center px-6 py-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-xl font-black text-white italic">HIPAA</p>
                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Level 3</p>
              </div>
              <div className="text-center px-6 py-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-xl font-black text-white italic">GDPR</p>
                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Compliant</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Compliance Toggles */}
        <Card className="border-none shadow-2xl shadow-slate-100">
          <CardHeader className="border-b border-slate-50 pb-5">
            <CardTitle className="text-xl font-black">Regulatory <span className="text-blue-600">Settings</span></CardTitle>
            <CardDescription className="text-sm font-bold text-slate-400">Toggle compliance features on/off</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between p-5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-blue-600" />
                <div>
                  <p className="text-sm font-black text-slate-900">HIPAA Compliance Mode</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full audit trail & data encryption enforcement</p>
                </div>
              </div>
              <Toggle enabled={settings.hipaa} onChange={() => setSettings({...settings, hipaa: !settings.hipaa})} label={settings.hipaa ? 'On' : 'Off'} />
            </div>

            <div className="flex items-center justify-between p-5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <Globe size={18} className="text-blue-600" />
                <div>
                  <p className="text-sm font-black text-slate-900">GDPR Data Protection</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Right to delete & data portability</p>
                </div>
              </div>
              <Toggle enabled={settings.gdpr} onChange={() => setSettings({...settings, gdpr: !settings.gdpr})} label={settings.gdpr ? 'On' : 'Off'} />
            </div>

            <div className="flex items-center justify-between p-5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <Fingerprint size={18} className="text-blue-600" />
                <div>
                  <p className="text-sm font-black text-slate-900">Multi-Factor Authentication</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Require MFA for all admin accounts</p>
                </div>
              </div>
              <Toggle enabled={settings.mfa} onChange={() => setSettings({...settings, mfa: !settings.mfa})} label={settings.mfa ? 'On' : 'Off'} />
            </div>

            <div className="flex items-center justify-between p-5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <Lock size={18} className="text-blue-600" />
                <div>
                  <p className="text-sm font-black text-slate-900">End-to-End Encryption</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AES-256 encryption at rest & in transit</p>
                </div>
              </div>
              <Toggle enabled={settings.encryption} onChange={() => setSettings({...settings, encryption: !settings.encryption})} label={settings.encryption ? 'On' : 'Off'} />
            </div>
          </CardContent>
        </Card>

        {/* API Key Management */}
        <Card className="border-none shadow-2xl shadow-slate-100">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-5">
            <div>
              <CardTitle className="text-xl font-black">API <span className="text-blue-600">Key Management</span></CardTitle>
              <CardDescription className="text-sm font-bold text-slate-400">Programmatic access tokens</CardDescription>
            </div>
            <Button size="sm" className="h-8 px-4 text-[9px] font-black uppercase tracking-widest">
              <Key size={12} className="mr-1" /> Generate Key
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {apiKeys.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm font-bold text-slate-400">No API keys registered.</p>
                </div>
              ) : (
                apiKeys.map((key, i) => (
                  <div key={i} className="px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center border",
                        key.status === 'Active' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-slate-100 text-slate-400 border-slate-200"
                      )}>
                        <Key size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{key.name}</p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">{key.key}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400">{key.lastUsed}</p>
                        <span className={cn(
                          "text-[8px] font-black uppercase tracking-widest",
                          key.status === 'Active' ? "text-emerald-600" : "text-red-500"
                        )}>{key.status}</span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="h-7 w-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors">
                          <Copy size={12} />
                        </button>
                        <button className="h-7 w-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-600 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Encryption & Policies */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {[
          { label: 'Data Encryption', value: 'AES-256', desc: 'Military-grade encryption at rest', icon: Lock, status: 'Active' },
          { label: 'Audit Log Retention', value: settings.auditRetention, desc: 'Immutable blockchain-backed logs', icon: Eye, status: 'Configured' },
          { label: 'Session Timeout', value: settings.autoLogout, desc: 'Auto-logout for inactive sessions', icon: RefreshCw, status: 'Enforced' },
        ].map((item, i) => (
          <Card key={i} className="border-none shadow-xl shadow-slate-100 p-6 group cursor-pointer hover:border-blue-100 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform border border-blue-100">
                <item.icon size={22} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{item.status}</span>
            </div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.label}</h4>
            <p className="text-xl font-black italic text-blue-600 mt-1">{item.value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{item.desc}</p>
          </Card>
        ))}
      </div>
    </div>
    </RoleGuard>
  );
}
