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
import { threadsApi, Thread } from '@/lib/api';
import Link from 'next/link';

export default function ForumThreadsPage() {
  const router = useRouter();
  const { id } = router.query;
  const forumId = id ? Number(id) : null;

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (forumId) {
      loadThreads();
    }
  }, [forumId, page]);

  const loadThreads = async () => {
    if (!forumId) return;
    try {
      setLoading(true);
      const response = await threadsApi.getAll(page, 10);
      // Filter threads by forum if needed - this depends on your API structure
      setThreads(response.items);
      setTotalPages(response.meta.totalPages);
    } catch (err) {
      console.error('Failed to load threads:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!forumId) {
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
            <Button variant="outline" onClick={() => router.back()}>
              ← Back
            </Button>
            <h2 className="text-3xl font-bold mt-4">Threads</h2>
          </div>
          <Button onClick={() => loadThreads()}>Refresh</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Forum Threads</CardTitle>
            <CardDescription>
              View and manage threads from this forum
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
                      <TableHead>Title</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {threads.map((thread) => (
                      <TableRow key={thread.id}>
                        <TableCell>{thread.id}</TableCell>
                        <TableCell>
                          <div className="max-w-md truncate">{thread.title}</div>
                        </TableCell>
                        <TableCell>
                          {new Date(thread.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(thread.updatedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Link href={`/threads/${thread.id}`}>
                            <Button size="sm" variant="outline">
                              View Posts
                            </Button>
                          </Link>
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

