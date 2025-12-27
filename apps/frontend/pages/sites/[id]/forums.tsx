import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { GlassTable, GlassTableHeader, GlassTableBody, GlassTableRow, GlassTableHead, GlassTableCell } from '@/components/ui/glass-table';
import { Badge } from '@/components/ui/badge';
import { sitesApi, siteSyncApi, Forum } from '@/lib/api';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, MessageSquare, ExternalLink } from 'lucide-react';

export default function ForumsPage() {
  const router = useRouter();
  const { id } = router.query;
  const siteId = id ? Number(id) : null;

  const [forums, setForums] = useState<Forum[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [syncing, setSyncing] = useState<number | null>(null);

  useEffect(() => {
    if (siteId) {
      loadForums();
    }
  }, [siteId, page]);

  const loadForums = async () => {
    if (!siteId) return;
    try {
      setLoading(true);
      const response = await sitesApi.getForums(siteId, page, 10);
      setForums(response.items);
      setTotalPages(response.meta.totalPages);
    } catch (err) {
      console.error('Failed to load forums:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncThreads = async (forumId: number) => {
    if (!siteId) return;
    try {
      setSyncing(forumId);
      await siteSyncApi.syncForumThreads(siteId, forumId);
      alert('Thread sync started. This may take a while.');
    } catch (err) {
      console.error('Failed to sync threads:', err);
      alert('Failed to sync threads');
    } finally {
      setSyncing(null);
    }
  };

  const handleSyncAllForums = async () => {
    if (!siteId) return;
    try {
      setLoading(true);
      await siteSyncApi.syncForums(siteId);
      loadForums();
    } catch (err) {
      console.error('Failed to sync all forums:', err);
      alert('Failed to sync forums');
    } finally {
      setLoading(false);
    }
  };

  if (!siteId) {
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
    <Layout title="Forums">
      <div className="space-y-6">
        {/* Back Button & Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="glass"
            onClick={() => router.push('/sites')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sites
          </Button>
          <Button
            variant="glass-primary"
            onClick={handleSyncAllForums}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Sync All Forums
          </Button>
        </div>

        {/* Forums Table */}
        <GlassCard>
          <GlassCardHeader>
            <div className="flex items-center justify-between">
              <div>
                <GlassCardTitle className="text-lg">Forums</GlassCardTitle>
                <p className="text-white/60 text-sm mt-1">
                  Manage forums and sync threads from this site
                </p>
              </div>
              <Button
                variant="glass"
                size="sm"
                onClick={loadForums}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-white/40" />
                <p className="text-white/60 mt-4">Loading forums...</p>
              </div>
            ) : forums.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/60">No forums found</p>
                <p className="text-white/40 text-sm mt-2">
                  Click "Sync All Forums" to fetch forums from the site
                </p>
              </div>
            ) : (
              <>
                <GlassTable>
                  <GlassTableHeader>
                    <GlassTableRow>
                      <GlassTableHead>ID</GlassTableHead>
                      <GlassTableHead>Name</GlassTableHead>
                      <GlassTableHead>Original ID</GlassTableHead>
                      <GlassTableHead>URL</GlassTableHead>
                      <GlassTableHead>Created</GlassTableHead>
                      <GlassTableHead className="text-right">Actions</GlassTableHead>
                    </GlassTableRow>
                  </GlassTableHeader>
                  <GlassTableBody>
                    {forums.map((forum) => (
                      <GlassTableRow key={forum.id || `temp-${forum.originalId}`}>
                        <GlassTableCell className="font-medium text-white/90">
                          #{forum.id || '-'}
                        </GlassTableCell>
                        <GlassTableCell>
                          {forum.name || <span className="text-white/40">-</span>}
                        </GlassTableCell>
                        <GlassTableCell>
                          <Badge variant="info">#{forum.originalId || '-'}</Badge>
                        </GlassTableCell>
                        <GlassTableCell>
                          {forum.originalUrl ? (
                            <a
                              href={forum.originalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
                            >
                              View
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-white/40">-</span>
                          )}
                        </GlassTableCell>
                        <GlassTableCell>
                          {forum.createdAt
                            ? new Date(forum.createdAt).toLocaleDateString()
                            : '-'}
                        </GlassTableCell>
                        <GlassTableCell>
                          <div className="flex gap-2 justify-end">
                            {forum.id ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="glass"
                                  onClick={() => handleSyncThreads(forum.id!)}
                                  disabled={syncing === forum.id}
                                >
                                  {syncing === forum.id ? (
                                    <>
                                      <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                                      Syncing...
                                    </>
                                  ) : (
                                    <>
                                      <RefreshCw className="w-4 h-4 mr-1" />
                                      Sync
                                    </>
                                  )}
                                </Button>
                                <Link href={`/forums/${forum.id}/threads`}>
                                  <Button size="sm" variant="glass-primary">
                                    <MessageSquare className="w-4 h-4 mr-1" />
                                    Threads
                                  </Button>
                                </Link>
                              </>
                            ) : (
                              <span className="text-white/40 text-sm">Not saved</span>
                            )}
                          </div>
                        </GlassTableCell>
                      </GlassTableRow>
                    ))}
                  </GlassTableBody>
                </GlassTable>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6">
                  <Button
                    variant="glass"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-white/60 text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="glass"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
