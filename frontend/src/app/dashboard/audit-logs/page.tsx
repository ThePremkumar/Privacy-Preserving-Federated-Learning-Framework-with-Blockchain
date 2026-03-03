'use client';

import React, { useState } from 'react';
import {
  ScrollText,
  Search,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Shield,
  User,
  FileText,
  Lock,
  Activity,
  Database,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { useAuth } from '@/hooks/useAuth';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const auditLogs = [
  { id: 'LOG-001', user: 'Dr. Chen', action: 'Patient Record Accessed', resource: 'Patient #P-2481', time: '2m ago', severity: 'info', ip: '192.168.1.15' },
  { id: 'LOG-002', user: 'Dr. Miller', action: 'Prediction Generated', resource: 'Sam Wilson Risk Assessment', time: '14m ago', severity: 'info', ip: '192.168.1.22' },
  { id: 'LOG-003', user: 'Hospital Admin', action: 'Data Upload Completed', resource: 'patient_vitals_feb.csv', time: '1h ago', severity: 'success', ip: '10.0.0.1' },
  { id: 'LOG-004', user: 'System', action: 'Failed Login Attempt', resource: 'Unknown user', time: '3h ago', severity: 'error', ip: '45.33.12.8' },
  { id: 'LOG-005', user: 'Dr. Kim', action: 'Consent Status Updated', resource: 'Patient #P-1842', time: '4h ago', severity: 'warning', ip: '192.168.1.30' },
  { id: 'LOG-006', user: 'System', action: 'Blockchain Hash Recorded', resource: 'Round #482 Aggregation', time: '5h ago', severity: 'success', ip: 'Node Internal' },
  { id: 'LOG-007', user: 'Dr. Shah', action: 'Patient Discharged', resource: 'Patient #P-2105', time: '6h ago', severity: 'info', ip: '192.168.1.44' },
  { id: 'LOG-008', user: 'Hospital Admin', action: 'Doctor Added', resource: 'Dr. Emma Watson', time: '1d ago', severity: 'success', ip: '10.0.0.1' },
  { id: 'LOG-009', user: 'System', action: 'Model Update Applied', resource: 'LSTM v2.4.1', time: '1d ago', severity: 'info', ip: 'Federated Server' },
  { id: 'LOG-010', user: 'Dr. Chen', action: 'Export Request', resource: 'Monthly Report PDF', time: '2d ago', severity: 'warning', ip: '192.168.1.15' },
];

export default function AuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterSeverity === 'all' || log.severity === filterSeverity;
    return matchesSearch && matchesFilter;
  });

  const severityIcon = (sev: string) => {
    switch (sev) {
      case 'success': return <CheckCircle2 size={14} className="text-emerald-600" />;
      case 'error': return <XCircle size={14} className="text-red-600" />;
      case 'warning': return <AlertTriangle size={14} className="text-amber-600" />;
      default: return <Activity size={14} className="text-blue-600" />;
    }
  };

  const severityBadge = (sev: string) => {
    const styles: Record<string, string> = {
      info: "bg-blue-50 text-blue-700 border-blue-100",
      success: "bg-emerald-50 text-emerald-700 border-emerald-100",
      warning: "bg-amber-50 text-amber-700 border-amber-100",
      error: "bg-red-50 text-red-700 border-red-100",
    };
    return styles[sev] || styles.info;
  };

  return (
    <RoleGuard allowedRoles={['hospital']}>
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">Audit <span className="text-blue-600">Logs</span></h1>
          <p className="mt-1 text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
             <ScrollText size={14} className="text-blue-600" /> Organization-Level Activity & Compliance Trail
          </p>
        </div>
        <Button variant="outline" className="h-11 px-6 border-2">
          <Download size={16} className="mr-2" /> Export Logs
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        {[
          { label: 'Total Events', value: auditLogs.length, color: 'text-slate-900' },
          { label: 'Successful', value: auditLogs.filter(l => l.severity === 'success').length, color: 'text-emerald-600' },
          { label: 'Warnings', value: auditLogs.filter(l => l.severity === 'warning').length, color: 'text-amber-600' },
          { label: 'Errors', value: auditLogs.filter(l => l.severity === 'error').length, color: 'text-red-600' },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-lg shadow-slate-100/50 p-5 bg-white">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
            <p className={cn("text-2xl font-black italic mt-1", stat.color)}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Logs Table */}
      <Card className="border-none shadow-2xl shadow-slate-100 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-5 p-6">
          <div>
            <CardTitle className="text-xl font-black">Activity <span className="text-blue-600">Timeline</span></CardTitle>
            <CardDescription className="text-sm font-bold text-slate-400">Blockchain-backed immutable records</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input className="h-9 w-48 rounded-lg bg-slate-50 pl-8 pr-4 text-[10px] font-bold border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Search logs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <select
              value={filterSeverity}
              onChange={e => setFilterSeverity(e.target.value)}
              className="h-9 rounded-lg bg-slate-50 px-3 text-[10px] font-black uppercase tracking-widest text-slate-700 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-100 appearance-none"
            >
              <option value="all">All</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-50">
            {filteredLogs.map(log => (
              <div key={log.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center border", severityBadge(log.severity))}>
                    {severityIcon(log.severity)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900">{log.action}</span>
                      <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border", severityBadge(log.severity))}>
                        {log.severity}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.id}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span className="text-[10px] font-bold text-blue-600">{log.user}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span className="text-[10px] font-bold text-slate-400">{log.resource}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400">{log.time}</p>
                    <p className="text-[9px] font-mono text-slate-300">{log.ip}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 border-t border-slate-50 flex items-center justify-between">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Showing {filteredLogs.length} of {auditLogs.length} events</p>
            <div className="flex items-center gap-2">
              <Lock size={12} className="text-slate-400" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Blockchain verified & immutable</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </RoleGuard>
  );
}
