import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  GlassCardFooter,
} from '@/components/ui/glass-card';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Layout } from '@/components/layout';
import { threadsApi, crawlerApi, Post, Thread, mediaApi, Media } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import {
  RefreshCw,
  Download,
  Image as ImageIcon,
  FileText,
  ArrowLeft,
  Album,
  MessageSquare,
} from 'lucide-react';

export default function ThreadPage() {
  const router = useRouter();
  const { id } = router.query;
  const threadId = id ? Number(id) : null;
  const { addToast } = useToast();

  const [thread, setThread] = useState<Thread | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [mediaType, setMediaType] = useState('0');
  const [mediaCount, setMediaCount] = useState(0);

  useEffect(() => {
    if (threadId) {
      loadThread();
      loadPosts();
      loadMediaCount();
    }
  }, [threadId, page]);

  const loadThread = async () => {
    if (!threadId) return;
    try {
      setLoading(true);
      const threadData = await threadsApi.getById(threadId);
      setThread(threadData);
    } catch (err) {
      console.error('Failed to load thread:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    if (!threadId) return;
    try {
      setPostsLoading(true);
      const response = await threadsApi.getPosts(threadId, page, 10);
      setPosts(response.items);
      setTotalPages(response.meta.totalPages);
      setTotalPosts(response.meta.totalItems);
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setPostsLoading(false);
    }
  };

  const loadMediaCount = async () => {
    if (!threadId) return;
    try {
      const media = await mediaApi.getThreadMedia(threadId);
      setMediaCount(media.length);
    } catch (err) {
      console.error('Failed to load media count:', err);
    }
  };

  const handleSyncPosts = async () => {
    if (!threadId) {
      addToast('Thread ID is required', 'error');
      return;
    }
    try {
      setSyncing(true);
      await crawlerApi.syncThreadPosts(threadId);
      addToast('Post sync started. This may take a while.', 'success');
      setTimeout(() => {
        loadPosts();
        loadMediaCount();
      }, 2000);
    } catch (err: any) {
      console.error('Failed to sync posts:', err);
      addToast(err.message || 'Failed to sync posts', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleDownloadMedia = async () => {
    if (!threadId) {
      addToast('Thread ID is required', 'error');
      return;
    }
    try {
      setDownloading(true);
      await crawlerApi.downloadThreadMedia(
        threadId,
        Number(mediaType)
      );
      addToast('Media download started. This may take a while.', 'success');
    } catch (err: any) {
      console.error('Failed to download media:', err);
      addToast(err.message || 'Failed to download media', 'error');
    } finally {
      setDownloading(false);
    }
  };

  if (!threadId) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-white/60">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="glass"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Thread Info Card */}
        {loading ? (
          <GlassCard>
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
              <span className="ml-2 text-white/60">Loading thread...</span>
            </div>
          </GlassCard>
        ) : thread ? (
          <>
            <GlassCard variant="hover-glow">
              <GlassCardHeader>
                <GlassCardTitle className="gradient-text text-3xl">
                  {thread.title}
                </GlassCardTitle>
                <GlassCardDescription>
                  Created: {new Date(thread.createdAt).toLocaleString()} • Updated:{' '}
                  {new Date(thread.updatedAt).toLocaleString()}
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                <div
                  className="prose prose-invert max-w-none text-white/80"
                  dangerouslySetInnerHTML={{ __html: thread.content }}
                />
              </GlassCardContent>
            </GlassCard>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassCard variant="bordered" className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{totalPosts}</div>
                    <div className="text-sm text-white/60">Total Posts</div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard variant="bordered" className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{mediaCount}</div>
                    <div className="text-sm text-white/60">Media Items</div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </>
        ) : (
          <GlassCard>
            <div className="text-center py-12 text-white/60">Thread not found</div>
          </GlassCard>
        )}

        {/* Actions Card */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Thread Actions</GlassCardTitle>
            <GlassCardDescription>
              Sync posts and download media from this thread
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button
                variant="glass-primary"
                onClick={handleSyncPosts}
                disabled={syncing}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing Posts...' : 'Sync Posts'}
              </Button>

              <Link href={`/threads/${threadId}/album`}>
                <Button variant="glass" className="gap-2">
                  <Album className="h-4 w-4" />
                  View Album
                </Button>
              </Link>

              <div className="flex items-end gap-2 ml-auto">
                <div className="space-y-2">
                  <Label htmlFor="media-type" className="text-white/80 text-xs">
                    Media Type
                  </Label>
                  <Select
                    id="media-type"
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value)}
                    className="glass-input"
                  >
                    <option value="0">All</option>
                    <option value="1">Images</option>
                    <option value="2">Videos</option>
                    <option value="3">Links</option>
                  </Select>
                </div>
                <Button
                  variant="glass"
                  onClick={handleDownloadMedia}
                  disabled={downloading}
                  className="gap-2"
                >
                  <Download className={`h-4 w-4 ${downloading ? 'animate-spin' : ''}`} />
                  {downloading ? 'Downloading...' : 'Download Media'}
                </Button>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Posts Section */}
        <GlassCard>
          <GlassCardHeader>
            <div className="flex items-center justify-between">
              <div>
                <GlassCardTitle>Posts</GlassCardTitle>
                <GlassCardDescription>
                  {totalPosts} post{totalPosts !== 1 ? 's' : ''} in this thread
                </GlassCardDescription>
              </div>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            {postsLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
                <span className="ml-2 text-white/60">Loading posts...</span>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/60">No posts found</p>
                <p className="text-white/40 text-sm mt-1">
                  Try syncing posts from a site
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post, index) => (
                  <div
                    key={post.id}
                    className="glass-card p-4 hover:shadow-glow transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-sm">
                          {(page - 1) * 10 + index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="prose prose-invert prose-sm max-w-none text-white/80"
                          dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                        <div className="mt-3 text-xs text-white/40">
                          Posted: {new Date(post.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-white/60">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>
    </Layout>
  );
}
