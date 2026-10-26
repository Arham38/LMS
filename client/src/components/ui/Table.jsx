import React from 'react';
import { cn } from '../../utils/cn';
import Skeleton from './Skeleton';
import EmptyState from './EmptyState';
import Pagination from './Pagination';

export const Table = ({
  columns = [],
  data = [],
  keyField = 'id',
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items to display right now.',
  emptyActionLabel,
  onEmptyAction,
  pagination,
  onPageChange,
  className = '',
}) => {
  return (
    <div className={cn('bg-surface border border-line rounded-lg shadow-card overflow-hidden flex flex-col', className)}>
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-alt/70 text-ink-muted text-xs uppercase tracking-wider font-semibold sticky top-0 z-10 select-none">
              {columns.map((col, index) => (
                <th
                  key={col.key || index}
                  className={cn(
                    'h-10 px-4 whitespace-nowrap',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.className
                  )}
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-ink">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rowIdx) => (
                <tr key={`skeleton-row-${rowIdx}`} className="h-11">
                  {columns.map((col, colIdx) => (
                    <td key={`skeleton-col-${colIdx}`} className="px-4 py-3">
                      <Skeleton className="h-4 w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-8">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    actionLabel={emptyActionLabel}
                    onAction={onEmptyAction}
                  />
                </td>
              </tr>
            ) : (
              data.map((item, rowIdx) => (
                <tr
                  key={item[keyField] || rowIdx}
                  className="h-11 transition-colors hover:bg-surface-alt/60"
                >
                  {columns.map((col, colIdx) => {
                    const value = col.accessor ? col.accessor(item) : item[col.key];
                    const isNumeric = col.align === 'right' || typeof value === 'number';

                    return (
                      <td
                        key={col.key || colIdx}
                        className={cn(
                          'px-4 py-2.5 whitespace-nowrap text-sm',
                          isNumeric && 'text-right tabular-nums',
                          col.align === 'center' && 'text-center',
                          col.className
                        )}
                      >
                        {col.render ? col.render(value, item, rowIdx) : value ?? '—'}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <Pagination
          page={pagination.page}
          limit={pagination.limit}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};

export default Table;
