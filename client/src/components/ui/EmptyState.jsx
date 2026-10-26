import React from 'react';
import { cn } from '../../utils/cn';
import Button from './Button';

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionButton,
  className = '',
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 border border-line border-dashed rounded-lg bg-surface/50 max-w-md mx-auto my-6',
        className
      )}
    >
      {Icon && (
        <div className="w-10 h-10 rounded-full bg-surface-alt flex items-center justify-center text-ink-muted mb-4 border border-line">
          <Icon className="w-5 h-5 stroke-[1.5]" />
        </div>
      )}

      {title && (
        <h3 className="font-display font-semibold text-lg text-ink mb-1">
          {title}
        </h3>
      )}

      {description && (
        <p className="text-sm text-ink-muted max-w-sm mb-5 leading-relaxed">
          {description}
        </p>
      )}

      {actionButton ? (
        actionButton
      ) : actionLabel && onAction ? (
        <Button variant="secondary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
};

export default EmptyState;
