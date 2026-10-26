import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import Input from './Input';

export const PasswordInput = React.forwardRef(
  ({ hasError, className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="relative w-full">
        <Input
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          hasError={hasError}
          leftIcon={Lock}
          className={`pr-10 ${className}`}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink p-1 rounded focus:outline-none"
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4 stroke-[1.5]" />
          ) : (
            <Eye className="w-4 h-4 stroke-[1.5]" />
          )}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
export default PasswordInput;
