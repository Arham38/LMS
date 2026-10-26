import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export const StatStrip = ({ items = [], className = '' }) => {
  return (
    <div
      className={cn(
        'grid grid-cols-2 md:grid-cols-4 bg-surface border border-line rounded-lg shadow-card divide-x divide-y md:divide-y-0 divide-line overflow-hidden',
        className
      )}
    >
      {items.map((stat, idx) => {
        const isPositive = stat.changeType === 'increase';
        const isNegative = stat.changeType === 'decrease';

        return (
          <div key={stat.label || idx} className="p-4 flex flex-col justify-between">
            <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">
              {stat.label}
            </span>

            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="font-display font-semibold text-2xl text-ink tabular-nums tracking-tight">
                {stat.value}
              </span>

              {stat.change && (
                <span
                  className={cn(
                    'text-xs font-medium inline-flex items-center gap-0.5 tabular-nums',
                    isPositive && 'text-success',
                    isNegative && 'text-danger',
                    !isPositive && !isNegative && 'text-ink-muted'
                  )}
                >
                  {isPositive && <ArrowUpRight className="w-3.5 h-3.5 stroke-[2]" />}
                  {isNegative && <ArrowDownRight className="w-3.5 h-3.5 stroke-[2]" />}
                  {stat.change}
                </span>
              )}
            </div>

            {stat.helper && (
              <span className="text-[11px] text-ink-muted/80 mt-1">
                {stat.helper}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StatStrip;
