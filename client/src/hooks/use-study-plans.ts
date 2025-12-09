import { useState, useEffect, useCallback } from 'react';
import { type StudyPlanSummary } from '../lib/types';
import { apiClient } from '../lib/api';
import { toast } from 'sonner';
import { useAuth } from './use-auth';

interface UseStudyPlansReturn {
  plans: StudyPlanSummary[];
  status: 'loading' | 'error' | 'success';
  refreshPlans: () => Promise<void>;
}

export function useStudyPlans(): UseStudyPlansReturn {
  const { user } = useAuth();
  const [plans, setPlans] = useState<StudyPlanSummary[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');

  const loadPlans = useCallback(async (userId: string) => {
    try {
      const data = await apiClient.getStudyPlans(userId);
      setPlans(data);
      setStatus('success');
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      setStatus('error');
      toast.error('Error al cargar los planes de estudio');
    }
  }, []);

  useEffect(() => {
    if (user) {
      const execute = async () => {
        await loadPlans(user.id);
      };
      execute();
    }
  }, [user, loadPlans]);

  const refreshPlans = async () => {
    if (!user) return;
    setStatus('loading');
    await loadPlans(user.id);
  };

  return { plans, status, refreshPlans };
}
