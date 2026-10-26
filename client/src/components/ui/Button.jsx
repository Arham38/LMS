import React from 'react';
import { cn } from '../../utils/cn';
import Spinner from './Spinner';

export const Button = React.forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      type = 'button',
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none relative';

    const variants = {
      primary: 'bg-primary text-surface hover:bg-primary-hover active:bg-[#081B14] border border-primary',
      secondary: 'bg-surface text-ink border border-line hover:bg-surface-alt active:bg-line',
      ghost: 'bg-transparent text-ink hover:bg-surface-alt border border-transparent',
      danger: 'bg-danger text-surface hover:bg-[#9B1E14] active:bg-[#83180F] border border-danger',
      'danger-outline': 'bg-surface text-danger border border-danger/30 hover:bg-danger-soft',
    };

    const sizes = {
      sm: 'h-9 px-3 text-xs gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-11 px-5 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center bg-inherit rounded">
            <Spinner size={size === 'lg' ? 'md' : 'sm'} />
          </span>
        )}
        <span className={cn('inline-flex items-center gap-2', isLoading && 'opacity-0')}>
          {LeftIcon && <LeftIcon className="w-4 h-4 shrink-0 stroke-[1.5]" />}
          <span>{children}</span>
          {RightIcon && <RightIcon className="w-4 h-4 shrink-0 stroke-[1.5]" />}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
