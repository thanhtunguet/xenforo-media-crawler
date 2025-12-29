import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from '@/components/ui/glass-card';
import {
  GlassTable,
  GlassTableBody,
  GlassTableCell,
  GlassTableHead,
  GlassTableHeader,
  GlassTableRow,
} from '@/components/ui/glass-table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Thread, threadsApi } from '@/lib/api';
import { BadgeVariant, ButtonSize, ButtonVariant } from '@/lib/enums';
import { parseQuery } from '@/lib/query-parser';
import Link from 'next/link';
import {
  ArrowLeft,
  Eye,
  Image as ImageIcon,
  RefreshCw,
  Search,
} from 'lucide-react';

export default function ForumThreadsPage() {
  const router = useRouter();
  const { id } = router.query;
  const forumId = id ? Number(id) : null;

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (forumId) {
      loadThreads();
    }
  }, [forumId, page]);

  // Reload when search query changes, but only if it's a structured query
  useEffect(() => {
    if (forumId) {
      const parsedQuery = parseQuery(searchQuery);
      if (parsedQuery.isStructured || !searchQuery) {
        loadThreads();
      }
    }
  }, [searchQuery]);

  const loadThreads = async () => {
    if (!forumId) return;
    try {
      setLoading(true);
      const parsedQuery = parseQuery(searchQuery);
      
      // Use forumId from route, but allow override from query
      const effectiveForumId = parsedQuery.forumId ?? forumId;
      
      // If it's a structured query with originalId, use server-side filtering
      if (parsedQuery.isStructured && parsedQuery.originalId) {
        const response = await threadsApi.getAll(
          page,
          10,
          effectiveForumId,
          parsedQuery.originalId,
        );
        setThreads(response.items);
        setTotalPages(response.meta.totalPages);
      } else {
        // For simple queries, load with forumId filter
        const response = await threadsApi.getAll(page, 10, effectiveForumId);
        setThreads(response.items);
        setTotalPages(response.meta.totalPages);
      }
    } catch (err) {
      console.error('Failed to load threads:', err);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering for simple text searches
  const parsedQuery = parseQuery(searchQuery);
  const filteredThreads = parsedQuery.isStructured && parsedQuery.originalId
    ? threads // Server-side filtering already applied
    : threads.filter((thread) => {
        if (!searchQuery) return true;
        const queryLower = searchQuery.toLowerCase();
        return (
          thread.title?.toLowerCase().includes(queryLower) ||
          thread.originalId?.toLowerCase().includes(queryLower)
        );
      });

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
        <Button variant={ButtonVariant.GLASS} onClick={() => router.back()}>
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
                  placeholder="Search by title, or use: originalId = xyz"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      loadThreads();
                    }
                  }}
                  className="glass-input pl-10"
                />
              </div>
              <Button
                variant={ButtonVariant.GLASS}
                onClick={loadThreads}
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
                />
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
                  {filteredThreads.length} thread
                  {filteredThreads.length !== 1 ? 's' : ''} found
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
                  {searchQuery
                    ? 'No threads match your search'
                    : 'No threads found'}
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
                      <GlassTableHead>Created</GlassTableHead>
                      <GlassTableHead>Last sync</GlassTableHead>
                      <GlassTableHead className="text-right">
                        Actions
                      </GlassTableHead>
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
                            <p className="text-white/90 line-clamp-2">
                              {thread.title}
                            </p>
                          </div>
                        </GlassTableCell>
                        <GlassTableCell>
                          {thread.originalId ? (
                            <Badge variant={BadgeVariant.INFO}>
                              #{thread.originalId}
                            </Badge>
                          ) : (
                            <span className="text-white/40">-</span>
                          )}
                        </GlassTableCell>
                        <GlassTableCell>
                          {new Date(thread.createdAt).toLocaleDateString()}
                        </GlassTableCell>
                        <GlassTableCell>
                          {thread.lastSyncAt ? (
                            new Date(thread.lastSyncAt).toLocaleDateString()
                          ) : (
                            <span className="text-white/40">Never</span>
                          )}
                        </GlassTableCell>
                        <GlassTableCell>
                          <div className="flex gap-2 justify-end">
                            <Link href={`/threads/${thread.id}`}>
                              <Button
                                size={ButtonSize.SM}
                                variant={ButtonVariant.GLASS}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </Link>
                            <Link href={`/threads/${thread.id}/album`}>
                              <Button
                                size={ButtonSize.SM}
                                variant={ButtonVariant.GLASS}
                              >
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
                {(!searchQuery || !parsedQuery.isStructured || !parsedQuery.originalId) && (
                <div className="flex items-center justify-between mt-6">
                  <Button
                    variant={ButtonVariant.GLASS}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-white/60 text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant={ButtonVariant.GLASS}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
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
