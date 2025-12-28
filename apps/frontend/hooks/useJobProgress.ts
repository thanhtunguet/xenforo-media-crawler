import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { JobStatus } from '@xenforo-media-crawler/contracts';

export interface JobProgress {
  jobId: number;
  status: JobStatus;
  progress: number;
  totalItems?: number;
  processedItems?: number;
  currentStep?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

interface UseJobProgressOptions {
  jobId: number | null;
  onProgress?: (progress: JobProgress) => void;
  onComplete?: (progress: JobProgress) => void;
  onError?: (error: string) => void;
}

export function useJobProgress({
  jobId,
  onProgress,
  onComplete,
  onError,
}: UseJobProgressOptions) {
  const [progress, setProgress] = useState<JobProgress | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!jobId) {
      return;
    }

    // Get backend URL from environment or use default
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    
    // Connect to WebSocket
    const socket = io(`${backendUrl}/jobs`, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      // Subscribe to job updates
      socket.emit('subscribe', jobId);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('progress', (data: JobProgress) => {
      setProgress(data);
      onProgress?.(data);

      if (data.status === JobStatus.COMPLETED) {
        onComplete?.(data);
      } else if (data.status === JobStatus.FAILED) {
        onError?.(data.errorMessage || 'Job failed');
      }
    });

    socket.on('job:update', (data: JobProgress) => {
      setProgress(data);
      onProgress?.(data);

      if (data.status === JobStatus.COMPLETED) {
        onComplete?.(data);
      } else if (data.status === JobStatus.FAILED) {
        onError?.(data.errorMessage || 'Job failed');
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('unsubscribe', jobId);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [jobId, onProgress, onComplete, onError]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnected(false);
    }
  }, []);

  return {
    progress,
    connected,
    disconnect,
  };
}

