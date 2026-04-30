import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export interface Referral {
  id: string;
  notification_id: string;
  patient_id: string;
  status: 'pending' | 'reviewed' | 'flagged';
  admin_notes: string;
  priority: 'normal' | 'urgent' | 'critical';
  created_at: string;
  patient: any;
  sending_doctor: { name: string };
  notification: { is_read: boolean; message: string };
}

export function useReferrals(status?: string) {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReferrals = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = status && status !== 'all' ? `/patients/referrals?status=${status}` : '/patients/referrals';
      const res = await api.get(url);
      setReferrals(res.data);
    } catch (err) {
      console.error('Failed to fetch referrals:', err);
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/patients/referrals/${id}/read`);
      setReferrals(prev => prev.map(r => r.id === id ? { ...r, notification: { ...r.notification, is_read: true } } : r));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const submitReview = async (id: string, review: { status: string; admin_notes: string; priority: string }) => {
    try {
      await api.post(`/patients/referrals/${id}/review`, review);
      await fetchReferrals();
    } catch (err) {
      console.error('Failed to submit review:', err);
      throw err;
    }
  };

  return { referrals, isLoading, fetchReferrals, markAsRead, submitReview };
}
