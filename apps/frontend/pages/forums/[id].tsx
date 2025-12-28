import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { GlassTable, GlassTableHeader, GlassTableBody, GlassTableRow, GlassTableHead, GlassTableCell } from '@/components/ui/glass-table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { threadsApi, Thread } from '@/lib/api';
import { ButtonVariant, BadgeVariant } from '@/lib/enums';
import { usePagination, buildPaginatedPath } from '@/lib/pagination';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Eye, Download, Image as ImageIcon, Search } from 'lucide-react';

export default function ForumThreadsPage() {
  const router = useRouter();
  const { id } = router.query;
  const forumId = id ? Number(id) : null;
  const { page, goToPage } = usePagination();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (forumId) {
      loadThreads();
    }
  }, [forumId, page]);

  const loadThreads = async () => {
    if (!forumId) return;
    try {
      setLoading(true);
      const response = await threadsApi.getAll(page, 10, forumId);
      setThreads(response.items);
      setTotalPages(response.meta.totalPages);
    } catch (err) {
      console.error('Failed to load threads:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredThreads = threads.filter((thread) =>
    thread.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!forumId) {
    return (
      <Layout>
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-white/40" />
          <p className="text-white/60 mt-4">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Threads">
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant={ButtonVariant.GLASS} onClick={() => router.push('/forums')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Forums
        </Button>

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
                  {filteredThreads.length} thread{filteredThreads.length !== 1 ? 's' : ''} found
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
                <p className="text-white/60">
                  {searchQuery ? 'No threads match your search' : 'No threads found'}
                </p>
                <p className="text-white/40 text-sm mt-2">
                  {searchQuery ? 'Try a different search term' : 'Sync forums to get threads'}
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
                      <GlassTableHead>Created</GlassTableHead>
                      <GlassTableHead>Updated</GlassTableHead>
                      <GlassTableHead className="text-right">Actions</GlassTableHead>
                    </GlassTableRow>
                  </GlassTableHeader>
                  <GlassTableBody>
                    {filteredThreads.map((thread) => (
                      <GlassTableRow key={thread.id}>
                        <GlassTableCell className="font-medium text-white/90">
                          #{thread.id}
                        </GlassTableCell>
                        <GlassTableCell>
                          <div className="max-w-md">
                            <p className="text-white/90 line-clamp-2">{thread.title}</p>
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
                          {new Date(thread.createdAt).toLocaleDateString()}
                        </GlassTableCell>
                        <GlassTableCell>
                          {new Date(thread.updatedAt).toLocaleDateString()}
                        </GlassTableCell>
                        <GlassTableCell>
                          <div className="flex gap-2 justify-end">
                            <Link href={`/threads/${thread.id}`}>
                              <Button size="sm" variant={ButtonVariant.GLASS}>
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </Link>
                            <Link href={`/threads/${thread.id}/album`}>
                              <Button size="sm" variant={ButtonVariant.GLASS}>
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
                <div className="flex items-center justify-between mt-6">
                  <Button
                    variant={ButtonVariant.GLASS}
                    onClick={() => goToPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-white/60 text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant={ButtonVariant.GLASS}
                    onClick={() => goToPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>
    </Layout>
  );
}

