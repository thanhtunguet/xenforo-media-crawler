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
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Layout } from '@/components/layout';
import { threadsApi, crawlerApi, Post, Thread } from '@/lib/api';
import { sitesApi, Site } from '@/lib/api';

export default function ThreadPage() {
  const router = useRouter();
  const { id } = router.query;
  const threadId = id ? Number(id) : null;

  const [thread, setThread] = useState<Thread | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [syncing, setSyncing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [mediaType, setMediaType] = useState('0');

  useEffect(() => {
    if (threadId) {
      loadThread();
      loadPosts();
      loadSites();
    }
  }, [threadId, page]);

  const loadSites = async () => {
    try {
      const response = await sitesApi.getAll(1, 100);
      setSites(response.items);
    } catch (err) {
      console.error('Failed to load sites:', err);
    }
  };

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
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleSyncPosts = async () => {
    if (!threadId || !selectedSiteId) {
      alert('Please select a site');
      return;
    }
    try {
      setSyncing(true);
      await crawlerApi.syncThreadPosts(Number(selectedSiteId), threadId);
      alert('Post sync started. This may take a while.');
      setTimeout(() => {
        loadPosts();
      }, 2000);
    } catch (err: any) {
      console.error('Failed to sync posts:', err);
      alert(err.message || 'Failed to sync posts');
    } finally {
      setSyncing(false);
    }
  };

  const handleDownloadMedia = async () => {
    if (!threadId || !selectedSiteId) {
      alert('Please select a site');
      return;
    }
    try {
      setDownloading(true);
      await crawlerApi.downloadThreadMedia(
        Number(selectedSiteId),
        threadId,
        Number(mediaType)
      );
      alert('Media download started. This may take a while.');
    } catch (err: any) {
      console.error('Failed to download media:', err);
      alert(err.message || 'Failed to download media');
    } finally {
      setDownloading(false);
    }
  };

  if (!threadId) {
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
            <h2 className="text-3xl font-bold mt-4">Thread Details</h2>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading thread...</div>
        ) : thread ? (
          <Card>
            <CardHeader>
              <CardTitle>{thread.title}</CardTitle>
              <CardDescription>
                Created: {new Date(thread.createdAt).toLocaleString()} | Updated:{' '}
                {new Date(thread.updatedAt).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: thread.content }}
              />
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Thread Actions</CardTitle>
            <CardDescription>
              Sync posts and download media from this thread
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="site-select">Select Site</Label>
              <Select
                id="site-select"
                value={selectedSiteId}
                onChange={(e) =>
                  setSelectedSiteId(e.target.value ? Number(e.target.value) : '')
                }
              >
                <option value="">Select a site</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name || site.url}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSyncPosts}
                disabled={syncing || !selectedSiteId}
              >
                {syncing ? 'Syncing Posts...' : 'Sync Posts'}
              </Button>
              <div className="flex-1" />
              <div className="space-y-2">
                <Label htmlFor="media-type">Media Type</Label>
                <Select
                  id="media-type"
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value)}
                >
                  <option value="0">All</option>
                  <option value="1">Images</option>
                  <option value="2">Videos</option>
                  <option value="3">Links</option>
                </Select>
              </div>
              <Button
                variant="outline"
                onClick={handleDownloadMedia}
                disabled={downloading || !selectedSiteId}
              >
                {downloading ? 'Downloading...' : 'Download Media'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Posts</CardTitle>
            <CardDescription>Posts in this thread</CardDescription>
          </CardHeader>
          <CardContent>
            {postsLoading ? (
              <div className="text-center py-8">Loading posts...</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell>{post.id}</TableCell>
                        <TableCell>
                          <div
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(post.createdAt).toLocaleString()}
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

