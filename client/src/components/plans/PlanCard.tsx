import { type StudyPlanSummary } from '../../lib/types';
import { BookOpen, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

interface PlanCardProps {
  plan: StudyPlanSummary;
  onClick: () => void;
}

export function PlanCard({ plan, onClick }: PlanCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full bg-white border border-gray-200 rounded-lg p-5",
        "hover:border-blue-400 hover:shadow-md transition-all",
        "text-left group flex flex-col h-full"
      )}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
          <BookOpen className="size-5" />
        </div>
        {plan.created_at && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Calendar className="size-3" />
            <span>{format(new Date(plan.created_at), 'dd/MM/yyyy')}</span>
          </div>
        )}
      </div>

      <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
        {plan.title}
      </h3>
      
      <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1">
        {plan.description}
      </p>
    </button>
  );
}
