import { useState, useEffect, useCallback } from "react";
import { type StudyPlanWithProgress, type Section } from "../lib/types";
import { apiClient } from "../lib/api";
import { toast } from "sonner";

interface UseStudyPlanReturn {
  plan: StudyPlanWithProgress | null;
  loading: boolean;
  error: Error | null;
  forkPlan: () => Promise<void>;
}

function mergeProgress(plan: StudyPlanWithProgress): StudyPlanWithProgress {
  if (!plan.progress) return plan;

  const sectionProgressMap = new Map(
    plan.progress.section_progresses.map((sp) => [sp.section_id, sp]),
  );

  const mergeSection = (section: Section): Section => {
    const sp = sectionProgressMap.get(section.id);
    return {
      ...section,
      status: sp?.status || "not_started",
      progress: sp?.progress || 0,
      children: section.children.map(mergeSection),
    };
  };

  return {
    ...plan,
    sections: plan.sections.map(mergeSection),
  };
}

export function useStudyPlan(planId: string): UseStudyPlanReturn {
  const [plan, setPlan] = useState<StudyPlanWithProgress | null>(null);
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

    apiClient
      .getStudyPlan(planId)
      .then((data) => {
        if (mounted) {
          setPlan(mergeProgress(data));
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
          toast.error("Error al cargar el plan");
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

    const toastId = toast.loading("Duplicando plan...");
    try {
      const newPlan = await apiClient.forkPlan(plan.id);
      setPlan(newPlan);
      toast.success("Plan duplicado exitosamente", { id: toastId });
    } catch (err) {
      toast.error("Error al duplicar el plan", { id: toastId });
      throw err;
    }
  }, [plan]);

  return { plan, loading, error, forkPlan };
}
