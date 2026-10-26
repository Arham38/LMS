import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import IconButton from './IconButton';

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-[560px]',
  className = '',
}) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Prevent background scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus modal
    modalRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-desc' : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-none transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className={cn(
          'w-full bg-surface border border-line rounded-lg shadow-popover overflow-hidden flex flex-col',
          'transform translate-y-0 transition-transform duration-200 focus:outline-none',
          maxWidth,
          className
        )}
      >
        {(title || description || onClose) && (
          <div className="px-5 py-4 border-b border-line flex items-start justify-between gap-4">
            <div>
              {title && (
                <h2 id="modal-title" className="font-display font-semibold text-lg text-ink">
                  {title}
                </h2>
              )}
              {description && (
                <p id="modal-desc" className="text-xs text-ink-muted mt-1 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            {onClose && (
              <IconButton
                icon={X}
                variant="ghost"
                size="sm"
                aria-label="Close modal"
                onClick={onClose}
              />
            )}
          </div>
        )}

        <div className="p-5 overflow-y-auto max-h-[calc(100vh-160px)]">{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
