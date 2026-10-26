import React from 'react';
import { cn } from '../../utils/cn';

export const Tabs = ({
  tabs = [],
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div className={cn('border-b border-line flex items-center gap-6 overflow-x-auto no-scrollbar', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange?.(tab.id)}
            className={cn(
              'pb-3 pt-2 text-sm font-medium transition-colors duration-150 inline-flex items-center gap-2 border-b-2 -mb-px whitespace-nowrap select-none',
              isActive
                ? 'border-primary text-ink font-semibold'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-line-strong'
            )}
          >
            {Icon && <Icon className="w-4 h-4 stroke-[1.5]" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'text-xs px-1.5 py-0.2 rounded-full',
                  isActive ? 'bg-primary-soft text-primary' : 'bg-surface-alt text-ink-muted'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
