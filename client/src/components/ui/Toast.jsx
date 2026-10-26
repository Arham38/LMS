import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '../../utils/cn';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ title, message, type = 'info', duration = 4000 }) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast = { id, title, message, type };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const toast = {
    show: addToast,
    success: (message, title) => addToast({ type: 'success', message, title }),
    error: (message, title) => addToast({ type: 'error', message, title }),
    info: (message, title) => addToast({ type: 'info', message, title }),
    warning: (message, title) => addToast({ type: 'warning', message, title }),
    dismiss: removeToast,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastContainer = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
};

const ToastItem = ({ toast, onDismiss }) => {
  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const styles = {
    success: 'border-success/30 bg-surface text-ink',
    error: 'border-danger/30 bg-surface text-ink',
    warning: 'border-warning/30 bg-surface text-ink',
    info: 'border-info/30 bg-surface text-ink',
  };

  const iconColors = {
    success: 'text-success',
    error: 'text-danger',
    warning: 'text-warning',
    info: 'text-info',
  };

  const Icon = icons[toast.type] || Info;

  return (
    <div
      role="alert"
      className={cn(
        'pointer-events-auto flex items-start gap-3 p-3.5 bg-surface border rounded-lg shadow-popover transition-all duration-200 transform translate-y-0',
        styles[toast.type]
      )}
    >
      <div className={cn('shrink-0 mt-0.5', iconColors[toast.type])}>
        <Icon className="w-4 h-4 stroke-[1.5]" />
      </div>

      <div className="flex-1 min-w-0">
        {toast.title && (
          <h4 className="text-xs font-semibold text-ink mb-0.5">{toast.title}</h4>
        )}
        <p className="text-xs text-ink-muted leading-relaxed break-words">
          {toast.message}
        </p>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="shrink-0 text-ink-muted hover:text-ink transition-colors p-0.5 rounded"
      >
        <X className="w-3.5 h-3.5 stroke-[1.5]" />
      </button>
    </div>
  );
};

export default {
  ToastProvider,
  useToast,
};
