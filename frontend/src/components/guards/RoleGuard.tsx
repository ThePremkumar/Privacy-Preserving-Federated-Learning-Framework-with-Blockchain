'use client';

import { useAuth, UserRole } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallbackUrl?: string;
}

export function RoleGuard({ children, allowedRoles, fallbackUrl = '/dashboard' }: RoleGuardProps) {
  const { user, hasRole, isLoading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not logged in
        router.push('/login');
      } else if (!hasRole(allowedRoles)) {
        // Logged in but insufficient permissions
        setIsAuthorized(false);
      } else {
        // Authorized
        setIsAuthorized(true);
      }
    }
  }, [user, isLoading, hasRole, allowedRoles, router]);

  if (isLoading || isAuthorized === null) {
    return (
      <div className="flex h-full w-full items-center justify-center p-10">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-red-100 bg-red-50/50 p-10 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-100 text-red-600">
          <ShieldAlert size={40} />
        </div>
        <h2 className="mb-2 text-2xl font-black text-slate-900 uppercase tracking-tighter">Access Denied</h2>
        <p className="mb-6 max-w-sm text-sm font-medium text-slate-500 leading-relaxed">
          Your current role (<span className="font-bold text-slate-700 capitalize">{user?.role.replace('_', ' ')}</span>) does not have the required permissions to view this module.
        </p>
        <button
          onClick={() => router.push(fallbackUrl)}
          className="rounded-xl bg-slate-900 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-slate-900/20 transition-all hover:bg-blue-600 hover:shadow-blue-600/30"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
