import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { GlassTable, GlassTableHeader, GlassTableBody, GlassTableRow, GlassTableHead, GlassTableCell } from '@/components/ui/glass-table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { threadsApi, crawlerApi, Thread } from '@/lib/api';
import { usePagination, buildPaginatedPath } from '@/lib/pagination';
import Link from 'next/link';
import { RefreshCw, Eye, Image as ImageIcon, Search, MessageSquare, Clock, RotateCw } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { ToastType, GlassCardVariant, ButtonVariant, BadgeVariant } from '@/lib/enums';

export default function ThreadsPage() {
  const { addToast } = useToast();
  const { page, goToPage } = usePagination();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [syncingThreadId, setSyncingThreadId] = useState<number | null>(null);

  useEffect(() => {
    loadThreads();
  }, [page]);

  const loadThreads = async () => {
    try {
      setLoading(true);
      const response = await threadsApi.getAll(page, 20);
      setThreads(response.items);
      setTotalPages(response.meta.totalPages);
      setTotalItems(response.meta.totalItems);
    } catch (err) {
      console.error('Failed to load threads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncPosts = async (threadId: number) => {
    try {
      setSyncingThreadId(threadId);
      await crawlerApi.syncThreadPosts(threadId);
      addToast('Post sync started. This may take a while.', ToastType.SUCCESS);
    } catch (err: any) {
      console.error('Failed to sync posts:', err);
      addToast(err.message || 'Failed to sync posts', ToastType.ERROR);
    } finally {
      setSyncingThreadId(null);
    }
  };

  const filteredThreads = threads.filter((thread) =>
    thread.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout title="Threads">
      <div className="space-y-6 animate-fade-in">
        {/* Header Card */}
        <GlassCard variant={GlassCardVariant.BORDERED}>
          <GlassCardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <GlassCardTitle className="gradient-text text-2xl">All Threads</GlassCardTitle>
                  <p className="text-white/60 text-sm mt-1">
                    {totalItems} total thread{totalItems !== 1 ? 's' : ''} • Ordered by newest first
                  </p>
                </div>
              </div>
            </div>
          </GlassCardHeader>
        </GlassCard>

        {/* Search */}
        <GlassCard>
          <GlassCardContent>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  placeholder="Search threads by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="glass-input pl-10"
                />
              </div>
              <Button variant={ButtonVariant.GLASS} onClick={loadThreads} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Threads Table */}
        <GlassCard>
          <GlassCardHeader>
            <div className="flex items-center justify-between">
              <div>
                <GlassCardTitle className="text-lg">Threads</GlassCardTitle>
                <p className="text-white/60 text-sm mt-1">
                  {searchQuery
                    ? `${filteredThreads.length} thread${filteredThreads.length !== 1 ? 's' : ''} match your search`
                    : `Showing ${threads.length} of ${totalItems} threads`}
                </p>
              </div>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-white/40" />
                <p className="text-white/60 mt-4">Loading threads...</p>
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 mx-auto text-white/20 mb-4" />
                <p className="text-white/60 text-lg">
                  {searchQuery ? 'No threads match your search' : 'No threads found'}
                </p>
                <p className="text-white/40 text-sm mt-2">
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Sync forums to get threads'}
                </p>
              </div>
            ) : (
              <>
                <GlassTable>
                  <GlassTableHeader>
                    <GlassTableRow>
                      <GlassTableHead>ID</GlassTableHead>
                      <GlassTableHead>Title</GlassTableHead>
                      <GlassTableHead>Original ID</GlassTableHead>
                      <GlassTableHead>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Created
                        </div>
                      </GlassTableHead>
                      <GlassTableHead>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Updated
                        </div>
                      </GlassTableHead>
                      <GlassTableHead className="text-right">Actions</GlassTableHead>
                    </GlassTableRow>
                  </GlassTableHeader>
                  <GlassTableBody>
                    {filteredThreads.map((thread) => (
                      <GlassTableRow key={thread.id} className="hover:bg-white/5 transition-colors">
                        <GlassTableCell className="font-medium text-white/90">
                          #{thread.id}
                        </GlassTableCell>
                        <GlassTableCell>
                          <div className="max-w-md">
                            <p className="text-white/90 line-clamp-2 font-medium">{thread.title || 'Untitled Thread'}</p>
                            {thread.content && (
                              <p className="text-white/50 text-xs mt-1 line-clamp-1">
                                {thread.content}
                              </p>
                            )}
                          </div>
                        </GlassTableCell>
                        <GlassTableCell>
                          {thread.originalId ? (
                            <Badge variant={BadgeVariant.INFO}>#{thread.originalId}</Badge>
                          ) : (
                            <span className="text-white/40">-</span>
                          )}
                        </GlassTableCell>
                        <GlassTableCell>
                          <div className="text-white/70">
                            {new Date(thread.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-white/40 text-xs">
                            {new Date(thread.createdAt).toLocaleTimeString()}
                          </div>
                        </GlassTableCell>
                        <GlassTableCell>
                          <div className="text-white/70">
                            {new Date(thread.updatedAt).toLocaleDateString()}
                          </div>
                          <div className="text-white/40 text-xs">
                            {new Date(thread.updatedAt).toLocaleTimeString()}
                          </div>
                        </GlassTableCell>
                        <GlassTableCell>
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant={ButtonVariant.GLASS}
                              onClick={() => handleSyncPosts(thread.id)}
                              disabled={syncingThreadId === thread.id}
                              className="hover:shadow-glow"
                            >
                              <RotateCw className={`w-4 h-4 mr-1 ${syncingThreadId === thread.id ? 'animate-spin' : ''}`} />
                              Sync Posts
                            </Button>
                            <Link href={`/threads/${thread.id}`}>
                              <Button size="sm" variant={ButtonVariant.GLASS} className="hover:shadow-glow">
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </Link>
                            <Link href={`/threads/${thread.id}/album`}>
                              <Button size="sm" variant={ButtonVariant.GLASS} className="hover:shadow-glow">
                                <ImageIcon className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        </GlassTableCell>
                      </GlassTableRow>
                    ))}
                  </GlassTableBody>
                </GlassTable>

                {/* Pagination */}
                {!searchQuery && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                    <Button
                      variant={ButtonVariant.GLASS}
                      onClick={() => goToPage(Math.max(1, page - 1))}
                      disabled={page === 1 || loading}
                    >
                      Previous
                    </Button>
                    <span className="text-white/60 text-sm">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant={ButtonVariant.GLASS}
                      onClick={() => goToPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages || loading}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>
    </Layout>
  );
}

