'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  UserCog,
  Plus,
  Search,
  Shield,
  Mail,
  Clock,
  Key,
  Activity,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  Hospital,
  Trash2,
  Pencil,
  X,
  Loader2,
  Save,
  Ban,
  UserPlus,
  KeyRound,
  Lock,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  hospital_id: string | null;
  is_active: boolean;
  created_at: string;
}

export default function AdminManagementPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Create form state
  const [newUser, setNewUser] = useState({
    username: '', email: '', password: '', role: 'admin', hospital_id: ''
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    email: '', role: '', is_active: true
  });

  // Reset password form state
  const [resetForm, setResetForm] = useState({
    new_password: '', confirm_password: ''
  });
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Change own password state
  const [showChangeSelf, setShowChangeSelf] = useState(false);
  const [selfPasswordForm, setSelfPasswordForm] = useState({
    current_password: '', new_password: '', confirm_password: ''
  });

  const isSuperAdmin = user?.role === 'super_admin';

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch { setUsers([]); }
    setIsLoading(false);
  }, []);

  const fetchHospitals = useCallback(async () => {
    try {
      const res = await api.get('/auth/hospitals');
      setHospitals(res.data);
    } catch { setHospitals([]); }
  }, []);

  useEffect(() => { fetchUsers(); fetchHospitals(); }, [fetchUsers, fetchHospitals]);

  // Auto-dismiss success/error
  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(null), 5000); return () => clearTimeout(t); }
  }, [success]);
  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(null), 8000); return () => clearTimeout(t); }
  }, [error]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true); setError(null); setSuccess(null);
    try {
      await api.post('/auth/register', {
        username: newUser.username, email: newUser.email,
        password: newUser.password, role: newUser.role,
        hospital_id: newUser.hospital_id || null,
      });
      setSuccess(`User "${newUser.username}" created successfully`);
      setNewUser({ username: '', email: '', password: '', role: 'admin', hospital_id: '' });
      setShowCreateForm(false);
      fetchUsers();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to create user');
    }
    setIsSaving(false);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setIsSaving(true); setError(null); setSuccess(null);
    try {
      await api.put(`/admin/users/${editingUser.id}`, {
        email: editForm.email, role: editForm.role, is_active: editForm.is_active,
      });
      setSuccess(`User "${editingUser.username}" updated`);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to update user');
    }
    setIsSaving(false);
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser) return;
    if (resetForm.new_password.length < 6) {
      setError('Password must be at least 6 characters'); return;
    }
    if (resetForm.new_password !== resetForm.confirm_password) {
      setError('Passwords do not match'); return;
    }
    setIsSaving(true); setError(null); setSuccess(null);
    try {
      await api.post(`/admin/users/${resetPasswordUser.id}/reset-password`, {
        new_password: resetForm.new_password,
      });
      setSuccess(`Password for "${resetPasswordUser.username}" has been reset`);
      setResetPasswordUser(null);
      setResetForm({ new_password: '', confirm_password: '' });
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to reset password');
    }
    setIsSaving(false);
  };

  const handleChangeSelfPassword = async () => {
    if (selfPasswordForm.new_password.length < 6) {
      setError('Password must be at least 6 characters'); return;
    }
    if (selfPasswordForm.new_password !== selfPasswordForm.confirm_password) {
      setError('Passwords do not match'); return;
    }
    setIsSaving(true); setError(null); setSuccess(null);
    try {
      await api.post('/admin/change-password', {
        current_password: selfPasswordForm.current_password,
        new_password: selfPasswordForm.new_password,
      });
      setSuccess('Your password has been changed successfully');
      setShowChangeSelf(false);
      setSelfPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to change password');
    }
    setIsSaving(false);
  };

  const handleDeleteUser = async (userId: string) => {
    setError(null); setSuccess(null);
    try {
      await api.delete(`/admin/users/${userId}`);
      setSuccess('User deleted');
      setDeleteConfirm(null);
      fetchUsers();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to delete user');
    }
  };

  const startEdit = (u: AdminUser) => {
    setEditingUser(u);
    setEditForm({ email: u.email, role: u.role, is_active: u.is_active });
    setResetPasswordUser(null);
    setShowCreateForm(false);
  };

  const startResetPassword = (u: AdminUser) => {
    setResetPasswordUser(u);
    setResetForm({ new_password: '', confirm_password: '' });
    setEditingUser(null);
    setShowCreateForm(false);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleBadge = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'admin': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'hospital': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'doctor': return 'bg-blue-50 text-blue-700 border-blue-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const availableRoles = isSuperAdmin
    ? ['super_admin', 'admin', 'hospital', 'doctor']
    : ['admin', 'hospital', 'doctor'];

  // Can this user's password be reset by the current user?
  const canResetPw = (u: AdminUser) => {
    if (isSuperAdmin) return true; // super admin can reset anyone
    if (u.role === 'super_admin') return false; // admin can't reset super_admin
    if (u.role === 'admin' && u.id !== user?.id) return false; // admin can't reset other admins
    return true;
  };

  return (
    <RoleGuard allowedRoles={['super_admin', 'admin']}>
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">
            User <span className="text-blue-600">Management</span>
          </h1>
          <p className="mt-1 text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <UserCog size={14} className="text-blue-600" /> Add, Edit, Delete & Reset Passwords
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="h-11 px-5 border-2" onClick={() => { setShowChangeSelf(!showChangeSelf); setShowCreateForm(false); setEditingUser(null); setResetPasswordUser(null); }}>
            <Lock size={16} className="mr-2" /> Change My Password
          </Button>
          <Button className="h-11 px-6 shadow-xl shadow-blue-200" onClick={() => { setShowCreateForm(!showCreateForm); setEditingUser(null); setResetPasswordUser(null); setShowChangeSelf(false); }}>
            <Plus size={16} className="mr-2" /> New User
          </Button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-700 animate-in slide-in-from-top-2">
          <AlertCircle size={18} /><p className="text-sm font-bold">{error}</p>
          <button className="ml-auto" onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3 text-emerald-700 animate-in slide-in-from-top-2">
          <CheckCircle2 size={18} /><p className="text-sm font-bold">{success}</p>
          <button className="ml-auto" onClick={() => setSuccess(null)}><X size={14} /></button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: users.length, color: 'blue' },
          { label: 'Super Admins', value: users.filter(u => u.role === 'super_admin').length, color: 'indigo' },
          { label: 'Admins', value: users.filter(u => u.role === 'admin').length, color: 'amber' },
          { label: 'Hospital Nodes', value: users.filter(u => u.role === 'hospital').length, color: 'emerald' },
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-xl shadow-slate-100">
            <CardContent className="p-5">
              <p className="text-3xl font-black text-slate-900">{s.value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Change Own Password Form */}
      {showChangeSelf && (
        <Card className="border-none shadow-2xl shadow-purple-100 border-t-4 border-t-purple-600">
          <CardHeader className="border-b border-slate-50 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black">Change <span className="text-purple-600">My Password</span></CardTitle>
                <CardDescription className="text-sm font-bold text-slate-400">Update your own password securely</CardDescription>
              </div>
              <button onClick={() => setShowChangeSelf(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Password</label>
                <div className="relative">
                  <input type={showResetPassword ? 'text' : 'password'} value={selfPasswordForm.current_password} onChange={(e) => setSelfPasswordForm({...selfPasswordForm, current_password: e.target.value})} className="mt-1 w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold focus:border-purple-600 focus:ring-0 outline-none pr-10" placeholder="Current password" />
                  <button type="button" onClick={() => setShowResetPassword(!showResetPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-slate-400"><Eye size={16} /></button>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">New Password</label>
                <input type={showResetPassword ? 'text' : 'password'} value={selfPasswordForm.new_password} onChange={(e) => setSelfPasswordForm({...selfPasswordForm, new_password: e.target.value})} className="mt-1 w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold focus:border-purple-600 focus:ring-0 outline-none" placeholder="Min 6 characters" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Confirm New Password</label>
                <input type={showResetPassword ? 'text' : 'password'} value={selfPasswordForm.confirm_password} onChange={(e) => setSelfPasswordForm({...selfPasswordForm, confirm_password: e.target.value})} className="mt-1 w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold focus:border-purple-600 focus:ring-0 outline-none" placeholder="Re-enter new password" />
              </div>
            </div>
            {selfPasswordForm.new_password && selfPasswordForm.confirm_password && selfPasswordForm.new_password !== selfPasswordForm.confirm_password && (
              <p className="text-xs font-bold text-red-500 mt-2">⚠ Passwords do not match</p>
            )}
            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => { setShowChangeSelf(false); setSelfPasswordForm({ current_password: '', new_password: '', confirm_password: '' }); }} className="border-2">Cancel</Button>
              <Button onClick={handleChangeSelfPassword} disabled={isSaving || !selfPasswordForm.current_password || !selfPasswordForm.new_password} className="bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200">
                {isSaving ? <Loader2 size={14} className="animate-spin mr-2" /> : <Lock size={14} className="mr-2" />}
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create User Form */}
      {showCreateForm && (
        <Card className="border-none shadow-2xl shadow-blue-100 border-t-4 border-t-blue-600">
          <CardHeader className="border-b border-slate-50 pb-5">
            <CardTitle className="text-xl font-black">Create <span className="text-blue-600">New User</span></CardTitle>
            <CardDescription className="text-sm font-bold text-slate-400">
              {isSuperAdmin ? 'Create any role' : 'You can create admin, hospital, and doctor users'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Username</label>
                <input type="text" required value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} className="mt-1 w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold focus:border-blue-600 focus:ring-0 outline-none" placeholder="Enter username" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email</label>
                <input type="email" required value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="mt-1 w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold focus:border-blue-600 focus:ring-0 outline-none" placeholder="user@email.com" />
              </div>
              <div className="relative">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} required value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} className="mt-1 w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold focus:border-blue-600 focus:ring-0 outline-none pr-10" placeholder="Secure password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-slate-400">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Role</label>
                <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})} className="mt-1 w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold focus:border-blue-600 focus:ring-0 outline-none bg-white">
                  {availableRoles.map(r => <option key={r} value={r}>{r.replace('_', ' ').toUpperCase()}</option>)}
                </select>
              </div>
              {(newUser.role === 'hospital' || newUser.role === 'doctor') && (
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hospital</label>
                  <select value={newUser.hospital_id} onChange={(e) => setNewUser({...newUser, hospital_id: e.target.value})} className="mt-1 w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold focus:border-blue-600 focus:ring-0 outline-none bg-white">
                    <option value="">Select hospital...</option>
                    {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
              )}
              <div className="md:col-span-2 flex gap-3 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)} className="border-2">Cancel</Button>
                <Button type="submit" disabled={isSaving} className="shadow-lg shadow-blue-200">
                  {isSaving ? <Loader2 size={14} className="animate-spin mr-2" /> : <UserPlus size={14} className="mr-2" />}
                  Create User
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <Card className="border-none shadow-2xl shadow-amber-100 border-t-4 border-t-amber-500">
          <CardHeader className="border-b border-slate-50 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black">Edit <span className="text-amber-600">{editingUser.username}</span></CardTitle>
                <CardDescription className="text-sm font-bold text-slate-400">Modify user details</CardDescription>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email</label>
                <input type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} className="mt-1 w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold focus:border-amber-500 focus:ring-0 outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Role</label>
                <select value={editForm.role} onChange={(e) => setEditForm({...editForm, role: e.target.value})} className="mt-1 w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold focus:border-amber-500 focus:ring-0 outline-none bg-white">
                  {availableRoles.map(r => <option key={r} value={r}>{r.replace('_', ' ').toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</label>
                <select value={editForm.is_active ? 'active' : 'inactive'} onChange={(e) => setEditForm({...editForm, is_active: e.target.value === 'active'})} className="mt-1 w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold focus:border-amber-500 focus:ring-0 outline-none bg-white">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => setEditingUser(null)} className="border-2">Cancel</Button>
              <Button onClick={handleUpdateUser} disabled={isSaving} className="bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-200">
                {isSaving ? <Loader2 size={14} className="animate-spin mr-2" /> : <Save size={14} className="mr-2" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reset Password Modal */}
      {resetPasswordUser && (
        <Card className="border-none shadow-2xl shadow-red-100 border-t-4 border-t-red-500">
          <CardHeader className="border-b border-slate-50 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black">Reset Password for <span className="text-red-600">{resetPasswordUser.username}</span></CardTitle>
                <CardDescription className="text-sm font-bold text-slate-400">
                  Set a new password for this user. They will need to use the new password on next login.
                </CardDescription>
              </div>
              <button onClick={() => setResetPasswordUser(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-red-50 border border-red-100 p-3 rounded-xl mb-4 flex items-start gap-2">
              <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs font-bold text-red-700">This will immediately override the user&apos;s current password. The user will be required to use the new password for their next login.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">New Password</label>
                <div className="relative">
                  <input type={showResetPassword ? 'text' : 'password'} value={resetForm.new_password} onChange={(e) => setResetForm({...resetForm, new_password: e.target.value})} className="mt-1 w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold focus:border-red-500 focus:ring-0 outline-none pr-10" placeholder="Min 6 characters" />
                  <button type="button" onClick={() => setShowResetPassword(!showResetPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-slate-400">
                    {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Confirm Password</label>
                <input type={showResetPassword ? 'text' : 'password'} value={resetForm.confirm_password} onChange={(e) => setResetForm({...resetForm, confirm_password: e.target.value})} className="mt-1 w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold focus:border-red-500 focus:ring-0 outline-none" placeholder="Re-enter password" />
              </div>
            </div>
            {resetForm.new_password && resetForm.confirm_password && resetForm.new_password !== resetForm.confirm_password && (
              <p className="text-xs font-bold text-red-500 mt-2">⚠ Passwords do not match</p>
            )}
            {resetForm.new_password && resetForm.new_password.length < 6 && (
              <p className="text-xs font-bold text-amber-500 mt-2">⚠ Password must be at least 6 characters</p>
            )}
            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => { setResetPasswordUser(null); setResetForm({ new_password: '', confirm_password: '' }); }} className="border-2">Cancel</Button>
              <Button onClick={handleResetPassword} disabled={isSaving || !resetForm.new_password || resetForm.new_password !== resetForm.confirm_password || resetForm.new_password.length < 6} className="bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200">
                {isSaving ? <Loader2 size={14} className="animate-spin mr-2" /> : <KeyRound size={14} className="mr-2" />}
                Reset Password
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search & Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-bold focus:border-blue-600 focus:ring-0 outline-none" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-bold focus:border-blue-600 focus:ring-0 outline-none bg-white">
          <option value="all">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="hospital">Hospital</option>
          <option value="doctor">Doctor</option>
        </select>
      </div>

      {/* User Table */}
      <Card className="border-none shadow-2xl shadow-slate-100 overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center"><Loader2 size={32} className="animate-spin mx-auto text-blue-600" /></div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <Users size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-400">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">User</th>
                    <th className="text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Role</th>
                    <th className="text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Hospital</th>
                    <th className="text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Status</th>
                    <th className="text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Created</th>
                    <th className="text-right px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.map((u) => {
                    const canEdit = isSuperAdmin || u.role !== 'super_admin';
                    const canDelete = canEdit && u.id !== user?.id;
                    const canReset = canResetPw(u);
                    return (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center text-white font-black text-xs",
                              u.role === 'super_admin' ? 'bg-indigo-600' : u.role === 'admin' ? 'bg-amber-600' : u.role === 'hospital' ? 'bg-emerald-600' : 'bg-blue-600'
                            )}>
                              {u.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900">{u.username}</p>
                              <p className="text-[10px] font-bold text-slate-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn("px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border", roleBadge(u.role))}>
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {u.hospital_id ? (
                            <span className="text-xs font-bold text-slate-600">{u.hospital_id.substring(0, 8)}...</span>
                          ) : (
                            <span className="text-xs font-bold text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
                            u.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                          )}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-slate-400">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {canReset && (
                              <button onClick={() => startResetPassword(u)} className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 flex items-center justify-center transition-colors" title="Reset Password">
                                <KeyRound size={14} />
                              </button>
                            )}
                            {canEdit && (
                              <button onClick={() => startEdit(u)} className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 flex items-center justify-center transition-colors" title="Edit">
                                <Pencil size={14} />
                              </button>
                            )}
                            {canDelete && (
                              deleteConfirm === u.id ? (
                                <div className="flex gap-1">
                                  <button onClick={() => handleDeleteUser(u.id)} className="h-8 px-3 rounded-lg bg-red-600 text-white text-[9px] font-black uppercase hover:bg-red-700 transition-colors">Confirm</button>
                                  <button onClick={() => setDeleteConfirm(null)} className="h-8 px-3 rounded-lg bg-slate-200 text-slate-600 text-[9px] font-black uppercase hover:bg-slate-300 transition-colors">Cancel</button>
                                </div>
                              ) : (
                                <button onClick={() => setDeleteConfirm(u.id)} className="h-8 w-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors" title="Delete">
                                  <Trash2 size={14} />
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restrictions Info */}
      {!isSuperAdmin && (
        <Card className="border-none shadow-xl shadow-slate-100 bg-amber-50 border-l-4 border-l-amber-500">
          <CardContent className="p-5 flex items-start gap-3">
            <Shield size={18} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-black text-amber-800">Admin Restrictions</p>
              <ul className="text-xs font-bold text-amber-700 mt-1 space-y-0.5 list-disc list-inside">
                <li>You cannot view, edit, or delete Super Admin users</li>
                <li>You cannot assign the Super Admin role</li>
                <li>You cannot reset Super Admin or other Admin passwords</li>
                <li>You cannot change your own role or delete yourself</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </RoleGuard>
  );
}
