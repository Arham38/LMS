import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={isLoading ? undefined : onClose} maxWidth="max-w-[440px]">
      <div className="flex items-start gap-3.5">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
            isDestructive
              ? 'bg-danger-soft border-danger/20 text-danger'
              : 'bg-warning-soft border-warning/20 text-warning'
          }`}
          aria-hidden="true"
        >
          <AlertTriangle className="w-4 h-4 stroke-[1.5]" />
        </div>

        <div className="flex-1">
          <h3 className="font-display font-semibold text-base text-ink mb-1.5">{title}</h3>
          <p className="text-sm text-ink-muted leading-relaxed">{message}</p>

          <div className="mt-6 flex items-center justify-end gap-2.5">
            <Button
              variant="secondary"
              size="md"
              disabled={isLoading}
              onClick={onClose}
            >
              {cancelText}
            </Button>
            <Button
              variant={isDestructive ? 'danger' : 'primary'}
              size="md"
              isLoading={isLoading}
              onClick={onConfirm}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
