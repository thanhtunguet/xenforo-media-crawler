import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Layout } from '@/components/layout';
import { sitesApi, siteSyncApi, Forum } from '@/lib/api';
import Link from 'next/link';

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

  if (!siteId) {
    return (
      <Layout>
        <div>Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="outline" onClick={() => router.push('/')}>
              ← Back to Sites
            </Button>
            <h2 className="text-3xl font-bold mt-4">Forums</h2>
          </div>
          <Button onClick={() => loadForums()}>Refresh</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Site Forums</CardTitle>
            <CardDescription>
              Manage forums and sync threads from this site
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Original ID</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forums.map((forum) => (
                      <TableRow key={forum.id || forum.originalId}>
                        <TableCell>{forum.id || '-'}</TableCell>
                        <TableCell>{forum.name || '-'}</TableCell>
                        <TableCell>{forum.originalId || '-'}</TableCell>
                        <TableCell>
                          {forum.originalUrl ? (
                            <a
                              href={forum.originalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {forum.originalUrl}
                            </a>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {forum.createdAt
                            ? new Date(forum.createdAt).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSyncThreads(forum.id || Number(forum.originalId))}
                              disabled={syncing === (forum.id || Number(forum.originalId))}
                            >
                              {syncing === (forum.id || Number(forum.originalId))
                                ? 'Syncing...'
                                : 'Sync Threads'}
                            </Button>
                            {forum.id && (
                              <Link href={`/forums/${forum.id}/threads`}>
                                <Button size="sm" variant="outline">
                                  View Threads
                                </Button>
                              </Link>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span>
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

