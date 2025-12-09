import { useState, useEffect, useCallback } from 'react';
import { type StudyPlan } from '../lib/types';
import { apiClient } from '../lib/api';
import { toast } from 'sonner';
import { useAuth } from './use-auth';

interface UseStudyPlansReturn {
  plans: StudyPlan[];
  status: 'loading' | 'error' | 'success';
  refreshPlans: () => Promise<void>;
}

export function useStudyPlans(): UseStudyPlansReturn {
  const { user } = useAuth();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');

  const fetchPlans = useCallback(async (isRefresh = false) => {
    if (!user) return;

    if (isRefresh) {
      setStatus('loading');
    }
    
    try {
      const data = await apiClient.getStudyPlans(user.id);
      setPlans(data);
      setStatus('success');
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      setStatus('error');
      toast.error('Error al cargar los planes de estudio');
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPlans();
    }
  }, [fetchPlans, user]);

  return { plans, status, refreshPlans: () => fetchPlans(true) };
}
