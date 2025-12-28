import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/layout';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { jobsApi, Job } from '@/lib/api';
import { useJobProgress } from '@/hooks/useJobProgress';
import { useToast } from '@/contexts/ToastContext';
import { JobStatus } from '@xenforo-media-crawler/contracts';
import { ToastType, BadgeVariant, ButtonVariant } from '@/lib/enums';
import {
  Play,
  Pause,
  RotateCw,
  X,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

type JobStatusFilter = JobStatus | 'all';

const STATUS_OPTIONS: { value: JobStatusFilter; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: JobStatus.PENDING, label: 'Pending' },
  { value: JobStatus.RUNNING, label: 'Running' },
  { value: JobStatus.PAUSED, label: 'Paused' },
  { value: JobStatus.COMPLETED, label: 'Completed' },
  { value: JobStatus.FAILED, label: 'Failed' },
  { value: JobStatus.CANCELLED, label: 'Cancelled' },
];

function JobItem({ job, onUpdate }: { job: Job; onUpdate: () => void }) {
  const { addToast } = useToast();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Subscribe to real-time updates for running/paused jobs
  const { progress: realtimeProgress } = useJobProgress({
    jobId: job.status === JobStatus.RUNNING || job.status === JobStatus.PAUSED ? job.id : null,
    onProgress: (data) => {
      // Update will be handled by parent refresh
      onUpdate();
    },
  });

  // Use real-time progress if available, otherwise use job progress
  const displayProgress = realtimeProgress?.progress ?? job.progress;
  const displayStatus = realtimeProgress?.status ?? job.status;
  const displayStep = realtimeProgress?.currentStep ?? job.currentStep;
  const displayProcessed = realtimeProgress?.processedItems ?? job.processedItems;
  const displayTotal = realtimeProgress?.totalItems ?? job.totalItems;

  const handleAction = async (action: 'start' | 'pause' | 'resume' | 'cancel', actionName: string) => {
    try {
      setActionLoading(action);
      switch (action) {
        case 'start':
          await jobsApi.start(job.id);
          break;
        case 'pause':
          await jobsApi.pause(job.id);
          break;
        case 'resume':
          await jobsApi.resume(job.id);
          break;
        case 'cancel':
          await jobsApi.cancel(job.id);
          break;
      }
      addToast(`Job ${actionName} successfully`, ToastType.SUCCESS);
      onUpdate();
    } catch (err: any) {
      addToast(err.message || `Failed to ${actionName} job`, ToastType.ERROR);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = () => {
    switch (displayStatus) {
      case JobStatus.COMPLETED:
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case JobStatus.FAILED:
        return <XCircle className="w-4 h-4 text-red-400" />;
      case JobStatus.RUNNING:
        return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
      case JobStatus.PAUSED:
        return <Pause className="w-4 h-4 text-yellow-400" />;
      case JobStatus.CANCELLED:
        return <X className="w-4 h-4 text-gray-400" />;
      case JobStatus.PENDING:
        return <Clock className="w-4 h-4 text-gray-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = () => {
    switch (displayStatus) {
      case JobStatus.COMPLETED:
        return <Badge variant={BadgeVariant.SUCCESS}>Completed</Badge>;
      case JobStatus.FAILED:
        return <Badge variant={BadgeVariant.ERROR}>Failed</Badge>;
      case JobStatus.RUNNING:
        return <Badge variant={BadgeVariant.INFO}>Running</Badge>;
      case JobStatus.PAUSED:
        return <Badge variant={BadgeVariant.WARNING}>Paused</Badge>;
      case JobStatus.CANCELLED:
        return <Badge>Cancelled</Badge>;
      case JobStatus.PENDING:
        return <Badge>Pending</Badge>;
      default:
        return <Badge>{displayStatus}</Badge>;
    }
  };

  const formatJobType = (jobType: string) => {
    return jobType
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {getStatusIcon()}
            {getStatusBadge()}
            <span className="text-sm text-white/60">{formatJobType(job.jobType)}</span>
          </div>

          {job.entityName && (
            <p className="text-white/90 font-medium mb-1 truncate">{job.entityName}</p>
          )}

          {displayStep && (
            <p className="text-sm text-white/70 mb-2">{displayStep}</p>
          )}

          {(displayStatus === JobStatus.RUNNING || displayStatus === JobStatus.PAUSED) && (
            <div className="space-y-2 mb-2">
              <Progress
                value={displayProgress}
                status={displayStatus === JobStatus.RUNNING ? 'syncing' : 'syncing'}
              />
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>
                  {displayProcessed} / {displayTotal || '?'} items
                </span>
                <span>{displayProgress}%</span>
              </div>
            </div>
          )}

          {displayStatus === JobStatus.COMPLETED && displayTotal && (
            <p className="text-sm text-white/60">
              Completed: {displayProcessed} / {displayTotal} items
            </p>
          )}

          {job.errorMessage && (
            <p className="text-sm text-destructive mt-2">{job.errorMessage}</p>
          )}

          <div className="flex items-center gap-4 mt-2 text-xs text-white/50">
            <span>Created: {formatDate(job.createdAt)}</span>
            {job.completedAt && <span>Completed: {formatDate(job.completedAt)}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {displayStatus === JobStatus.PENDING && (
            <Button
              variant="glass-primary"
              size="sm"
              onClick={() => handleAction('start', 'started')}
              disabled={actionLoading !== null}
            >
              {actionLoading === 'start' ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Start
            </Button>
          )}

          {displayStatus === JobStatus.RUNNING && (
            <>
              <Button
                variant={ButtonVariant.GLASS}
                size="sm"
                onClick={() => handleAction('pause', 'paused')}
                disabled={actionLoading !== null}
              >
                {actionLoading === 'pause' ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Pause className="w-4 h-4 mr-2" />
                )}
                Pause
              </Button>
              <Button
                variant="glass-danger"
                size="sm"
                onClick={() => handleAction('cancel', 'cancelled')}
                disabled={actionLoading !== null}
              >
                {actionLoading === 'cancel' ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <X className="w-4 h-4 mr-2" />
                )}
                Cancel
              </Button>
            </>
          )}

          {displayStatus === JobStatus.PAUSED && (
            <>
              <Button
                variant="glass-primary"
                size="sm"
                onClick={() => handleAction('resume', 'resumed')}
                disabled={actionLoading !== null}
              >
                {actionLoading === 'resume' ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <RotateCw className="w-4 h-4 mr-2" />
                )}
                Resume
              </Button>
              <Button
                variant="glass-danger"
                size="sm"
                onClick={() => handleAction('cancel', 'cancelled')}
                disabled={actionLoading !== null}
              >
                {actionLoading === 'cancel' ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <X className="w-4 h-4 mr-2" />
                )}
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function JobsPage() {
  const { addToast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<JobStatusFilter>('all');

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const jobsList = await jobsApi.getAll(100, status);
      setJobs(jobsList);
    } catch (err) {
      console.error('Failed to load jobs:', err);
      addToast('Failed to load jobs', ToastType.ERROR);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, addToast]);

  useEffect(() => {
    loadJobs();
    // Refresh every 5 seconds for non-real-time updates
    const interval = setInterval(loadJobs, 5000);
    return () => clearInterval(interval);
  }, [loadJobs]);

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value as JobStatusFilter);
  };

  return (
    <Layout title="Jobs">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Job Management</h1>
            <p className="text-white/60 mt-1">
              View and manage all sync jobs with real-time progress updates
            </p>
          </div>
          <Button
            onClick={loadJobs}
            disabled={loading}
            variant={ButtonVariant.GLASS}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <GlassCard>
          <GlassCardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Label htmlFor="status-filter" className="text-white/90">
                Filter by Status:
              </Label>
              <Select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="glass-input min-w-[200px]"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Jobs List */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>
              Jobs ({jobs.length})
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {loading && jobs.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-white/60" />
                <span className="ml-3 text-white/60">Loading jobs...</span>
              </div>
            ) : jobs.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Clock className="w-12 h-12 text-white/40 mx-auto mb-4" />
                  <p className="text-white/60">No jobs found</p>
                  <p className="text-sm text-white/40 mt-2">
                    {statusFilter !== 'all' ? `No jobs with status "${statusFilter}"` : 'No jobs available'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <JobItem key={job.id} job={job} onUpdate={loadJobs} />
                ))}
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>
    </Layout>
  );
}

