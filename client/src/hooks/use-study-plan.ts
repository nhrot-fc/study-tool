import { useState, useEffect, useCallback } from "react";
import {
  type StudyPlanWithProgress,
  type Section,
  type CompletionStatus,
  type ResourceProgress,
} from "../lib/types";
import { apiClient } from "../lib/api";
import { toast } from "sonner";

interface UseStudyPlanReturn {
  plan: StudyPlanWithProgress | null;
  loading: boolean;
  error: Error | null;
  forkPlan: () => Promise<void>;
  toggleResourceStatus: (
    sectionId: string,
    resourceId: string,
    currentStatus: CompletionStatus,
  ) => Promise<void>;
}

function mergeProgress(plan: StudyPlanWithProgress): StudyPlanWithProgress {
  if (!plan.progress) return plan;

  const sectionProgressMap = new Map(
    plan.progress.section_progresses.map((sp) => [sp.section_id, sp]),
  );

  const resourceProgressMap = new Map<string, ResourceProgress>();
  plan.progress.section_progresses.forEach((sp) => {
    sp.resource_progresses.forEach((rp) => {
      resourceProgressMap.set(rp.resource_id, rp);
    });
  });

  const mergeSection = (section: Section): Section => {
    const sp = sectionProgressMap.get(section.id);

    const mergedResources = section.resources.map((resource) => {
      const rp = resourceProgressMap.get(resource.id);
      return {
        ...resource,
        status: rp?.status || "not_started",
      };
    });

    return {
      ...section,
      status: sp?.status || "not_started",
      progress: sp?.progress || 0,
      resources: mergedResources,
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

  const toggleResourceStatus = useCallback(
    async (
      sectionId: string,
      resourceId: string,
      currentStatus: CompletionStatus,
    ) => {
      if (!planId) return;

      const newStatus: CompletionStatus =
        currentStatus === "completed" ? "not_started" : "completed";

      // Optimistic update
      setPlan((prev) => {
        if (!prev) return null;
        const updateSection = (section: Section): Section => {
          if (section.id === sectionId) {
            return {
              ...section,
              resources: section.resources.map((r) =>
                r.id === resourceId ? { ...r, status: newStatus } : r,
              ),
            };
          }
          return {
            ...section,
            children: section.children.map(updateSection),
          };
        };

        return {
          ...prev,
          sections: prev.sections.map(updateSection),
        };
      });

      try {
        await apiClient.updateResourceStatus(
          planId,
          sectionId,
          resourceId,
          newStatus,
        );

        // Re-fetch to get updated progress
        const updatedPlan = await apiClient.getStudyPlan(planId);
        setPlan(mergeProgress(updatedPlan));
      } catch (err) {
        console.error("Error updating resource status", err);
        // Revert on error
        setPlan((prev) => {
          if (!prev) return null;
          const updateSection = (section: Section): Section => {
            if (section.id === sectionId) {
              return {
                ...section,
                resources: section.resources.map((r) =>
                  r.id === resourceId ? { ...r, status: currentStatus } : r,
                ),
              };
            }
            return {
              ...section,
              children: section.children.map(updateSection),
            };
          };

          return {
            ...prev,
            sections: prev.sections.map(updateSection),
          };
        });
        toast.error("Error al actualizar el estado");
      }
    },
    [planId],
  );

  return { plan, loading, error, forkPlan, toggleResourceStatus };
}
