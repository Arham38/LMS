import React from 'react';
import { cn } from '../../utils/cn';

export const ProgressBar = ({
  value = 0,
  max = 100,
  label,
  showPercentage = false,
  className = '',
  barClassName = '',
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  return (
    <div className={cn('w-full flex flex-col gap-1.5', className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs text-ink-muted">
          {label && <span className="font-medium text-ink">{label}</span>}
          {showPercentage && <span className="tabular-nums font-mono">{percentage}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || 'Progress'}
        className="w-full h-1.5 bg-surface-alt rounded-full overflow-hidden border border-line/60"
      >
        <div
          className={cn(
            'h-full bg-primary transition-all duration-300 ease-out rounded-full',
            barClassName
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
