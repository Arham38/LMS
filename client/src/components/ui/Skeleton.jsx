import React from 'react';
import { cn } from '../../utils/cn';

export const Skeleton = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  ...props
}) => {
  const variants = {
    text: 'h-4 rounded',
    rectangular: 'rounded',
    circular: 'rounded-full',
  };

  return (
    <div
      aria-hidden="true"
      style={{ width, height }}
      className={cn(
        'bg-surface-alt animate-pulse',
        variants[variant] || variants.rectangular,
        className
      )}
      {...props}
    />
  );
};

export default Skeleton;
