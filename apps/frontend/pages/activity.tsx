import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { eventLogsApi, EventLog } from '@/lib/api';
import { 
  Server, 
  Folder, 
  MessageSquare, 
  Image, 
  RefreshCw, 
  Download,
  Plus,
  Edit,
  Trash2,
  Sync,
  Clock
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
// Simple time formatter (replacing date-fns dependency)
const formatTimeAgo = (dateString: string | null): string => {
  if (!dateString) return 'Unknown time';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  } catch {
    return dateString;
  }
};

const EVENT_TYPE_ICONS: Record<string, React.ElementType> = {
  site_created: Plus,
  site_updated: Edit,
  site_deleted: Trash2,
  sites_sync: Sync,
  forum_created: Plus,
  forum_updated: Edit,
  forum_deleted: Trash2,
  thread_sync: Sync,
  post_sync: Sync,
  media_download: Download,
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  site_created: 'bg-green-500/20 text-green-400 border-green-500/30',
  site_updated: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  site_deleted: 'bg-red-500/20 text-red-400 border-red-500/30',
  sites_sync: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  forum_created: 'bg-green-500/20 text-green-400 border-green-500/30',
  forum_updated: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  forum_deleted: 'bg-red-500/20 text-red-400 border-red-500/30',
  thread_sync: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  post_sync: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  media_download: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  site_created: 'Site Created',
  site_updated: 'Site Updated',
  site_deleted: 'Site Deleted',
  sites_sync: 'Sites Sync',
  forum_created: 'Forum Created',
  forum_updated: 'Forum Updated',
  forum_deleted: 'Forum Deleted',
  thread_sync: 'Thread Sync',
  post_sync: 'Post Sync',
  media_download: 'Media Download',
};

function ActivityItem({ eventLog }: { eventLog: EventLog }) {
  const Icon = EVENT_TYPE_ICONS[eventLog.eventType] || Clock;
  const colorClass = EVENT_TYPE_COLORS[eventLog.eventType] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  const label = EVENT_TYPE_LABELS[eventLog.eventType] || eventLog.eventType;

  const formatTime = (dateString: string | null) => {
    return formatTimeAgo(dateString);
  };

  const renderMetadata = () => {
    if (!eventLog.metadata) return null;

    if (eventLog.eventType === 'media_download' && eventLog.metadata.stats) {
      const stats = eventLog.metadata.stats;
      return (
        <div className="mt-2 text-xs text-white/60 space-y-1">
          <div className="flex gap-4">
            <span>Total: {stats.total}</span>
            <span className="text-green-400">Downloaded: {stats.downloaded}</span>
            <span className="text-red-400">Failed: {stats.failed}</span>
            <span className="text-yellow-400">Skipped: {stats.skipped}</span>
          </div>
        </div>
      );
    }

    if (eventLog.eventType === 'post_sync' && eventLog.metadata.postCount) {
      return (
        <div className="mt-2 text-xs text-white/60">
          <span>Posts synced: {eventLog.metadata.postCount}</span>
        </div>
      );
    }

    if (eventLog.metadata.changes) {
      return (
        <div className="mt-2 text-xs text-white/60">
          <span>Changes: {Object.keys(eventLog.metadata.changes).join(', ')}</span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
      <div className={`p-2 rounded-lg ${colorClass} border`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge className={colorClass}>{label}</Badge>
          <span className="text-xs text-white/40">{formatTime(eventLog.createdAt)}</span>
        </div>
        <p className="text-sm text-white/90">{eventLog.description || eventLog.eventType}</p>
        {eventLog.entityName && (
          <p className="text-xs text-white/60 mt-1">
            {eventLog.entityType}: {eventLog.entityName}
          </p>
        )}
        {renderMetadata()}
      </div>
    </div>
  );
}

export default function ActivityPage() {
  const { addToast } = useToast();
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadActivity();
  }, [page]);

  const loadActivity = async (reset: boolean = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;
      const response = await eventLogsApi.getAll(currentPage, 50);

      if (reset) {
        setEventLogs(response.items);
      } else {
        setEventLogs((prev) => [...prev, ...response.items]);
      }

      setTotalPages(response.meta.totalPages);
      setHasMore(currentPage < response.meta.totalPages);
      if (reset) {
        setPage(1);
      }
    } catch (err) {
      console.error('Failed to load activity:', err);
      addToast('Failed to load activity', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage((prev) => prev + 1);
    }
  };

  const handleRefresh = () => {
    loadActivity(true);
  };

  return (
    <Layout title="Recent Activity">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Recent Activity</h1>
            <p className="text-white/60 mt-1">
              View all recent events and actions in the system
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={loading}
            className="glass-card border-white/10"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Activity List */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Activity Timeline</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {loading && eventLogs.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-white/60">Loading activity...</div>
              </div>
            ) : eventLogs.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Clock className="w-12 h-12 text-white/40 mx-auto mb-4" />
                  <p className="text-white/60">No activity found</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {eventLogs.map((eventLog) => (
                  <ActivityItem key={eventLog.id} eventLog={eventLog} />
                ))}
              </div>
            )}

            {/* Load More Button */}
            {hasMore && (
              <div className="mt-6 text-center">
                <Button
                  onClick={handleLoadMore}
                  disabled={loading}
                  variant="outline"
                  className="glass-card border-white/10"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>
    </Layout>
  );
}

