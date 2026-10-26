import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import Button from './Button';

export const Pagination = ({
  page = 1,
  limit = 20,
  total = 0,
  totalPages = 1,
  onPageChange,
  className = '',
}) => {
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (page >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', page - 1, page, page + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 py-3 px-4 border-t border-line text-xs text-ink-muted select-none',
        className
      )}
    >
      <div className="tabular-nums">
        Showing <span className="font-medium text-ink">{startItem}</span> to{' '}
        <span className="font-medium text-ink">{endItem}</span> of{' '}
        <span className="font-medium text-ink">{total}</span> results
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange?.(page - 1)}
          aria-label="Previous page"
          className="h-8 px-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        <div className="hidden md:flex items-center gap-1 mx-1">
          {getPageNumbers().map((p, idx) =>
            p === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-ink-muted">
                ...
              </span>
            ) : (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onPageChange?.(p)}
                className={cn(
                  'h-8 min-w-[32px] px-2 text-xs font-medium rounded transition-colors tabular-nums',
                  page === p
                    ? 'bg-primary text-surface font-semibold'
                    : 'text-ink hover:bg-surface-alt'
                )}
              >
                {p}
              </button>
            )
          )}
        </div>

        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange?.(page + 1)}
          aria-label="Next page"
          className="h-8 px-2"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
