import { ReactNode } from 'react';

type BadgeVariant = 'neutral' | 'success' | 'danger' | 'warning' | 'info' | 'brown';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-cream-200 text-brown-600',
  success: 'bg-success-50 text-success-700',
  danger: 'bg-danger-50 text-danger-700',
  warning: 'bg-warning-50 text-warning-600',
  info: 'bg-blue-50 text-blue-700',
  brown: 'bg-brown-100 text-brown-700',
};

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
