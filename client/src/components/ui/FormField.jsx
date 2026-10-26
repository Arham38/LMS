import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export const FormField = ({
  id,
  label,
  required = false,
  helperText,
  error,
  className = '',
  children,
}) => {
  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-semibold uppercase tracking-wider text-ink select-none flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-danger ml-1" aria-hidden="true">*</span>}
          </span>
        </label>
      )}

      {children}

      {error ? (
        <p id={id ? `${id}-error` : undefined} className="text-xs text-danger flex items-center gap-1.5 mt-0.5" role="alert">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 stroke-[1.5]" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p id={id ? `${id}-helper` : undefined} className="text-xs text-ink-muted mt-0.5">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};

export default FormField;
