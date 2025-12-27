import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { GlassTable, GlassTableHeader, GlassTableBody, GlassTableRow, GlassTableHead, GlassTableCell } from '@/components/ui/glass-table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { sitesApi, Forum, Site } from '@/lib/api';
import Link from 'next/link';
import { RefreshCw, Eye, Search, Folder, Clock, Server } from 'lucide-react';

interface ForumWithSite extends Forum {
  site?: Site;
}

export default function ForumsPage() {
  const [forums, setForums] = useState<ForumWithSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sites, setSites] = useState<Site[]>([]);

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    if (sites.length > 0) {
      loadForums();
    }
  }, [sites, page]);

  const loadSites = async () => {
    try {
      const response = await sitesApi.getAll(1, 100);
      setSites(response.items);
    } catch (err) {
      console.error('Failed to load sites:', err);
    }
  };

  const loadForums = async () => {
    try {
      setLoading(true);
      const allForums: ForumWithSite[] = [];
      let totalCount = 0;

      // Fetch forums from all sites
      for (const site of sites) {
        try {
          const response = await sitesApi.getForums(site.id, 1, 1000); // Get all forums for each site
          const forumsWithSite = response.items.map((forum) => ({
            ...forum,
            site,
          }));
          allForums.push(...forumsWithSite);
          totalCount += response.meta.totalItems;
        } catch (err) {
          console.error(`Failed to load forums for site ${site.id}:`, err);
        }
      }

      // Sort by updatedAt (newest first)
      allForums.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });

      // Pagination
      const itemsPerPage = 20;
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedForums = allForums.slice(startIndex, endIndex);

      setForums(paginatedForums);
      setTotalItems(allForums.length);
      setTotalPages(Math.ceil(allForums.length / itemsPerPage));
    } catch (err) {
      console.error('Failed to load forums:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredForums = forums.filter((forum) => {
    const matchesSearch = forum.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      forum.site?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <Layout title="Forums">
      <div className="space-y-6 animate-fade-in">
        {/* Header Card */}
        <GlassCard variant="bordered">
          <GlassCardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                  <Folder className="w-6 h-6 text-white" />
                </div>
                <div>
                  <GlassCardTitle className="gradient-text text-2xl">All Forums</GlassCardTitle>
                  <p className="text-white/60 text-sm mt-1">
                    {totalItems} total forum{totalItems !== 1 ? 's' : ''} • Ordered by newest first
                  </p>
                </div>
              </div>
            </div>
          </GlassCardHeader>
        </GlassCard>

        {/* Search */}
        <GlassCard>
          <GlassCardContent>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  placeholder="Search forums by name or site..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="glass-input pl-10"
                />
              </div>
              <Button variant="glass" onClick={loadForums} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Forums Table */}
        <GlassCard>
          <GlassCardHeader>
            <div className="flex items-center justify-between">
              <div>
                <GlassCardTitle className="text-lg">Forums</GlassCardTitle>
                <p className="text-white/60 text-sm mt-1">
                  {searchQuery
                    ? `${filteredForums.length} forum${filteredForums.length !== 1 ? 's' : ''} match your search`
                    : `Showing ${forums.length} of ${totalItems} forums`}
                </p>
              </div>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-white/40" />
                <p className="text-white/60 mt-4">Loading forums...</p>
              </div>
            ) : filteredForums.length === 0 ? (
              <div className="text-center py-12">
                <Folder className="w-12 h-12 mx-auto text-white/20 mb-4" />
                <p className="text-white/60 text-lg">
                  {searchQuery ? 'No forums match your search' : 'No forums found'}
                </p>
                <p className="text-white/40 text-sm mt-2">
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Sync sites to get forums'}
                </p>
              </div>
            ) : (
              <>
                <GlassTable>
                  <GlassTableHeader>
                    <GlassTableRow>
                      <GlassTableHead>ID</GlassTableHead>
                      <GlassTableHead>Name</GlassTableHead>
                      <GlassTableHead>Site</GlassTableHead>
                      <GlassTableHead>Original ID</GlassTableHead>
                      <GlassTableHead>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Created
                        </div>
                      </GlassTableHead>
                      <GlassTableHead>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Updated
                        </div>
                      </GlassTableHead>
                      <GlassTableHead className="text-right">Actions</GlassTableHead>
                    </GlassTableRow>
                  </GlassTableHeader>
                  <GlassTableBody>
                    {filteredForums.map((forum) => (
                      <GlassTableRow key={`${forum.siteId}-${forum.id}`} className="hover:bg-white/5 transition-colors">
                        <GlassTableCell className="font-medium text-white/90">
                          {forum.id ? `#${forum.id}` : '-'}
                        </GlassTableCell>
                        <GlassTableCell>
                          <div className="max-w-md">
                            <p className="text-white/90 line-clamp-2 font-medium">{forum.name || 'Unnamed Forum'}</p>
                          </div>
                        </GlassTableCell>
                        <GlassTableCell>
                          {forum.site ? (
                            <div className="flex items-center gap-2">
                              <Server className="w-4 h-4 text-white/40" />
                              <span className="text-white/70">{forum.site.name || forum.site.url}</span>
                            </div>
                          ) : (
                            <span className="text-white/40">-</span>
                          )}
                        </GlassTableCell>
                        <GlassTableCell>
                          {forum.originalId ? (
                            <Badge variant="info">#{forum.originalId}</Badge>
                          ) : (
                            <span className="text-white/40">-</span>
                          )}
                        </GlassTableCell>
                        <GlassTableCell>
                          {forum.createdAt ? (
                            <>
                              <div className="text-white/70">
                                {new Date(forum.createdAt).toLocaleDateString()}
                              </div>
                              <div className="text-white/40 text-xs">
                                {new Date(forum.createdAt).toLocaleTimeString()}
                              </div>
                            </>
                          ) : (
                            <span className="text-white/40">-</span>
                          )}
                        </GlassTableCell>
                        <GlassTableCell>
                          {forum.updatedAt ? (
                            <>
                              <div className="text-white/70">
                                {new Date(forum.updatedAt).toLocaleDateString()}
                              </div>
                              <div className="text-white/40 text-xs">
                                {new Date(forum.updatedAt).toLocaleTimeString()}
                              </div>
                            </>
                          ) : (
                            <span className="text-white/40">-</span>
                          )}
                        </GlassTableCell>
                        <GlassTableCell>
                          <div className="flex gap-2 justify-end">
                            {forum.siteId && forum.id && (
                              <Link href={`/sites/${forum.siteId}/forums`}>
                                <Button size="sm" variant="glass" className="hover:shadow-glow">
                                  <Eye className="w-4 h-4 mr-1" />
                                  View Threads
                                </Button>
                              </Link>
                            )}
                          </div>
                        </GlassTableCell>
                      </GlassTableRow>
                    ))}
                  </GlassTableBody>
                </GlassTable>

                {/* Pagination */}
                {!searchQuery && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                    <Button
                      variant="glass"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || loading}
                    >
                      Previous
                    </Button>
                    <span className="text-white/60 text-sm">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="glass"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages || loading}
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

