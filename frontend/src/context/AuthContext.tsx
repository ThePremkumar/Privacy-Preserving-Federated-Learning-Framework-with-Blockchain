'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export type UserRole = 'super_admin' | 'admin' | 'hospital' | 'doctor';

export interface Hospital {
  id: string;
  name: string;
  short_name?: string;
  city?: string;
  state?: string;
  country?: string;
  logo_initials?: string;
  website?: string;
  phone?: string;
  organization_type?: string;
  active_specializations?: string[];
  active_departments?: string[];
}

export interface Department {
  id: number;
  name: string;
  code?: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  hospital_id?: string;
  hospital_name?: string;
  email: string;
  hospital?: Hospital;
  department?: Department;
  permissions: string[];
  is_first_login?: boolean;
  department_ids?: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      const userData = response.data;
      const mapped: User = {
        id: userData.id,
        username: userData.username,
        name: userData.username,
        role: userData.role as UserRole,
        hospital_id: userData.hospital_id,
        hospital_name: userData.hospital?.name,
        email: userData.email,
        hospital: userData.hospital,
        department: userData.department,
        department_ids: userData.department_ids,
        permissions: userData.permissions || [],
        is_first_login: userData.is_first_login,
      };
      setUser(mapped);
    } catch (error) {
      console.error('Auth check failed:', error);
      // Only clear on an explicit 401 — network errors should not log the user out
      if ((error as any)?.response?.status === 401) {
        localStorage.removeItem('auth_token');
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    // Validate token against the server in the background;
    // the cached user is already shown while this runs.
    fetchUser();
  }, [fetchUser]);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    setUser(null);
    window.location.href = '/login';
  }, []);

  const hasRole = useCallback((roles: UserRole[]) => {
    return user ? roles.includes(user.role) : false;
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      setUser,
      refreshUser: fetchUser,
      logout,
      hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
