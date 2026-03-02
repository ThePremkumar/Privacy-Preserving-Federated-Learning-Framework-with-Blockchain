'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export type UserRole = 'super_admin' | 'admin' | 'hospital' | 'doctor';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  hospital_id?: string;
  email: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      const userData = response.data;
      setUser({
        id: userData.id,
        username: userData.username,
        name: userData.username, // Using username as name for now
        role: userData.role as UserRole,
        hospital_id: userData.hospital_id,
        email: userData.email,
      });
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const hasRole = (roles: UserRole[]) => {
    return user ? roles.includes(user.role) : false;
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    window.location.href = '/login';
  };

  return {
    user,
    isLoading,
    hasRole,
    setUser,
    logout,
    refreshUser: fetchUser
  };
};
