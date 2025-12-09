import { SectionTree } from '../sections/SectionTree';
import { ResourceCard } from '../resources/ResourceCard';
import { ArrowLeft, Copy, Loader2 } from 'lucide-react';
import { useStudyPlan } from '../../hooks/use-study-plan';

interface PlanDetailProps {
  planId: string;
  onBack: () => void;
}

export function PlanDetail({ planId, onBack }: PlanDetailProps) {
  const { plan, loading, forkPlan } = useStudyPlan(planId);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button 
        onClick={onBack} 
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="size-4" /> Volver
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{plan.title}</h1>
            <p className="mt-2 text-gray-600">{plan.description}</p>
          </div>
          <button 
            onClick={forkPlan} 
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
            title="Duplicar plan"
          >
            <Copy className="size-5" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Contenido</h2>
        {plan.sections?.map((section, index) => (
          <SectionTree 
            key={section.id || section.title || index} 
            section={section} 
          />
        ))}
      </div>

      {plan.resources && plan.resources.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Recursos Generales</h2>
          <div className="grid gap-3">
            {plan.resources.map((resource, index) => (
              <ResourceCard 
                key={resource.id || resource.url || index} 
                resource={resource} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
