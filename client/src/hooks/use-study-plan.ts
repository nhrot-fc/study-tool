import { useState, useEffect, useCallback } from 'react';
import { type StudyPlan } from '../lib/types';
import { apiClient } from '../lib/api';
import { toast } from 'sonner';

interface UseStudyPlanReturn {
  plan: StudyPlan | null;
  loading: boolean;
  error: Error | null;
  forkPlan: () => Promise<void>;
}

export function useStudyPlan(planId: string): UseStudyPlanReturn {
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [prevPlanId, setPrevPlanId] = useState(planId);

  if (planId !== prevPlanId) {
    setPrevPlanId(planId);
    setLoading(true);
    setPlan(null);
    setError(null);
  }

  useEffect(() => {
    let mounted = true;
    
    apiClient.getStudyPlan(planId)
      .then((data) => {
        if (mounted) {
          setPlan(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
          toast.error('Error al cargar el plan');
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [planId]);

  const forkPlan = useCallback(async () => {
    if (!plan?.id) return;
    
    const toastId = toast.loading('Duplicando plan...');
    try {
      const newPlan = await apiClient.forkPlan(plan.id);
      setPlan(newPlan);
      toast.success('Plan duplicado exitosamente', { id: toastId });
    } catch (err) {
      toast.error('Error al duplicar el plan', { id: toastId });
      throw err;
    }
  }, [plan]);

  return { plan, loading, error, forkPlan };
}
