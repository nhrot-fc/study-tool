import { PlanCard } from './PlanCard';
import { Loader2, Plus } from 'lucide-react';
import { useStudyPlans } from '../../hooks/use-study-plans';

interface PlanListProps {
  onSelectPlan: (planId: string) => void;
}

export function PlanList({ onSelectPlan }: PlanListProps) {
  const { plans, status } = useStudyPlans();

  if (status === 'loading') {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg">
        Error al cargar los planes. Por favor intenta nuevamente.
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
        <div className="mx-auto size-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
          <Plus className="size-6 text-gray-400" />
        </div>
        <h3 className="text-gray-900 font-medium">No hay planes</h3>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          onClick={() => {
            if (plan.id) {
              onSelectPlan(plan.id);
            }
          }}
        />
      ))}
    </div>
  );
}
