import { useState, useEffect, useCallback } from 'react';
import { type StudyPlan } from '../lib/types';
import { apiClient } from '../lib/api';
import { toast } from 'sonner';

interface UseStudyPlansReturn {
  plans: StudyPlan[];
  status: 'loading' | 'error' | 'success';
  refreshPlans: () => Promise<void>;
}

export function useStudyPlans(): UseStudyPlansReturn {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');

  const fetchPlans = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setStatus('loading');
    }
    
    try {
      const data = await apiClient.getStudyPlans();
      setPlans(data);
      setStatus('success');
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      setStatus('error');
      toast.error('Error al cargar los planes de estudio');
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    apiClient.getStudyPlans()
      .then((data) => {
        setPlans(data);
        setStatus('success');
      })
      .catch((error) => {
        console.error('Failed to fetch plans:', error);
        setStatus('error');
        toast.error('Error al cargar los planes de estudio');
      });
  }, []);

  return { plans, status, refreshPlans: () => fetchPlans(true) };
}
