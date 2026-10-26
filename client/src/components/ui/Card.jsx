import React from 'react';
import { cn } from '../../utils/cn';

export const Card = ({
  children,
  className = '',
  as: Component = 'div',
  ...props
}) => {
  return (
    <Component
      className={cn(
        'bg-surface border border-line rounded-lg shadow-card overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};

export const CardHeader = ({
  children,
  className = '',
  title,
  subtitle,
  action,
  ...props
}) => {
  return (
    <div
      className={cn(
        'px-5 py-4 border-b border-line flex items-center justify-between gap-4',
        className
      )}
      {...props}
    >
      {title || subtitle ? (
        <div className="flex flex-col">
          {title && <h3 className="font-display font-semibold text-base text-ink">{title}</h3>}
          {subtitle && <p className="text-xs text-ink-muted mt-0.5">{subtitle}</p>}
        </div>
      ) : (
        children
      )}
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export const CardContent = ({ children, className = '', ...props }) => {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className = '', ...props }) => {
  return (
    <div
      className={cn(
        'px-5 py-3.5 bg-surface-alt/40 border-t border-line flex items-center justify-between gap-3 text-xs text-ink-muted',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
