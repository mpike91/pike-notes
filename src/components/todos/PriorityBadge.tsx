'use client';

import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: number;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

const priorityConfig = {
  1: { label: 'P1', color: 'bg-priority-high', textColor: 'text-priority-high' },
  2: { label: 'P2', color: 'bg-priority-medium', textColor: 'text-priority-medium' },
  3: { label: 'P3', color: 'bg-priority-low', textColor: 'text-priority-low' },
} as const;

export function PriorityBadge({ priority, onClick, size = 'sm' }: PriorityBadgeProps) {
  const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig[2];

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'inline-flex items-center justify-center rounded-full font-medium transition-opacity hover:opacity-80',
          size === 'sm' ? 'h-4 w-4 text-[9px]' : 'h-5 w-5 text-[10px]',
          config.color,
          'text-white'
        )}
        title={`Priority ${priority} — click to cycle`}
      >
        {priority}
      </button>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium',
        size === 'sm' ? 'h-4 w-4 text-[9px]' : 'h-5 w-5 text-[10px]',
        config.color,
        'text-white'
      )}
    >
      {priority}
    </span>
  );
}
