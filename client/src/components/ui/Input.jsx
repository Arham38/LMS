import React from 'react';
import { cn } from '../../utils/cn';

export const Input = React.forwardRef(
  (
    {
      id,
      name,
      type = 'text',
      hasError = false,
      disabled = false,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <div className="relative w-full flex items-center">
        {LeftIcon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-ink-muted">
            <LeftIcon className="w-4 h-4 stroke-[1.5]" />
          </div>
        )}
        <input
          ref={ref}
          id={id}
          name={name}
          type={type}
          disabled={disabled}
          className={cn(
            'w-full h-10 px-3 py-2 text-sm bg-surface text-ink placeholder:text-ink-muted/60 border rounded transition-colors duration-150',
            'border-line focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
            'disabled:bg-surface-alt disabled:text-ink-muted disabled:cursor-not-allowed',
            hasError && 'border-danger focus:border-danger focus:ring-danger text-danger',
            LeftIcon && 'pl-9',
            RightIcon && 'pr-9',
            className
          )}
          {...props}
        />
        {RightIcon && (
          <div className="absolute right-3 flex items-center pointer-events-none text-ink-muted">
            <RightIcon className="w-4 h-4 stroke-[1.5]" />
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
