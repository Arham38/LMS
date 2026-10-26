import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Breadcrumbs = ({ items = [], className = '' }) => {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center text-xs text-ink-muted', className)}>
      <ol className="flex items-center space-x-1.5">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;

          return (
            <li key={item.label || idx} className="flex items-center space-x-1.5">
              {idx > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-line-strong shrink-0 stroke-[1.5]" />
              )}
              {isLast || !item.to ? (
                <span
                  className={cn(
                    isLast ? 'font-medium text-ink' : 'text-ink-muted'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.to}
                  className="hover:text-ink transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
