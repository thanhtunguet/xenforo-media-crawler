import * as React from 'react';
import { cn } from '../../lib/utils';
import { ButtonSize, ButtonVariant } from '../../lib/enums';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = ButtonVariant.DEFAULT,
      size = ButtonSize.DEFAULT,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-primary text-primary-foreground hover:bg-primary/90':
              variant === ButtonVariant.DEFAULT,
            'bg-destructive text-destructive-foreground hover:bg-destructive/90':
              variant === ButtonVariant.DESTRUCTIVE,
            'border border-input bg-background hover:bg-accent hover:text-accent-foreground':
              variant === ButtonVariant.OUTLINE,
            'bg-secondary text-secondary-foreground hover:bg-secondary/80':
              variant === ButtonVariant.SECONDARY,
            'hover:bg-accent hover:text-accent-foreground':
              variant === ButtonVariant.GHOST,
            'text-primary underline-offset-4 hover:underline':
              variant === ButtonVariant.LINK,
            'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:border-white/30 shadow-glow hover:shadow-glow-lg':
              variant === ButtonVariant.GLASS,
            'bg-gradient-to-r from-indigo-600 to-blue-600 backdrop-blur-md border border-indigo-500/50 text-white hover:from-indigo-500 hover:to-blue-500 shadow-glow hover:shadow-glow-lg':
              variant === ButtonVariant.GLASS_PRIMARY,
            'bg-gradient-to-r from-rose-600 to-pink-600 backdrop-blur-md border border-rose-500/50 text-white hover:from-rose-500 hover:to-pink-500 shadow-glow hover:shadow-glow-lg':
              variant === ButtonVariant.GLASS_DANGER,
          },
          {
            'h-10 px-4 py-2': size === ButtonSize.DEFAULT,
            'h-9 rounded-md px-3': size === ButtonSize.SM,
            'h-11 rounded-md px-8': size === ButtonSize.LG,
            'h-10 w-10': size === ButtonSize.ICON,
          },
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button };
