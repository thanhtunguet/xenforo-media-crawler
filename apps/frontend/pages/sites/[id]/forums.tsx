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
import { Forum, sitesApi, siteSyncApi } from '@/lib/api';
import { JobProgressDialog } from '@/components/JobProgressDialog';
import Link from 'next/link';
import {
  ArrowLeft,
  ExternalLink,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import {
  BadgeVariant,
  ButtonSize,
  ButtonVariant,
  ToastType,
} from '@/lib/enums';

export default function ForumsPage() {
  const router = useRouter();
  const { id } = router.query;
  const siteId = id ? Number(id) : null;
  const { addToast } = useToast();

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

  const [syncJobId, setSyncJobId] = useState<number | null>(null);
  const [showSyncProgress, setShowSyncProgress] = useState(false);
  const [syncAllJobId, setSyncAllJobId] = useState<number | null>(null);
  const [showSyncAllProgress, setShowSyncAllProgress] = useState(false);

  const handleSyncThreads = async (forumId: number) => {
    if (!siteId) return;
    try {
      setSyncing(forumId);
      const response = await siteSyncApi.syncForumThreads(siteId, forumId);
      setSyncJobId(response.jobId);
      setShowSyncProgress(true);
      addToast(
        'Thread sync started. This may take a while.',
        ToastType.SUCCESS,
      );
    } catch (err) {
      console.error('Failed to sync threads:', err);
      addToast('Failed to sync threads', ToastType.ERROR);
    } finally {
      setSyncing(null);
    }
  };

  const handleSyncAllForums = async () => {
    if (!siteId) return;
    try {
      setLoading(true);
      const response = await siteSyncApi.syncAllForumsAndThreads(siteId);
      setSyncAllJobId(response.jobId);
      setShowSyncAllProgress(true);
      addToast('Sync started. This may take a while.', ToastType.SUCCESS);
    } catch (err) {
      console.error('Failed to sync all forums:', err);
      addToast('Failed to sync forums', ToastType.ERROR);
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
            variant={ButtonVariant.GLASS}
            onClick={() => router.push('/sites')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sites
          </Button>
          <Button
            variant={ButtonVariant.GLASS_PRIMARY}
            onClick={handleSyncAllForums}
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
            />
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
                variant={ButtonVariant.GLASS}
                size={ButtonSize.SM}
                onClick={loadForums}
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
                />
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
                      <GlassTableHead className="text-right">
                        Actions
                      </GlassTableHead>
                    </GlassTableRow>
                  </GlassTableHeader>
                  <GlassTableBody>
                    {forums.map((forum) => (
                      <GlassTableRow
                        key={forum.id || `temp-${forum.originalId}`}
                      >
                        <GlassTableCell className="font-medium text-white/90">
                          #{forum.id || '-'}
                        </GlassTableCell>
                        <GlassTableCell>
                          {forum.name || (
                            <span className="text-white/40">-</span>
                          )}
                        </GlassTableCell>
                        <GlassTableCell>
                          <Badge variant={BadgeVariant.INFO}>
                            #{forum.originalId || '-'}
                          </Badge>
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
                                  size={ButtonSize.SM}
                                  variant={ButtonVariant.GLASS}
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
                                <Link href={`/forums/${forum.id}`}>
                                  <Button
                                    size={ButtonSize.SM}
                                    variant={ButtonVariant.GLASS_PRIMARY}
                                  >
                                    <MessageSquare className="w-4 h-4 mr-1" />
                                    Threads
                                  </Button>
                                </Link>
                              </>
                            ) : (
                              <span className="text-white/40 text-sm">
                                Not saved
                              </span>
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
              </>
            )}
          </GlassCardContent>
        </GlassCard>

        <JobProgressDialog
          jobId={syncJobId}
          isOpen={showSyncProgress}
          onClose={() => {
            setShowSyncProgress(false);
            setSyncJobId(null);
            loadForums();
          }}
          title="Syncing Forum Threads"
        />

        <JobProgressDialog
          jobId={syncAllJobId}
          isOpen={showSyncAllProgress}
          onClose={() => {
            setShowSyncAllProgress(false);
            setSyncAllJobId(null);
            loadForums();
          }}
          title="Syncing All Forums and Threads"
        />
      </div>
    </Layout>
  );
}
