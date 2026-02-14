import { cn } from '@/lib/cn';
import { CATEGORIES } from '@/lib/categories';
import { CategoryTag } from '@/types/trip';

interface BadgeProps {
  category: CategoryTag;
  size?: 'sm' | 'md';
  onClick?: () => void;
  active?: boolean;
}

export default function Badge({ category, size = 'sm', onClick, active = true }: BadgeProps) {
  const config = CATEGORIES[category];
  return (
    <span
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        active ? `${config.bgColor} ${config.textColor}` : 'bg-gray-100 text-gray-400',
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity'
      )}
    >
      {config.label}
    </span>
  );
}
