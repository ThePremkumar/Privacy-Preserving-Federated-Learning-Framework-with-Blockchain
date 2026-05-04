'use client';

import { useAuthContext } from '@/context/AuthContext';
export type { User, UserRole, Hospital, Department } from '@/context/AuthContext';

export const useAuth = () => {
  const { user, isLoading, hasRole, setUser, logout, refreshUser } = useAuthContext();

  return {
    user,
    isLoading,
    hasRole,
    setUser,
    logout,
    refreshUser
  };
};
