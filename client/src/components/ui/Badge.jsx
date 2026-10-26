import React from 'react';
import { cn } from '../../utils/cn';

export const Badge = ({
  children,
  variant = 'neutral',
  dot = false,
  className = '',
  ...props
}) => {
  const variants = {
    neutral: 'bg-surface-alt text-ink-muted border-line',
    success: 'bg-success-soft text-success border-success/20',
    warning: 'bg-warning-soft text-warning border-warning/20',
    danger: 'bg-danger-soft text-danger border-danger/20',
    info: 'bg-info-soft text-info border-info/20',
    accent: 'bg-accent-soft text-accent border-accent/20',
    primary: 'bg-primary-soft text-primary border-primary/20',
  };

  const dotColors = {
    neutral: 'bg-ink-muted',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-info',
    accent: 'bg-accent',
    primary: 'bg-primary',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full border leading-tight select-none',
        variants[variant] || variants.neutral,
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant] || dotColors.neutral)}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
