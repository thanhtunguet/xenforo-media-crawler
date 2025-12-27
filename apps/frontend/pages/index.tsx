import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Layout } from '@/components/layout';
import { sitesApi, siteSyncApi, Site, Forum, threadsApi } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function SitesPage() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [formData, setFormData] = useState({ name: '', url: '' });
  const [forums, setForums] = useState<Forum[]>([]);
  const [forumsDialogOpen, setForumsDialogOpen] = useState(false);
  const [syncing, setSyncing] = useState<number | null>(null);
  const [searchOriginalId, setSearchOriginalId] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    loadSites();
  }, [page]);

  const loadSites = async () => {
    try {
      setLoading(true);
      const response = await sitesApi.getAll(page, 10);
      setSites(response.items);
      setTotalPages(response.meta.totalPages);
    } catch (err) {
      console.error('Failed to load sites:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await sitesApi.create(formData);
      setCreateDialogOpen(false);
      setFormData({ name: '', url: '' });
      loadSites();
    } catch (err) {
      console.error('Failed to create site:', err);
      alert('Failed to create site');
    }
  };

  const handleUpdate = async () => {
    if (!selectedSite) return;
    try {
      await sitesApi.update(selectedSite.id, formData);
      setEditDialogOpen(false);
      setSelectedSite(null);
      setFormData({ name: '', url: '' });
      loadSites();
    } catch (err) {
      console.error('Failed to update site:', err);
      alert('Failed to update site');
    }
  };

  const handleDelete = async () => {
    if (!selectedSite) return;
    try {
      await sitesApi.delete(selectedSite.id);
      setDeleteDialogOpen(false);
      setSelectedSite(null);
      loadSites();
    } catch (err) {
      console.error('Failed to delete site:', err);
      alert('Failed to delete site');
    }
  };

  const handleSyncForums = async (siteId: number) => {
    try {
      setSyncing(siteId);
      const syncedForums = await siteSyncApi.syncForums(siteId);
      setForums(syncedForums);
      setForumsDialogOpen(true);
      loadSites();
    } catch (err) {
      console.error('Failed to sync forums:', err);
      alert('Failed to sync forums');
    } finally {
      setSyncing(null);
    }
  };

  const openEditDialog = (site: Site) => {
    setSelectedSite(site);
    setFormData({ name: site.name || '', url: site.url });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (site: Site) => {
    setSelectedSite(site);
    setDeleteDialogOpen(true);
  };

  const handleSearchThread = async () => {
    if (!searchOriginalId.trim()) {
      setSearchError('Please enter an original thread ID');
      return;
    }

    setSearching(true);
    setSearchError('');

    try {
      const thread = await threadsApi.searchByOriginalId(searchOriginalId.trim());
      // Navigate to the thread page
      router.push(`/threads/${thread.id}`);
    } catch (err: any) {
      setSearchError(err.message || 'Thread not found');
    } finally {
      setSearching(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Sites Management</h2>
          <Button onClick={() => setCreateDialogOpen(true)}>Create Site</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search Thread by Original ID</CardTitle>
            <CardDescription>
              Search for a thread using its original ID from the XenForo site
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter original thread ID (e.g., 12345)"
                value={searchOriginalId}
                onChange={(e) => {
                  setSearchOriginalId(e.target.value);
                  setSearchError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchThread();
                  }
                }}
                className="flex-1"
              />
              <Button onClick={handleSearchThread} disabled={searching}>
                {searching ? 'Searching...' : 'Search'}
              </Button>
            </div>
            {searchError && (
              <div className="mt-2 p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {searchError}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sites</CardTitle>
            <CardDescription>Manage your XenForo sites</CardDescription>
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
                      <TableHead>URL</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sites.map((site) => (
                      <TableRow key={site.id}>
                        <TableCell>{site.id}</TableCell>
                        <TableCell>{site.name || '-'}</TableCell>
                        <TableCell>
                          <a
                            href={site.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {site.url}
                          </a>
                        </TableCell>
                        <TableCell>
                          {site.createdAt
                            ? new Date(site.createdAt).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSyncForums(site.id)}
                              disabled={syncing === site.id}
                            >
                              {syncing === site.id ? 'Syncing...' : 'Sync Forums'}
                            </Button>
                            <Link href={`/sites/${site.id}/forums`}>
                              <Button size="sm" variant="outline">
                                View Forums
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(site)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openDeleteDialog(site)}
                            >
                              Delete
                            </Button>
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

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Site</DialogTitle>
            <DialogDescription>
              Add a new XenForo site to manage
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Site name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                placeholder="https://example.com"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Site</DialogTitle>
            <DialogDescription>Update site information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name (optional)</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Site name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-url">URL</Label>
              <Input
                id="edit-url"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                placeholder="https://example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Site</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this site? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Forums Sync Result Dialog */}
      <Dialog open={forumsDialogOpen} onOpenChange={setForumsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Synced Forums</DialogTitle>
            <DialogDescription>
              Successfully synced {forums.length} forums
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Original ID</TableHead>
                  <TableHead>URL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forums.map((forum, idx) => (
                  <TableRow key={forum.id || idx}>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button onClick={() => setForumsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
