import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { GlassTable, GlassTableHeader, GlassTableBody, GlassTableRow, GlassTableHead, GlassTableCell } from '@/components/ui/glass-table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { sitesApi, siteSyncApi, Site, Forum, threadsApi } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Plus, RefreshCw, Edit, Trash2, Folder, Search, ExternalLink, CheckCircle } from 'lucide-react';

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
      router.push(`/threads/${thread.id}`);
    } catch (err: any) {
      setSearchError(err.message || 'Thread not found');
    } finally {
      setSearching(false);
    }
  };

  return (
    <Layout title="Sites Management">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 mt-1">Manage your XenForo sites and synchronize forums</p>
          </div>
          <Button
            variant="glass-primary"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Site
          </Button>
        </div>

        {/* Thread Search */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="text-lg">Quick Thread Search</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
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
                className="flex-1 glass-input"
              />
              <Button
                variant="glass-primary"
                onClick={handleSearchThread}
                disabled={searching}
              >
                <Search className="w-4 h-4 mr-2" />
                {searching ? 'Searching...' : 'Search'}
              </Button>
            </div>
            {searchError && (
              <div className="mt-2 p-3 text-sm text-rose-300 bg-rose-500/20 border border-rose-500/30 rounded-lg">
                {searchError}
              </div>
            )}
          </GlassCardContent>
        </GlassCard>

        {/* Sites Table */}
        <GlassCard>
          <GlassCardHeader>
            <div className="flex items-center justify-between">
              <GlassCardTitle className="text-lg">Sites</GlassCardTitle>
              <Button
                variant="glass"
                size="sm"
                onClick={loadSites}
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
                <p className="text-white/60 mt-4">Loading sites...</p>
              </div>
            ) : sites.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/60">No sites found</p>
                <p className="text-white/40 text-sm mt-2">Click "Add Site" to get started</p>
              </div>
            ) : (
              <>
                <GlassTable>
                  <GlassTableHeader>
                    <GlassTableRow>
                      <GlassTableHead>ID</GlassTableHead>
                      <GlassTableHead>Name</GlassTableHead>
                      <GlassTableHead>URL</GlassTableHead>
                      <GlassTableHead>Forums</GlassTableHead>
                      <GlassTableHead>Created</GlassTableHead>
                      <GlassTableHead className="text-right">Actions</GlassTableHead>
                    </GlassTableRow>
                  </GlassTableHeader>
                  <GlassTableBody>
                    {sites.map((site) => (
                      <GlassTableRow key={site.id}>
                        <GlassTableCell className="font-medium text-white/90">
                          #{site.id}
                        </GlassTableCell>
                        <GlassTableCell>
                          {site.name || <span className="text-white/40">-</span>}
                        </GlassTableCell>
                        <GlassTableCell>
                          <a
                            href={site.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 transition-colors"
                          >
                            {site.url}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </GlassTableCell>
                        <GlassTableCell>
                          <Badge variant="info">
                            {site.forumCount !== undefined ? site.forumCount : '-'}
                          </Badge>
                        </GlassTableCell>
                        <GlassTableCell>
                          {site.createdAt
                            ? new Date(site.createdAt).toLocaleDateString()
                            : '-'}
                        </GlassTableCell>
                        <GlassTableCell>
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="glass"
                              onClick={() => handleSyncForums(site.id)}
                              disabled={syncing === site.id}
                            >
                              {syncing === site.id ? (
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
                            <Link href={`/sites/${site.id}/forums`}>
                              <Button size="sm" variant="glass">
                                <Folder className="w-4 h-4 mr-1" />
                                Forums
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="glass"
                              onClick={() => openEditDialog(site)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="glass-danger"
                              onClick={() => openDeleteDialog(site)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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

      {/* Create Site Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="glass-card border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">Create Site</DialogTitle>
            <DialogDescription className="text-white/60">
              Add a new XenForo site to manage
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white/90">Name (optional)</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Site name"
                className="glass-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url" className="text-white/90">URL *</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com"
                required
                className="glass-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="glass" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="glass-primary" onClick={handleCreate}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Site Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="glass-card border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Site</DialogTitle>
            <DialogDescription className="text-white/60">
              Update site information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-white/90">Name (optional)</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Site name"
                className="glass-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-url" className="text-white/90">URL</Label>
              <Input
                id="edit-url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com"
                className="glass-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="glass" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="glass-primary" onClick={handleUpdate}>
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Site Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="glass-card border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Site</DialogTitle>
            <DialogDescription className="text-white/60">
              Are you sure you want to delete this site? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="glass" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="glass-danger" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Forums Sync Result Dialog */}
      <Dialog open={forumsDialogOpen} onOpenChange={setForumsDialogOpen}>
        <DialogContent className="glass-card border-white/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                Synced Forums
              </div>
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Successfully synced {forums.length} forums
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <GlassTable>
              <GlassTableHeader>
                <GlassTableRow>
                  <GlassTableHead>Name</GlassTableHead>
                  <GlassTableHead>Original ID</GlassTableHead>
                  <GlassTableHead>URL</GlassTableHead>
                </GlassTableRow>
              </GlassTableHeader>
              <GlassTableBody>
                {forums.map((forum, idx) => (
                  <GlassTableRow key={forum.id || idx}>
                    <GlassTableCell>{forum.name || '-'}</GlassTableCell>
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
                        '-'
                      )}
                    </GlassTableCell>
                  </GlassTableRow>
                ))}
              </GlassTableBody>
            </GlassTable>
          </div>
          <DialogFooter>
            <Button variant="glass-primary" onClick={() => setForumsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
