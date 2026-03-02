'use client';

import { useState, useEffect } from 'react';

export type UserRole = 'super_admin' | 'admin' | 'hospital' | 'doctor';

interface User {
  id: string;
  name: string;
  role: UserRole;
  hospital_id?: string;
  email: string;
}

export const useAuth = () => {
  // Simple mock user for development
  // In production, this would come from a Context provider connected to backend
  const [user, setUser] = useState<User | null>({
    id: 'u-1234',
    name: 'Dr. Adrian Storm',
    role: 'super_admin', // Toggle this to test different views
    email: 'adrian.storm@hospital.net'
  });

  const [isLoading, setIsLoading] = useState(false);

  // Helper to check permissions
  const hasRole = (roles: UserRole[]) => {
    return user ? roles.includes(user.role) : false;
  };

  return {
    user,
    isLoading,
    hasRole,
    setUser
  };
};
