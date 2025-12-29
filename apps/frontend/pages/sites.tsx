import { useEffect, useState } from 'react';
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
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import {
  authApi,
  crawlerApi,
  Forum,
  LoginAdapter,
  Site,
  sitesApi,
  siteSyncApi,
  threadsApi,
} from '@/lib/api';
import { usePagination } from '@/lib/pagination';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  CheckCircle,
  Edit,
  ExternalLink,
  Folder,
  Key,
  LogIn,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import {
  BadgeVariant,
  ButtonSize,
  ButtonVariant,
  ToastType,
} from '@/lib/enums';

export default function SitesPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const { page, goToPage } = usePagination();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    loginAdapter: '',
  });
  const [forums, setForums] = useState<Forum[]>([]);
  const [loginAdapters, setLoginAdapters] = useState<LoginAdapter[]>([]);
  const [forumsDialogOpen, setForumsDialogOpen] = useState(false);
  const [syncing, setSyncing] = useState<number | null>(null);
  const [searchOriginalId, setSearchOriginalId] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [loginSite, setLoginSite] = useState<Site | null>(null);
  const [loginCredentials, setLoginCredentials] = useState({
    username: '',
    password: '',
  });
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginResult, setLoginResult] = useState<any>(null);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    loadSites();
    loadLoginAdapters();
  }, [page]);

  const loadLoginAdapters = async () => {
    try {
      const adapters = await crawlerApi.getLoginAdapters();
      if (Array.isArray(adapters)) {
        setLoginAdapters(adapters);
      } else {
        console.warn('Login adapters response is not an array:', adapters);
        setLoginAdapters([]);
      }
    } catch (err) {
      console.error('Failed to load login adapters:', err);
      setLoginAdapters([]);
    }
  };

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
      const payload: any = { ...formData };
      // Only include loginAdapter if it's set
      if (!payload.loginAdapter) {
        delete payload.loginAdapter;
      }
      await sitesApi.create(payload);
      setCreateDialogOpen(false);
      setFormData({ name: '', url: '', loginAdapter: '' });
      addToast('Site created successfully', ToastType.SUCCESS);
      loadSites();
    } catch (err) {
      console.error('Failed to create site:', err);
      addToast('Failed to create site', ToastType.ERROR);
    }
  };

  const handleUpdate = async () => {
    if (!selectedSite) return;
    try {
      const payload: any = { ...formData };
      // Only include loginAdapter if it's set
      if (!payload.loginAdapter) {
        delete payload.loginAdapter;
      }
      await sitesApi.update(selectedSite.id, payload);
      setEditDialogOpen(false);
      setSelectedSite(null);
      setFormData({ name: '', url: '', loginAdapter: '' });
      addToast('Site updated successfully', ToastType.SUCCESS);
      loadSites();
    } catch (err) {
      console.error('Failed to update site:', err);
      addToast('Failed to update site', ToastType.ERROR);
    }
  };

  const handleDelete = async () => {
    if (!selectedSite) return;
    try {
      await sitesApi.delete(selectedSite.id);
      setDeleteDialogOpen(false);
      setSelectedSite(null);
      addToast('Site deleted successfully', ToastType.SUCCESS);
      loadSites();
    } catch (err) {
      console.error('Failed to delete site:', err);
      addToast('Failed to delete site', ToastType.ERROR);
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
      addToast('Failed to sync forums', ToastType.ERROR);
    } finally {
      setSyncing(null);
    }
  };

  const openEditDialog = (site: Site) => {
    setSelectedSite(site);
    setFormData({
      name: site.name || '',
      url: site.url,
      loginAdapter: site.loginAdapter || '',
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (site: Site) => {
    setSelectedSite(site);
    setDeleteDialogOpen(true);
  };

  const openLoginDialog = (site: Site) => {
    setLoginSite(site);
    setLoginCredentials({ username: '', password: '' });
    setLoginResult(null);
    setLoginError('');
    setLoginDialogOpen(true);
  };

  const handleLogin = async () => {
    if (
      !loginSite ||
      !loginCredentials.username ||
      !loginCredentials.password
    ) {
      setLoginError('Please enter both username and password');
      return;
    }

    setLoggingIn(true);
    setLoginError('');
    setLoginResult(null);

    try {
      const result = await authApi.login(
        loginCredentials.username,
        loginCredentials.password,
        loginSite.id,
      );
      setLoginResult(result);
      addToast('Login successful!', ToastType.SUCCESS);
      // Close dialog on success
      setLoginDialogOpen(false);
      setLoginCredentials({ username: '', password: '' });
      setLoginResult(null);
      setLoginError('');
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleSearchThread = async () => {
    if (!searchOriginalId.trim()) {
      setSearchError('Please enter an original thread ID');
      return;
    }

    setSearching(true);
    setSearchError('');

    try {
      const thread = await threadsApi.searchByOriginalId(
        searchOriginalId.trim(),
      );
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
            <p className="text-white/60 mt-1">
              Manage your XenForo sites and synchronize forums
            </p>
          </div>
          <Button
            variant={ButtonVariant.GLASS_PRIMARY}
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Site
          </Button>
        </div>

        {/* Thread Search */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="text-lg">
              Quick Thread Search
            </GlassCardTitle>
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
                variant={ButtonVariant.GLASS_PRIMARY}
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
                variant={ButtonVariant.GLASS}
                size={ButtonSize.SM}
                onClick={loadSites}
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
                <p className="text-white/60 mt-4">Loading sites...</p>
              </div>
            ) : sites.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/60">No sites found</p>
                <p className="text-white/40 text-sm mt-2">
                  Click "Add Site" to get started
                </p>
              </div>
            ) : (
              <>
                <GlassTable>
                  <GlassTableHeader>
                    <GlassTableRow>
                      <GlassTableHead>ID</GlassTableHead>
                      <GlassTableHead>Name</GlassTableHead>
                      <GlassTableHead>URL</GlassTableHead>
                      <GlassTableHead>Login Adapter</GlassTableHead>
                      <GlassTableHead>Forums</GlassTableHead>
                      <GlassTableHead>Created</GlassTableHead>
                      <GlassTableHead className="text-right">
                        Actions
                      </GlassTableHead>
                    </GlassTableRow>
                  </GlassTableHeader>
                  <GlassTableBody>
                    {sites.map((site) => (
                      <GlassTableRow key={site.id}>
                        <GlassTableCell className="font-medium text-white/90">
                          #{site.id}
                        </GlassTableCell>
                        <GlassTableCell>
                          {site.name || (
                            <span className="text-white/40">-</span>
                          )}
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
                          <Badge
                            variant={
                              site.loginAdapter
                                ? BadgeVariant.SUCCESS
                                : BadgeVariant.DEFAULT
                            }
                          >
                            {site.loginAdapter || 'xamvn-clone'}
                          </Badge>
                        </GlassTableCell>
                        <GlassTableCell>
                          <Badge variant={BadgeVariant.INFO}>
                            {site.forumCount !== undefined
                              ? site.forumCount
                              : '-'}
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
                              size={ButtonSize.SM}
                              variant={ButtonVariant.GLASS}
                              onClick={() => openLoginDialog(site)}
                              title="Login to site"
                            >
                              <LogIn className="w-4 h-4" />
                            </Button>
                            <Button
                              size={ButtonSize.SM}
                              variant={ButtonVariant.GLASS}
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
                            <Link href={`/sites/${site.id}`}>
                              <Button
                                size={ButtonSize.SM}
                                variant={ButtonVariant.GLASS}
                              >
                                <Folder className="w-4 h-4 mr-1" />
                                Forums
                              </Button>
                            </Link>
                            <Button
                              size={ButtonSize.SM}
                              variant={ButtonVariant.GLASS}
                              onClick={() => openEditDialog(site)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size={ButtonSize.SM}
                              variant={ButtonVariant.GLASS_DANGER}
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
              <Label htmlFor="name" className="text-white/90">
                Name (optional)
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Site name"
                className="glass-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url" className="text-white/90">
                URL *
              </Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                placeholder="https://example.com"
                required
                className="glass-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loginAdapter" className="text-white/90">
                Login Adapter (optional)
              </Label>
              <Select
                id="loginAdapter"
                value={formData.loginAdapter}
                onChange={(e) =>
                  setFormData({ ...formData, loginAdapter: e.target.value })
                }
                className="glass-input"
              >
                <option value="">Default (xamvn-clone)</option>
                {Array.isArray(loginAdapters) &&
                  loginAdapters.map((adapter) => (
                    <option key={adapter.key} value={adapter.key}>
                      {adapter.name}
                    </option>
                  ))}
              </Select>
              <p className="text-xs text-white/50">
                Select the login method for this XenForo site
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant={ButtonVariant.GLASS}
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant={ButtonVariant.GLASS_PRIMARY}
              onClick={handleCreate}
            >
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
              <Label htmlFor="edit-name" className="text-white/90">
                Name (optional)
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Site name"
                className="glass-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-url" className="text-white/90">
                URL
              </Label>
              <Input
                id="edit-url"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                placeholder="https://example.com"
                className="glass-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-loginAdapter" className="text-white/90">
                Login Adapter (optional)
              </Label>
              <Select
                id="edit-loginAdapter"
                value={formData.loginAdapter}
                onChange={(e) =>
                  setFormData({ ...formData, loginAdapter: e.target.value })
                }
                className="glass-input"
              >
                <option value="">Default (xamvn-clone)</option>
                {Array.isArray(loginAdapters) &&
                  loginAdapters.map((adapter) => (
                    <option key={adapter.key} value={adapter.key}>
                      {adapter.name}
                    </option>
                  ))}
              </Select>
              <p className="text-xs text-white/50">
                Select the login method for this XenForo site
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant={ButtonVariant.GLASS}
              onClick={() => setEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant={ButtonVariant.GLASS_PRIMARY}
              onClick={handleUpdate}
            >
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
              Are you sure you want to delete this site? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant={ButtonVariant.GLASS}
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant={ButtonVariant.GLASS_DANGER} onClick={handleDelete}>
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
                        '-'
                      )}
                    </GlassTableCell>
                  </GlassTableRow>
                ))}
              </GlassTableBody>
            </GlassTable>
          </div>
          <DialogFooter>
            <Button
              variant={ButtonVariant.GLASS_PRIMARY}
              onClick={() => setForumsDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Login Dialog */}
      <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <DialogContent className="glass-card border-white/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <LogIn className="w-5 h-5" />
              Login to {loginSite?.name || loginSite?.url}
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Enter your credentials to login and receive session cookies
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Credentials Input */}
            {!loginResult && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="login-username" className="text-white/90">
                    Username
                  </Label>
                  <Input
                    id="login-username"
                    value={loginCredentials.username}
                    onChange={(e) =>
                      setLoginCredentials({
                        ...loginCredentials,
                        username: e.target.value,
                      })
                    }
                    placeholder="Enter your username"
                    className="glass-input"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleLogin();
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-white/90">
                    Password
                  </Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginCredentials.password}
                    onChange={(e) =>
                      setLoginCredentials({
                        ...loginCredentials,
                        password: e.target.value,
                      })
                    }
                    placeholder="Enter your password"
                    className="glass-input"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleLogin();
                      }
                    }}
                  />
                </div>
                {loginSite && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
                    <Key className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-white/70">
                      Using login adapter:{' '}
                      <Badge variant={BadgeVariant.SUCCESS} className="ml-1">
                        {loginSite.loginAdapter || 'xamvn-clone'}
                      </Badge>
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Error Display */}
            {loginError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-lg">
                <p className="text-destructive text-sm">{loginError}</p>
              </div>
            )}

            {/* Success Result */}
            {loginResult && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-300 font-medium">
                    Login Successful!
                  </span>
                </div>

                {loginResult.message && (
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-white/80 text-sm">
                      {loginResult.message}
                    </p>
                  </div>
                )}

                {loginResult.cookies && (
                  <div className="space-y-2">
                    <Label className="text-white/90">Session Cookies</Label>
                    <div className="max-h-64 overflow-y-auto p-3 bg-black/30 rounded-lg border border-white/10 font-mono text-xs">
                      <pre className="text-white/70 whitespace-pre-wrap break-all">
                        {JSON.stringify(loginResult.cookies, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {loginResult.user && (
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <Label className="text-white/90 block mb-2">
                      User Information
                    </Label>
                    <div className="space-y-1 text-sm text-white/70">
                      {loginResult.user.username && (
                        <div>
                          Username:{' '}
                          <span className="text-cyan-400">
                            {loginResult.user.username}
                          </span>
                        </div>
                      )}
                      {loginResult.user.userId && (
                        <div>
                          User ID:{' '}
                          <span className="text-cyan-400">
                            {loginResult.user.userId}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            {!loginResult ? (
              <>
                <Button
                  variant={ButtonVariant.GLASS}
                  onClick={() => {
                    setLoginDialogOpen(false);
                    setLoginCredentials({ username: '', password: '' });
                    setLoginError('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant={ButtonVariant.GLASS_PRIMARY}
                  onClick={handleLogin}
                  disabled={
                    loggingIn ||
                    !loginCredentials.username ||
                    !loginCredentials.password
                  }
                >
                  {loggingIn ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Login
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                variant={ButtonVariant.GLASS_PRIMARY}
                onClick={() => {
                  setLoginDialogOpen(false);
                  setLoginCredentials({ username: '', password: '' });
                  setLoginResult(null);
                  setLoginError('');
                }}
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
