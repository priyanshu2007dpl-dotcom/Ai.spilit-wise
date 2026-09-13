import { getInitials, getAvatarColor } from '@/lib/format';

interface AvatarProps {
  name: string;
  id: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  src?: string | null;
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

export function Avatar({ name, id, size = 'md', src, className = '' }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover ${sizeClasses[size]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center text-cream-50 font-semibold ${getAvatarColor(id)} ${sizeClasses[size]} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
