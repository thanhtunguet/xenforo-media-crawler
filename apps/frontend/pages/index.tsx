import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout';
import { StatCard } from '@/components/StatCard';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Server, Folder, MessageSquare, Image, Plus, RefreshCw } from 'lucide-react';
import { sitesApi, threadsApi, mediaApi } from '@/lib/api';
import { useRouter } from 'next/router';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    sites: 0,
    forums: 0,
    threads: 0,
    media: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      // Fetch stats from API
      const [sitesCount, threadsCount, mediaCount] = await Promise.all([
        sitesApi.getAll(1, 1).then((res) => res.meta.totalItems),
        threadsApi.getAll(1, 1).then((res) => res.meta.totalItems),
        mediaApi.getCount().then((res) => res.count),
      ]);

      setStats({
        sites: sitesCount,
        forums: 0, // Will be implemented later
        threads: threadsCount,
        media: mediaCount,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
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
                variant="glass-primary"
                size="lg"
                className="w-full justify-start"
                onClick={() => router.push('/sites')}
              >
                <Plus className="w-5 h-5 mr-2" />
                Add New Site
              </Button>
              <Button
                variant="glass"
                size="lg"
                className="w-full justify-start"
                onClick={() => router.push('/sites')}
              >
                <Server className="w-5 h-5 mr-2" />
                Manage Sites
              </Button>
              <Button
                variant="glass"
                size="lg"
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
            <GlassCardTitle className="text-xl">Recent Activities</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-center py-8 text-white/50">
              <p>No recent activities to display</p>
              <p className="text-sm mt-2">Start by adding a site or syncing forums</p>
            </div>
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
