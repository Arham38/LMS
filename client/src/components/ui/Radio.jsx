import React from 'react';
import { cn } from '../../utils/cn';

export const Radio = React.forwardRef(
  (
    {
      id,
      name,
      value,
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
            name={name}
            value={value}
            type="radio"
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              'w-4 h-4 rounded-full border transition-colors duration-150 flex items-center justify-center',
              'border-line-strong bg-surface',
              'peer-checked:border-primary',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-1',
              'group-hover:border-primary'
            )}
          >
            <div
              className={cn(
                'w-2 h-2 rounded-full bg-primary transition-transform duration-150',
                checked ? 'scale-100' : 'scale-0'
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

Radio.displayName = 'Radio';
export default Radio;
