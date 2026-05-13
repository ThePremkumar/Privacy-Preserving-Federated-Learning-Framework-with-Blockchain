'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, User, Building2, CheckCircle2, XCircle, Clock, AlertTriangle, Filter, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { RoleGuard } from '@/components/guards/RoleGuard';
import api from '@/lib/api';

interface AccessRequest {
  id: string;
  request_type: 'new_user' | 'new_hospital';
  full_name: string;
  designation: string;
  hospital_name: string;
  location: string;
  contact_number: string;
  email: string;
  num_users: number | null;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function AccessRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [filter, setFilter] = useState<'all' | 'new_user' | 'new_hospital'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/access-requests');
      setRequests(res.data);
    } catch (err) {
      console.error('Failed to fetch requests', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    try {
      setActionLoading(true);
      await api.put(`/access-requests/${id}`, {
        status,
        rejection_reason: status === 'rejected' ? rejectReason : undefined
      });
      setSelectedRequest(null);
      setRejectReason('');
      fetchRequests();
    } catch (err) {
      console.error(`Failed to ${status} request`, err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter(r => filter === 'all' || r.request_type === filter);

  return (
    <RoleGuard allowedRoles={['super_admin', 'admin']}>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">
              Access <span className="text-blue-600">Requests</span>
            </h1>
            <p className="mt-1 text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={14} className="text-blue-600" /> Platform Registration Governance
            </p>
          </div>
          
          <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
            <button 
              onClick={() => setFilter('all')} 
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filter === 'all' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('new_user')} 
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filter === 'new_user' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Users
            </button>
            <button 
              onClick={() => setFilter('new_hospital')} 
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filter === 'new_hospital' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Hospitals
            </button>
          </div>
        </div>

        <Card className="border-none shadow-2xl shadow-slate-100 overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-50 p-6">
            <CardTitle className="text-xl font-black text-slate-900">Pending Registrations</CardTitle>
            <CardDescription className="text-sm font-bold text-slate-400">Review and approve new node and user access</CardDescription>
          </CardHeader>
          <CardContent className="p-0 bg-white">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Applicant</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Type</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Organization</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRequests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{req.full_name || req.hospital_name}</span>
                        <span className="text-xs text-slate-500">{req.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${req.request_type === 'new_hospital' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                        {req.request_type === 'new_hospital' ? <Building2 size={10} /> : <User size={10} />}
                        {req.request_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-700">{req.hospital_name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                        req.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        'bg-red-50 text-red-700 border-red-100'
                      }`}>
                        {req.status === 'pending' && <Clock size={10} />}
                        {req.status === 'approved' && <CheckCircle2 size={10} />}
                        {req.status === 'rejected' && <XCircle size={10} />}
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-400">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="outline" size="sm" onClick={() => setSelectedRequest(req)} className="h-8 text-xs font-bold">
                        <Eye size={14} className="mr-2" /> Review
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredRequests.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <ShieldCheck size={32} className="mb-2 opacity-50" />
                        <p className="text-sm font-bold">No access requests found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Review Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative">
              <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    Review Access Request
                  </h3>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">
                    ID: {selectedRequest.id.split('-')[0]}
                  </p>
                </div>
                <button onClick={() => { setSelectedRequest(null); setRejectReason(''); }} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-xl shadow-sm">
                  <XCircle size={20} />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Request Type</p>
                    <p className="text-sm font-bold text-slate-900 capitalize flex items-center gap-2">
                      {selectedRequest.request_type === 'new_hospital' ? <Building2 size={16} className="text-purple-600"/> : <User size={16} className="text-blue-600"/>}
                      {selectedRequest.request_type.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</p>
                    <span className="text-sm font-bold uppercase text-amber-600">{selectedRequest.status}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Name / Contact Person</p>
                    <p className="text-sm font-bold text-slate-900">{selectedRequest.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Email Address</p>
                    <p className="text-sm font-bold text-slate-900">{selectedRequest.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Organization / Hospital</p>
                    <p className="text-sm font-bold text-slate-900">{selectedRequest.hospital_name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Contact Number</p>
                    <p className="text-sm font-bold text-slate-900">{selectedRequest.contact_number || 'N/A'}</p>
                  </div>
                  {selectedRequest.request_type === 'new_hospital' && (
                    <>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Location</p>
                        <p className="text-sm font-bold text-slate-900">{selectedRequest.location}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Expected Users</p>
                        <p className="text-sm font-bold text-slate-900">{selectedRequest.num_users}</p>
                      </div>
                    </>
                  )}
                  {selectedRequest.request_type === 'new_user' && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Designation</p>
                      <p className="text-sm font-bold text-slate-900">{selectedRequest.designation}</p>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Reason for Access</p>
                  <p className="text-sm text-slate-700 leading-relaxed italic">"{selectedRequest.reason}"</p>
                </div>

                {selectedRequest.status === 'pending' && (
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <div className="flex gap-4">
                      <Button 
                        onClick={() => handleAction(selectedRequest.id, 'approved')} 
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-200"
                        disabled={actionLoading}
                      >
                        <CheckCircle2 size={18} className="mr-2" /> Approve Request
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          const reason = prompt("Please provide a reason for rejection:");
                          if (reason) {
                            setRejectReason(reason);
                            handleAction(selectedRequest.id, 'rejected');
                          }
                        }} 
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                        disabled={actionLoading}
                      >
                        <XCircle size={18} className="mr-2" /> Reject Request
                      </Button>
                    </div>
                    {selectedRequest.request_type === 'new_hospital' && (
                      <p className="text-[10px] font-bold text-center text-emerald-600 uppercase tracking-widest flex items-center justify-center gap-1">
                        <AlertTriangle size={12}/> Approving will automatically generate hospital credentials
                      </p>
                    )}
                    {selectedRequest.request_type === 'new_user' && (
                      <p className="text-[10px] font-bold text-center text-blue-600 uppercase tracking-widest flex items-center justify-center gap-1">
                        <AlertTriangle size={12}/> Approving will notify the respective Hospital Admin
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
