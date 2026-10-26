import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Select = React.forwardRef(
  (
    {
      id,
      name,
      hasError = false,
      disabled = false,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <div className="relative w-full flex items-center">
        <select
          ref={ref}
          id={id}
          name={name}
          disabled={disabled}
          className={cn(
            'w-full h-10 pl-3 pr-8 py-2 text-sm bg-surface text-ink border rounded transition-colors duration-150 appearance-none',
            'border-line focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
            'disabled:bg-surface-alt disabled:text-ink-muted disabled:cursor-not-allowed',
            hasError && 'border-danger focus:border-danger focus:ring-danger text-danger',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-3 flex items-center pointer-events-none text-ink-muted">
          <ChevronDown className="w-4 h-4 stroke-[1.5]" />
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
