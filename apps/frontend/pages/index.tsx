import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout';
import { StatCard } from '@/components/StatCard';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Server, Folder, MessageSquare, Image, Plus, RefreshCw, Clock, Edit, Trash2, RotateCw, Download, ArrowRight } from 'lucide-react';
import { sitesApi, threadsApi, mediaApi, eventLogsApi, EventLog } from '@/lib/api';
import { ButtonVariant, ButtonSize } from '@/lib/enums';
import { useRouter } from 'next/router';
import Link from 'next/link';

// Helper function to format time ago
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
  sites_sync: RotateCw,
  forum_created: Plus,
  forum_updated: Edit,
  forum_deleted: Trash2,
  thread_sync: RotateCw,
  post_sync: RotateCw,
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

  return (
    <div className="flex items-start gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
      <div className={`p-2 rounded-lg ${colorClass} border flex-shrink-0`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge className={colorClass}>{label}</Badge>
          <span className="text-xs text-white/40">{formatTimeAgo(eventLog.createdAt)}</span>
        </div>
        <p className="text-sm text-white/90 truncate">{eventLog.description || eventLog.eventType}</p>
        {eventLog.entityName && (
          <p className="text-xs text-white/60 mt-1 truncate">
            {eventLog.entityType}: {eventLog.entityName}
          </p>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    sites: 0,
    forums: 0,
    threads: 0,
    media: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<EventLog[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  useEffect(() => {
    loadStats();
    loadActivities();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      // Fetch stats from API
      const [sitesCount, forumsCount, threadsCount, mediaCount] = await Promise.all([
        sitesApi.getAll(1, 1).then((res) => res.meta.totalItems),
        sitesApi.getForumCount().then((res) => res.count),
        threadsApi.getAll(1, 1).then((res) => res.meta.totalItems),
        mediaApi.getCount().then((res) => res.count),
      ]);

      setStats({
        sites: sitesCount,
        forums: forumsCount,
        threads: threadsCount,
        media: mediaCount,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    try {
      setActivitiesLoading(true);
      const response = await eventLogsApi.getAll(1, 10);
      setActivities(response.items);
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setActivitiesLoading(false);
    }
  };

  return (
    <Layout title="Dashboard">
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="text-center space-y-2 py-8">
          <h1 className="text-5xl font-bold gradient-text">
            Welcome to XenForo Media Crawler
          </h1>
          <p className="text-white/60 text-lg">
            Manage your XenForo sites, forums, and media in one place
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Sites"
            value={stats.sites}
            icon={Server}
            href="/sites"
            loading={loading}
          />
          <StatCard
            title="Total Forums"
            value={stats.forums}
            icon={Folder}
            loading={loading}
          />
          <StatCard
            title="Total Threads"
            value={stats.threads}
            icon={MessageSquare}
            loading={loading}
          />
          <StatCard
            title="Total Media"
            value={stats.media}
            icon={Image}
            loading={loading}
          />
        </div>

        {/* Quick Actions */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="text-xl">Quick Actions</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                variant={ButtonVariant.GLASS_PRIMARY}
                size={ButtonSize.LG}
                className="w-full justify-start"
                onClick={() => router.push('/sites')}
              >
                <Plus className="w-5 h-5 mr-2" />
                Add New Site
              </Button>
              <Button
                variant={ButtonVariant.GLASS}
                size={ButtonSize.LG}
                className="w-full justify-start"
                onClick={() => router.push('/sites')}
              >
                <Server className="w-5 h-5 mr-2" />
                Manage Sites
              </Button>
              <Button
                variant={ButtonVariant.GLASS}
                size={ButtonSize.LG}
                className="w-full justify-start"
                onClick={loadStats}
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Refresh Stats
              </Button>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Recent Activities */}
        <GlassCard>
          <GlassCardHeader>
            <div className="flex items-center justify-between">
              <GlassCardTitle className="text-xl">Recent Activities</GlassCardTitle>
              <Link href="/activity">
                <Button
                  variant={ButtonVariant.GLASS}
                  size={ButtonSize.SM}
                  className="flex items-center gap-2"
                >
                  View all
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            {activitiesLoading ? (
              <div className="text-center py-8 text-white/50">
                <p>Loading activities...</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8 text-white/50">
                <p>No recent activities to display</p>
                <p className="text-sm mt-2">Start by adding a site or syncing forums</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activities.map((eventLog) => (
                  <ActivityItem key={eventLog.id} eventLog={eventLog} />
                ))}
              </div>
            )}
          </GlassCardContent>
        </GlassCard>

        {/* Getting Started */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="text-xl">Getting Started</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                  1
                </div>
                <div>
                  <h4 className="text-white font-medium">Add a Site</h4>
                  <p className="text-white/60 text-sm">
                    Navigate to Sites and add your XenForo forum URL
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                  2
                </div>
                <div>
                  <h4 className="text-white font-medium">Sync Forums</h4>
                  <p className="text-white/60 text-sm">
                    Synchronize forums from your XenForo site
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                  3
                </div>
                <div>
                  <h4 className="text-white font-medium">Download Media</h4>
                  <p className="text-white/60 text-sm">
                    Browse threads and download media files to your local storage
                  </p>
                </div>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    </Layout>
  );
}
