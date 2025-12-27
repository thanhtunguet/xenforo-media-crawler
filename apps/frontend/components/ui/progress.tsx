import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  status?: 'syncing' | 'completed' | 'failed';
  showPercentage?: boolean;
  statusText?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      status = 'syncing',
      showPercentage = true,
      statusText,
      ...props
    },
    ref
  ) => {
    const percentage = Math.round((value / max) * 100);

    const getStatusColor = () => {
      switch (status) {
        case 'completed':
          return 'from-emerald-500 to-green-500';
        case 'failed':
          return 'from-rose-500 to-red-500';
        default:
          return 'from-indigo-500 to-cyan-500';
      }
    };

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {(showPercentage || statusText) && (
          <div className="flex items-center justify-between mb-2">
            {statusText && (
              <span className="text-sm text-white/80">{statusText}</span>
            )}
            {showPercentage && (
              <span className="text-sm text-white/60">{percentage}%</span>
            )}
          </div>
        )}
        <div className="h-3 w-full rounded-full bg-white/10 backdrop-blur-md border border-white/20 overflow-hidden">
          <div
            className={cn(
              'h-full bg-gradient-to-r transition-all duration-300 ease-out',
              getStatusColor()
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);
Progress.displayName = 'Progress';

export { Progress };
