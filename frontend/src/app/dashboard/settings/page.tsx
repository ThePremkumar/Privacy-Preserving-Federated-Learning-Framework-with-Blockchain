'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Settings, 
  User, 
  Shield, 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  Mail, 
  Key, 
  Hospital,
  ChevronRight,
  UserPlus,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, UserRole } from '@/hooks/useAuth';
import { RoleGuard } from '@/components/guards/RoleGuard';
import api from '@/lib/api';

type Tab = 'profile' | 'security' | 'users' | 'hospitals';

interface SystemUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  hospital_id?: string;
  is_active: boolean;
  created_at?: string;
}

interface HospitalNode {
  id: string;
  name: string;
  contact_email: string;
  address: string;
  is_active: boolean;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddHospitalModal, setShowAddHospitalModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [users, setUsers] = useState<SystemUser[]>([]);
  const [hospitals, setHospitals] = useState<HospitalNode[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // New user form state
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    role: 'doctor',
    hospital_id: '',
    password: ''
  });

  // New hospital form state
  const [newHospital, setNewHospital] = useState({
    name: '',
    contact_email: '',
    address: ''
  });

  const [showPassword, setShowPassword] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoadingData(true);
    try {
      if (user.role === 'super_admin' || user.role === 'admin' || user.role === 'hospital') {
        const requests = [api.get('/auth/users')];
        if (user.role === 'super_admin' || user.role === 'admin') {
          requests.push(api.get('/auth/hospitals'));
        }
        
        const [usersRes, hospitalsRes] = await Promise.all(requests);
        setUsers(usersRes.data);
        if (hospitalsRes) {
          setHospitals(hospitalsRes.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      // Fallback to empty lists
      setUsers([]);
      setHospitals([]);
    } finally {
      setIsLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      // If hospital role, force role to doctor and use own hospital_id
      const payload = user?.role === 'hospital' 
        ? { ...newUser, role: 'doctor', hospital_id: user.hospital_id }
        : newUser;

      await api.post('/auth/register', payload);
      setSuccessMessage("Specialist registered successfully.");
      setShowAddUserModal(false);
      fetchData();
      setNewUser({ username: '', email: '', role: 'doctor', hospital_id: '', password: '' });
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || "Failed to register user.");
    }
  };

  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await api.post('/auth/register-hospital', newHospital);
      setSuccessMessage("Hospital node registered successfully.");
      setShowAddHospitalModal(false);
      fetchData();
      setNewHospital({ name: '', contact_email: '', address: '' });
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || "Failed to register hospital.");
    }
  };

  const tabs = [
    { id: 'profile', label: 'Institutional Profile', icon: User },
    { id: 'security', label: 'Security & Keys', icon: Shield },
    { id: 'users', label: 'User Management', icon: Users, roleRestraint: ['super_admin', 'admin', 'hospital'] },
    { id: 'hospitals', label: 'Hospital Nodes', icon: Hospital, roleRestraint: ['super_admin', 'admin'] },
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      {/* Header section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">System <span className="text-blue-600">Configuration</span></h1>
        <p className="text-sm font-medium text-slate-500 uppercase tracking-widest italic">Global protocol and access management panel</p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-3 shadow-xl shadow-slate-200/40">
            {tabs.map((tab) => {
                const allowed = !tab.roleRestraint || (user && tab.roleRestraint.includes(user.role as UserRole));
                if (!allowed) return null;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={`nav-btn w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                      activeTab === tab.id 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
                    }`}
                  >
                    <tab.icon size={18} />
                    {tab.label}
                  </button>
                )
            })}
          </div>

          <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-4 shadow-2xl overflow-hidden relative group">
             <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-150 transition-transform duration-700">
                <Lock size={120} />
             </div>
             <h4 className="text-xs font-black uppercase tracking-widest text-blue-400">Security Note</h4>
             <p className="text-[10px] leading-relaxed text-slate-400 font-medium italic uppercase">All system changes are logged to the blockchain audit trail for compliance verification.</p>
          </div>
        </div>

        {/* Content Area */}
        <div className="col-span-12 lg:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={containerVariants}
              className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-2xl shadow-slate-200/50 min-h-[600px]"
            >
              {successMessage && (
                 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 mb-6">
                    <CheckCircle2 size={18} />
                    <span className="text-xs font-black uppercase tracking-widest">{successMessage}</span>
                 </motion.div>
              )}

              {errorMessage && (
                 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-700 mb-6">
                    <AlertCircle size={18} />
                    <span className="text-xs font-black uppercase tracking-widest">{errorMessage}</span>
                 </motion.div>
              )}

              {activeTab === 'profile' && (
                <div className="space-y-10">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-8">
                     <div className="space-y-1">
                       <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Institutional Profile</h2>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">Personal system identification profile</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                     <div className="col-span-2 md:col-span-1 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username / Specialist ID</label>
                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-3">
                           <User className="text-slate-400" size={18} />
                           <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{user?.username}</span>
                        </div>
                     </div>
                     <div className="col-span-2 md:col-span-1 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-3">
                           <Mail className="text-slate-400" size={18} />
                           <span className="text-sm font-black text-slate-900 tracking-tight">{user?.email}</span>
                        </div>
                     </div>
                     <div className="col-span-2 md:col-span-1 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Role</label>
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-3">
                           <Shield className="text-blue-600" size={18} />
                           <span className="text-sm font-black text-blue-800 uppercase tracking-tight">{user?.role.replace('_', ' ')}</span>
                        </div>
                     </div>
                     <div className="col-span-2 md:col-span-1 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hospital ID</label>
                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-3">
                           <Hospital className="text-slate-400" size={18} />
                           <span className="text-sm font-black text-slate-900 tracking-tight">{user?.hospital_id || 'NOD-GLOBAL'}</span>
                        </div>
                     </div>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <RoleGuard allowedRoles={['super_admin', 'admin']}>
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                       <div className="space-y-1">
                         <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">User Management</h2>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">Administer node access and roles</p>
                       </div>
                       <button 
                         onClick={() => setShowAddUserModal(true)}
                         className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-blue-100"
                       >
                         <Plus size={16} />
                         Add Specialist
                       </button>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-slate-100 shadow-sm shadow-slate-200">
                       <table className="w-full text-left">
                          <thead className="bg-slate-50/50">
                             <tr>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Specialist</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Protocol Role</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Node Hub</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                             {users.length === 0 ? (
                               <tr>
                                 <td colSpan={3} className="px-6 py-10 text-center text-slate-400 text-xs font-bold uppercase italic">No specialists registered in this node</td>
                               </tr>
                             ) : users.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                                   <td className="px-6 py-5">
                                      <div className="flex items-center gap-4">
                                         <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs uppercase group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            {u.username.charAt(0)}
                                         </div>
                                         <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-900 uppercase tracking-tighter">{u.username}</span>
                                            <span className="text-[10px] font-bold text-slate-400">{u.email}</span>
                                         </div>
                                      </div>
                                   </td>
                                   <td className="px-6 py-5">
                                      <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest italic ${
                                        u.role === 'super_admin' ? 'bg-indigo-100 text-indigo-700' :
                                        u.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                      }`}>
                                         {String(u.role).replace('_', ' ')}
                                      </span>
                                   </td>
                                   <td className="px-6 py-5">
                                      <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{u.hospital_id || 'NOD-GLOBAL'}</span>
                                   </td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                  </div>
                </RoleGuard>
              )}

              {activeTab === 'hospitals' && (
                <RoleGuard allowedRoles={['super_admin']}>
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                       <div className="space-y-1">
                         <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Hospital Cluster</h2>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">Participating nodes in federated training</p>
                       </div>
                       <button 
                         onClick={() => setShowAddHospitalModal(true)}
                         className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100"
                       >
                         <Plus size={16} />
                         Register Node
                       </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {hospitals.length === 0 ? (
                         <div className="col-span-2 p-10 text-center text-slate-400 text-xs font-black uppercase italic border-2 border-dashed border-slate-100 rounded-3xl">No hospital nodes available</div>
                       ) : hospitals.map(h => (
                         <div key={h.id} className="bg-slate-50 border border-slate-100 rounded-3xl p-6 space-y-4 hover:border-blue-200 transition-all shadow-sm">
                            <div className="flex items-center justify-between">
                               <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                  <Hospital size={20} />
                               </div>
                               <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${h.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                                  {h.is_active ? 'Active' : 'Offline'}
                               </span>
                            </div>
                            <div>
                               <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{h.name}</h4>
                               <p className="text-[10px] font-medium text-slate-500 italic mt-1">{h.address}</p>
                            </div>
                            <div className="pt-4 border-t border-slate-200/50 flex items-center gap-3">
                               <Mail className="text-slate-400" size={14} />
                               <span className="text-[10px] font-black text-slate-900">{h.contact_email}</span>
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>
                </RoleGuard>
              )}

              {activeTab === 'security' && (
                <div className="space-y-10">
                   <div className="flex flex-col gap-1 border-b border-slate-50 pb-8">
                      <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Security Protocols</h2>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">Manage encrypted access and credentials</p>
                   </div>

                   <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 space-y-6">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                               <Key size={24} />
                            </div>
                            <div className="space-y-1">
                               <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Specialist Passcode</h4>
                               <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest italic">Rotate your system access credentials</p>
                            </div>
                         </div>
                         <button className="px-5 py-3 rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-900 hover:text-white transition-all">Change Passcode</button>
                      </div>

                      <div className="h-[1px] bg-slate-200/50" />

                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                               <Lock size={24} />
                            </div>
                            <div className="space-y-1">
                               <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">API Management</h4>
                               <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest italic">Institutional connectivity keys</p>
                            </div>
                         </div>
                         <button className="px-5 py-3 rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-900 hover:text-white transition-all shadow-sm">Review API Keys</button>
                      </div>
                   </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddUserModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] overflow-hidden shadow-2xl"
            >
              <div className="bg-slate-900 p-8 text-white relative">
                 <div className="absolute top-0 right-0 p-10 opacity-10">
                    <UserPlus size={100} />
                 </div>
                 <h3 className="text-2xl font-black uppercase tracking-tighter italic">Register <span className="text-blue-400">Specialist</span></h3>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Institutional personnel onboarding protocol</p>
              </div>

              <form onSubmit={handleCreateUser} className="p-8 space-y-6">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2 space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username / Specialist ID</label>
                       <input 
                         required
                         type="text" 
                         value={newUser.username}
                         onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                         className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold tracking-tight text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all italic"
                         placeholder="e.g. dr_miller"
                       />
                    </div>

                    <div className="col-span-2 space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Email</label>
                       <input 
                         required
                         type="email" 
                         value={newUser.email}
                         onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                         className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold tracking-tight text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all italic"
                         placeholder="specialist@hospital.net"
                       />
                    </div>

                    <div className="col-span-1 space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Authority Role</label>
                       <select 
                         disabled={user?.role === 'hospital'}
                         value={user?.role === 'hospital' ? 'doctor' : newUser.role}
                         onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                         className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-700 appearance-none focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50"
                       >
                          <option value="doctor">Medical Doctor</option>
                          {user?.role !== 'hospital' && (
                            <>
                              <option value="admin">System Admin</option>
                              <option value="hospital">Hospital Node</option>
                              {user?.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
                            </>
                          )}
                       </select>
                    </div>

                    <div className="col-span-1 space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign Hospital Hub</label>
                       <select 
                         required
                         disabled={user?.role === 'hospital'}
                         value={user?.role === 'hospital' ? user.hospital_id : newUser.hospital_id}
                         onChange={(e) => setNewUser({...newUser, hospital_id: e.target.value})}
                         className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 text-xs font-black uppercase tracking-widest text-slate-700 appearance-none focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50"
                       >
                          {user?.role === 'hospital' ? (
                            <option value={user.hospital_id}>{user.hospital_id}</option>
                          ) : (
                            <>
                              <option value="">Select Hub...</option>
                              {hospitals.map(h => (
                                <option key={h.id} value={h.id}>{h.name}</option>
                              ))}
                              <option value="NOD-GLOBAL">NOD-GLOBAL</option>
                            </>
                          )}
                       </select>
                    </div>

                    <div className="col-span-2 space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Passcode</label>
                       <div className="relative">
                         <input 
                           required
                           type={showPassword ? "text" : "password"}
                           value={newUser.password}
                           onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                           className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold tracking-tight text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all italic"
                           placeholder="Minimum 8 characters"
                         />
                         <button 
                           type="button" 
                           onClick={() => setShowPassword(!showPassword)}
                           className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
                         >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                         </button>
                       </div>
                    </div>
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button 
                      type="button" 
                      onClick={() => setShowAddUserModal(false)}
                      className="flex-1 px-6 py-5 rounded-2xl bg-white border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
                    >
                      Cancel Protocol
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 px-6 py-5 rounded-2xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-blue-200"
                    >
                      Verify & Onboard
                    </button>
                 </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Hospital Modal */}
      <AnimatePresence>
        {showAddHospitalModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] overflow-hidden shadow-2xl"
            >
              <div className="bg-indigo-900 p-8 text-white relative">
                 <div className="absolute top-0 right-0 p-10 opacity-10">
                    <Hospital size={100} />
                 </div>
                 <h3 className="text-2xl font-black uppercase tracking-tighter italic">Register <span className="text-indigo-400">Node Hub</span></h3>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Federated cluster entry protocol</p>
              </div>

              <form onSubmit={handleCreateHospital} className="p-8 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hospital / Node Name</label>
                    <input 
                      required
                      type="text" 
                      value={newHospital.name}
                      onChange={(e) => setNewHospital({...newHospital, name: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold tracking-tight text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all italic"
                      placeholder="e.g. City General Center"
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Email</label>
                    <input 
                      required
                      type="email" 
                      value={newHospital.contact_email}
                      onChange={(e) => setNewHospital({...newHospital, contact_email: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold tracking-tight text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all italic"
                      placeholder="admin@citycenter.net"
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Node Address</label>
                    <textarea 
                      required
                      value={newHospital.address}
                      onChange={(e) => setNewHospital({...newHospital, address: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold tracking-tight text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all italic resize-none h-24"
                      placeholder="Physical or network address of the node hub"
                    />
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button 
                      type="button" 
                      onClick={() => setShowAddHospitalModal(false)}
                      className="flex-1 px-6 py-5 rounded-2xl bg-white border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
                    >
                      Cancel Protocol
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 px-6 py-5 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-indigo-200"
                    >
                      Verify & Add Node
                    </button>
                 </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .nav-btn {
          position: relative;
          overflow: hidden;
        }
        .nav-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: white;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .nav-btn:active::after {
          opacity: 0.1;
        }
      `}</style>
    </div>
  );
}
