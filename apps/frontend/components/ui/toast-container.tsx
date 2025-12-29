import React, { useState } from 'react';
import { Toast, useToast } from '../../contexts/ToastContext';
import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react';

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({
  toast,
  onRemove,
}) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300);
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getColorClass = () => {
    switch (toast.type) {
      case 'success':
        return 'border-green-400/30';
      case 'error':
        return 'border-red-400/30';
      case 'warning':
        return 'border-yellow-400/30';
      case 'info':
      default:
        return 'border-blue-400/30';
    }
  };

  return (
    <div
      className={`
        glass-card p-4 rounded-lg border ${getColorClass()}
        flex items-start gap-3 min-w-[320px] max-w-md
        shadow-lg backdrop-blur-xl
        transition-all duration-300 ease-in-out
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
    >
      {getIcon()}
      <div className="flex-1 text-white/90 text-sm">{toast.message}</div>
      <button
        onClick={handleRemove}
        className="text-white/60 hover:text-white/90 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={removeToast} />
        </div>
      ))}
    </div>
  );
};
