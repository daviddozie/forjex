import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'vercel' | 'destructive';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        {
          'border-transparent bg-neutral-900 text-neutral-50 dark:bg-neutral-50 dark:text-neutral-900':
            variant === 'default',
          'border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200':
            variant === 'secondary',
          'border-neutral-300 dark:border-neutral-800 text-neutral-800 dark:text-neutral-300':
            variant === 'outline',
          'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400':
            variant === 'success',
          'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400':
            variant === 'destructive',
          'border-neutral-300 bg-neutral-100 text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 shadow-sm':
            variant === 'vercel',
        },
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
