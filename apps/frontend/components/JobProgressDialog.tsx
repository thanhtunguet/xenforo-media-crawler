import React from 'react';
import { CheckCircle, Loader2, X, XCircle } from 'lucide-react';
import { useJobProgress } from '../hooks/useJobProgress';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { ButtonSize, ButtonVariant } from '../lib/enums';

interface JobProgressDialogProps {
  jobId: number | null;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export function JobProgressDialog({
  jobId,
  isOpen,
  onClose,
  title = 'Job Progress',
}: JobProgressDialogProps) {
  const { progress, connected } = useJobProgress({
    jobId: jobId || null,
    onComplete: () => {
      // Auto-close after 2 seconds on completion
      setTimeout(() => {
        onClose();
      }, 2000);
    },
  });

  if (!isOpen || !jobId) {
    return null;
  }

  const getStatusIcon = () => {
    if (!progress) {
      return <Loader2 className="w-5 h-5 animate-spin text-blue-400" />;
    }

    switch (progress.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'running':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-400" />;
      default:
        return <Loader2 className="w-5 h-5 animate-spin text-gray-400" />;
    }
  };

  const getStatusText = () => {
    if (!progress) {
      return 'Connecting...';
    }

    switch (progress.status) {
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'running':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-white">
                  {getStatusText()}
                </span>
                <span className="text-sm text-gray-400">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {progress && (
                <div className="mt-2">
                  <Progress value={progress.progress} className="h-2" />
                  <div className="flex items-center justify-between mt-1 text-xs text-gray-400">
                    <span>{progress.progress}%</span>
                    {progress.totalItems &&
                      progress.processedItems !== undefined && (
                        <span>
                          {progress.processedItems} / {progress.totalItems}
                        </span>
                      )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {progress?.currentStep && (
            <div className="text-sm text-gray-300 bg-gray-800/50 rounded p-3">
              {progress.currentStep}
            </div>
          )}

          {progress?.errorMessage && (
            <div className="text-sm text-red-400 bg-red-900/20 rounded p-3 border border-red-800">
              {progress.errorMessage}
            </div>
          )}

          {progress?.metadata && Object.keys(progress.metadata).length > 0 && (
            <div className="text-xs text-gray-400 space-y-1">
              {Object.entries(progress.metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <span className="text-white">{String(value)}</span>
                </div>
              ))}
            </div>
          )}

          {(progress?.status === 'completed' ||
            progress?.status === 'failed') && (
            <div className="flex justify-end">
              <Button
                onClick={onClose}
                variant={ButtonVariant.OUTLINE}
                size={ButtonSize.SM}
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
