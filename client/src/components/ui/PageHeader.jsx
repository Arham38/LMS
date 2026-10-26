import React from 'react';
import { cn } from '../../utils/cn';
import Breadcrumbs from './Breadcrumbs';

export const PageHeader = ({
  title,
  description,
  breadcrumbs = [],
  action,
  badge,
  className = '',
}) => {
  return (
    <div className={cn('flex flex-col gap-3 pb-6 border-b border-line mb-6', className)}>
      {breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} className="mb-1" />}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display font-semibold text-2xl md:text-3xl text-ink tracking-tight">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>

          {description && (
            <p className="text-sm text-ink-muted mt-1 max-w-prose leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {action && (
          <div className="shrink-0 flex items-center gap-2.5 self-start md:self-center">
            {action}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
