import { type Resource, type ResourceType } from '../../lib/types';
import { ExternalLink, FileText, Video, Book, FileCode, PenTool, GitBranch, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ResourceCardProps {
  resource: Resource;
}

const TYPE_ICONS: Record<ResourceType, LucideIcon> = {
  video: Video,
  article: FileText,
  book: Book,
  documentation: FileCode,
  blog: PenTool,
  repository: GitBranch,
  other: FileText
};

export function ResourceCard({ resource }: ResourceCardProps) {
  const Icon = TYPE_ICONS[resource.type] || FileText;

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg",
        "hover:border-blue-400 hover:shadow-sm transition-all group"
      )}
    >
      <div className="p-2 bg-gray-100 rounded-md text-gray-600 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
        <Icon className="size-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 truncate">
            {resource.title}
          </h4>
          <ExternalLink className="size-3 text-gray-400 flex-shrink-0" />
        </div>
        
        {resource.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
            {resource.description}
          </p>
        )}
        
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium bg-gray-100 px-1.5 py-0.5 rounded">
            {resource.type}
          </span>
          {resource.duration_minutes && (
            <span className="text-[10px] text-gray-400">
              {resource.duration_minutes} min
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
