import React from 'react';
import { cn } from '../../utils/cn';
import Spinner from './Spinner';

export const IconButton = React.forwardRef(
  (
    {
      icon: Icon,
      variant = 'ghost',
      size = 'md',
      isLoading = false,
      disabled = false,
      'aria-label': ariaLabel,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    if (!ariaLabel) {
      console.warn('IconButton requires an aria-label for accessibility.');
    }

    const baseStyles =
      'inline-flex items-center justify-center rounded transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none relative';

    const variants = {
      primary: 'bg-primary text-surface hover:bg-primary-hover active:bg-[#081B14] border border-primary',
      secondary: 'bg-surface text-ink border border-line hover:bg-surface-alt active:bg-line',
      ghost: 'bg-transparent text-ink-muted hover:text-ink hover:bg-surface-alt border border-transparent',
      danger: 'bg-danger text-surface hover:bg-[#9B1E14] border border-danger',
    };

    const sizes = {
      sm: 'w-9 h-9',
      md: 'w-10 h-10',
      lg: 'w-11 h-11',
    };

    const iconSizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-5 h-5',
    };

    return (
      <button
        ref={ref}
        type={type}
        aria-label={ariaLabel}
        title={ariaLabel}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Spinner size="sm" />
        ) : (
          Icon && <Icon className={cn(iconSizes[size], 'stroke-[1.5]')} />
        )}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
export default IconButton;
