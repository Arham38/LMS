import React, { useState } from 'react';
import { cn } from '../../utils/cn';

export const Avatar = ({
  src,
  alt = '',
  name = '',
  size = 'md',
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  const getInitials = (str) => {
    if (!str) return '?';
    const parts = str.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-xs',
    lg: 'w-11 h-11 text-sm',
    xl: 'w-14 h-14 text-base',
  };

  const showImage = src && !imageError;

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 border border-line select-none font-medium',
        sizes[size] || sizes.md,
        showImage ? 'bg-surface-alt' : 'bg-primary-soft text-primary',
        className
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt || name}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{getInitials(name || alt)}</span>
      )}
    </div>
  );
};

export default Avatar;
