import React from 'react';
import { cn } from '../../utils/cn';

export const Textarea = React.forwardRef(
  (
    {
      id,
      name,
      rows = 4,
      hasError = false,
      disabled = false,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <textarea
        ref={ref}
        id={id}
        name={name}
        rows={rows}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 text-sm bg-surface text-ink placeholder:text-ink-muted/60 border rounded transition-colors duration-150 resize-y',
          'border-line focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
          'disabled:bg-surface-alt disabled:text-ink-muted disabled:cursor-not-allowed',
          hasError && 'border-danger focus:border-danger focus:ring-danger text-danger',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;
