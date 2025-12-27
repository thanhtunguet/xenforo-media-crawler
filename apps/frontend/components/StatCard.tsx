import React from 'react';
import { GlassCard } from './ui/glass-card';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  href?: string;
  loading?: boolean;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({
  title,
  value,
  icon: Icon,
  href,
  loading = false,
  trend,
}: StatCardProps) {
  const [displayValue, setDisplayValue] = React.useState(0);

  // Animated counter effect
  React.useEffect(() => {
    if (loading) return;

    const duration = 1000; // 1 second
    const steps = 30;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, loading]);

  const content = (
    <GlassCard
      variant="hover-glow"
      className={`${href ? 'cursor-pointer' : ''} ${
        loading ? 'animate-pulse' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-white/60">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-4xl font-bold text-white">
              {loading ? '...' : displayValue.toLocaleString()}
            </p>
            {trend && !loading && (
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {trend.isPositive ? '+' : ''}
                {trend.value}%
              </span>
            )}
          </div>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-glow">
          <Icon className="h-7 w-7 text-white" />
        </div>
      </div>
    </GlassCard>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
