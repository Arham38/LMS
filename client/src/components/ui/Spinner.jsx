import React from 'react';
import { cn } from '../../utils/cn';

export const Spinner = ({ size = 'md', className = '', ...props }) => {
  const sizeMap = {
    xs: 'w-3.5 h-3.5 border-2',
    sm: 'w-4 h-4 border-2',
    md: 'w-5 h-5 border-2',
    lg: 'w-7 h-7 border-[2.5px]',
  };

  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block animate-spin rounded-full border-current border-t-transparent',
        sizeMap[size] || sizeMap.md,
        className
      )}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </span>
  );
};

export default Spinner;
