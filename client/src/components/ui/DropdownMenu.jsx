import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';

export const DropdownMenu = ({
  trigger,
  items = [],
  align = 'right',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggle = () => setIsOpen((prev) => !prev);

  const alignments = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  };

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <div onClick={toggle} className="cursor-pointer inline-flex items-center">
        {trigger}
      </div>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className={cn(
            'absolute z-40 mt-1 min-w-[180px] bg-surface border border-line rounded-md shadow-popover py-1 focus:outline-none transition-all duration-150',
            alignments[align] || alignments.right,
            className
          )}
        >
          {items.map((item, idx) => {
            if (item.divider) {
              return <div key={`divider-${idx}`} className="my-1 border-t border-line" />;
            }

            const Icon = item.icon;
            const isDanger = item.variant === 'danger';

            return (
              <button
                key={item.id || idx}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setIsOpen(false);
                  item.onClick?.();
                }}
                className={cn(
                  'w-full px-3 py-2 text-xs flex items-center gap-2 text-left transition-colors select-none',
                  isDanger
                    ? 'text-danger hover:bg-danger-soft'
                    : 'text-ink hover:bg-surface-alt',
                  item.disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
                )}
              >
                {Icon && <Icon className="w-3.5 h-3.5 shrink-0 stroke-[1.5]" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
