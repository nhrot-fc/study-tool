import { type Section, type SectionStatus } from '../../lib/types';
import { ChevronRight, CheckCircle2, Circle, Clock, type LucideIcon } from 'lucide-react';
import { ResourceCard } from '../resources/ResourceCard';
import { cn } from '../../lib/utils';

interface SectionTreeProps {
  section: Section;
  depth?: number;
}

interface StatusConfigItem {
  icon: LucideIcon;
  color: string;
}

const STATUS_CONFIG: Record<SectionStatus, StatusConfigItem> = {
  NOT_STARTED: { icon: Circle, color: 'text-gray-400' },
  IN_PROGRESS: { icon: Clock, color: 'text-blue-500' },
  COMPLETED: { icon: CheckCircle2, color: 'text-green-500' }
};

function SectionHeader({ section, depth }: { section: Section; depth: number }) {
  const status = section.status || 'NOT_STARTED';
  const { icon: StatusIcon, color: statusColor } = STATUS_CONFIG[status];

  return (
    <div className="flex items-start gap-3 w-full">
      <StatusIcon className={cn("size-5 flex-shrink-0 mt-1", statusColor)} />
      <div className="flex-1 min-w-0 text-left">
        <h3 className={cn(
          "font-medium",
          depth === 0 ? "text-gray-900" : "text-gray-800"
        )}>
          {section.title}
        </h3>
        {section.description && (
          <p className="text-sm text-gray-600 mt-1">{section.description}</p>
        )}
      </div>
    </div>
  );
}

export function SectionTree({ section, depth = 0 }: SectionTreeProps) {
  const hasResources = section.resources && section.resources.length > 0;
  const hasChildren = section.children && section.children.length > 0;
  const hasNotes = !!section.notes;
  const hasContent = hasChildren || hasResources || hasNotes;

  const containerClasses = cn(
    "bg-white border border-gray-200 rounded-lg",
    depth > 0 && "ml-6 mt-3"
  );

  if (!hasContent) {
    return (
      <div className={cn(containerClasses, "p-4")}>
        <SectionHeader section={section} depth={depth} />
      </div>
    );
  }

  return (
    <details 
      className={cn(containerClasses, "group overflow-hidden")}
      open={depth === 0}
    >
      <summary className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors list-none [&::-webkit-details-marker]:hidden">
        <div className="mt-1 transition-transform group-open:rotate-90">
          <ChevronRight className="size-5 text-gray-500" />
        </div>
        <SectionHeader section={section} depth={depth} />
      </summary>

      <div className="px-4 pb-4 pl-12">
        {hasNotes && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4 text-sm text-amber-900">
            <span className="font-medium">Notas: </span>{section.notes}
          </div>
        )}

        {hasResources && (
          <div className="space-y-3 mb-4">
            <h4 className="text-sm font-medium text-gray-700">Recursos:</h4>
            {section.resources.map((resource, index) => (
              <ResourceCard 
                key={resource.id || resource.url || index} 
                resource={resource} 
              />
            ))}
          </div>
        )}

        {hasChildren && (
          <div className="space-y-3">
            {section.children
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((child, index) => (
                <SectionTree 
                  key={child.id || child.title || index} 
                  section={child} 
                  depth={depth + 1}
                />
              ))}
          </div>
        )}
      </div>
    </details>
  );
}
