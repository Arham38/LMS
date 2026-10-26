import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Checkbox = React.forwardRef(
  (
    {
      id,
      label,
      description,
      checked,
      disabled = false,
      className = '',
      onChange,
      ...props
    },
    ref
  ) => {
    return (
      <label
        htmlFor={id}
        className={cn(
          'inline-flex items-start gap-2.5 cursor-pointer select-none group',
          disabled && 'cursor-not-allowed opacity-60',
          className
        )}
      >
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              'w-4 h-4 rounded-sm border transition-colors duration-150 flex items-center justify-center',
              'border-line-strong bg-surface',
              'peer-checked:bg-primary peer-checked:border-primary',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-1',
              'group-hover:border-primary'
            )}
          >
            <Check
              className={cn(
                'w-3 h-3 text-surface stroke-[2.5] transition-opacity duration-150',
                checked ? 'opacity-100' : 'opacity-0'
              )}
            />
          </div>
        </div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && <span className="text-sm font-medium text-ink">{label}</span>}
            {description && <span className="text-xs text-ink-muted">{description}</span>}
          </div>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
export default Checkbox;
