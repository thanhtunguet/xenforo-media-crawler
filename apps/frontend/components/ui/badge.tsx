import * as React from 'react';
import { cn } from '../../lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  icon?: LucideIcon;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', icon: Icon, children, ...props }, ref) => {
    const getVariantStyles = () => {
      switch (variant) {
        case 'success':
          return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow-glow';
        case 'warning':
          return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
        case 'error':
          return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
        case 'info':
          return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
        default:
          return 'bg-white/10 text-white/80 border-white/20';
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md border transition-all',
          getVariantStyles(),
          className
        )}
        {...props}
      >
        {Icon && <Icon className="w-3 h-3" />}
        {children}
      </div>
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };
