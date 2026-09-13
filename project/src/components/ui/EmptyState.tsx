import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="w-16 h-16 rounded-2xl bg-cream-200 flex items-center justify-center text-brown-400 mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-brown-800 mb-1">{title}</h3>
      {description && <p className="text-sm text-brown-500 max-w-xs mb-4">{description}</p>}
      {action}
    </div>
  );
}
