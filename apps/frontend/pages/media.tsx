import { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/layout';
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
} from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { StatCard } from '@/components/StatCard';
import { useSettings } from '@/hooks/useSettings';
import { mediaApi, MediaWithThread, MediaStatsDto, MediaFilters } from '@/lib/api';
import Link from 'next/link';
import {
  Image as ImageIcon,
  Video,
  Link as LinkIcon,
  Grid3x3,
  RefreshCw,
  Search,
  Download,
  X,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  RotateCcw,
} from 'lucide-react';

const mediaTypeFilters = [
  { id: '', label: 'All Media', icon: Grid3x3 },
  { id: '1', label: 'Images', icon: ImageIcon },
  { id: '2', label: 'Videos', icon: Video },
  { id: '3', label: 'Links', icon: LinkIcon },
];

export default function MediaPage() {
  const { settings, saveLastFilters } = useSettings();

  const [media, setMedia] = useState<MediaWithThread[]>([]);
  const [stats, setStats] = useState<MediaStatsDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState<MediaWithThread | null>(null);
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const [imageFlipH, setImageFlipH] = useState(1);
  const [imageFlipV, setImageFlipV] = useState(1);
  const [imagePan, setImagePan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Initialize filters from settings
  const getInitialFilters = (): MediaFilters => {
    if (settings.filters.rememberLastFilters && settings.filters.lastFilters) {
      return {
        mediaTypeId: settings.filters.lastFilters.mediaTypeId ? Number(settings.filters.lastFilters.mediaTypeId) : undefined,
        isDownloaded: settings.filters.lastFilters.isDownloaded === 'true' ? true : settings.filters.lastFilters.isDownloaded === 'false' ? false : undefined,
        search: settings.filters.lastFilters.search || '',
        sortBy: (settings.filters.lastFilters.sortBy as 'createdAt' | 'updatedAt' | 'filename') || settings.filters.defaultSort,
        sortOrder: (settings.filters.lastFilters.sortOrder as 'ASC' | 'DESC') || settings.filters.defaultSortOrder,
      };
    }

    return {
      mediaTypeId: settings.filters.defaultMediaType ? Number(settings.filters.defaultMediaType) : undefined,
      sortBy: settings.filters.defaultSort,
      sortOrder: settings.filters.defaultSortOrder,
      search: '',
    };
  };

  const [filters, setFilters] = useState<MediaFilters>(getInitialFilters());
  const [searchInput, setSearchInput] = useState(filters.search || '');

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadMedia();
  }, [page, filters, settings.display.itemsPerPage]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }));
      setPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const data = await mediaApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadMedia = async () => {
    setLoading(true);
    try {
      const response = await mediaApi.getAll(
        page,
        settings.display.itemsPerPage,
        filters
      );
      setMedia(response.items);
      setTotalPages(response.meta.totalPages);
      setTotalItems(response.meta.totalItems);

      // Save last filters if enabled
      saveLastFilters({
        mediaTypeId: filters.mediaTypeId?.toString(),
        isDownloaded: filters.isDownloaded?.toString(),
        search: filters.search,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });
    } catch (error) {
      console.error('Failed to load media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadStats();
    loadMedia();
  };

  const getMediaUrl = (mediaItem: MediaWithThread): string => {
    if (mediaItem.isDownloaded && mediaItem.localPath) {
      // Use backend API endpoint to serve downloaded media
      return `/api/media/${mediaItem.id}/file`;
    }
    return mediaItem.url || '';
  };

  const getThumbnailUrl = (mediaItem: MediaWithThread): string => {
    if (mediaItem.isDownloaded && mediaItem.localPath) {
      // Use backend API endpoint to serve thumbnails
      return `/api/media/${mediaItem.id}/thumbnail?size=200`;
    }
    return mediaItem.thumbnailUrl || mediaItem.url || '';
  };

  const isImage = (mediaItem: MediaWithThread): boolean => {
    const typeId = Number(mediaItem.mediaTypeId);
    return typeId === 1;
  };

  const isVideo = (mediaItem: MediaWithThread): boolean => {
    const typeId = Number(mediaItem.mediaTypeId);
    return typeId === 2;
  };

  const gridColsClass = useMemo(() => {
    const cols = settings.display.gridColumns;
    const classes: Record<number, string> = {
      2: 'grid-cols-2',
      3: 'grid-cols-2 sm:grid-cols-3',
      4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
      5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
      6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
      7: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7',
      8: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8',
    };
    return classes[cols] || classes[6];
  }, [settings.display.gridColumns]);

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Media Gallery</h1>
          <p className="text-white/60">Browse and manage all media from your threads</p>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Media"
            value={stats?.totalMedia || 0}
            icon={Grid3x3}
            loading={statsLoading}
          />
          <StatCard
            title="Images"
            value={stats?.totalImages || 0}
            icon={ImageIcon}
            loading={statsLoading}
          />
          <StatCard
            title="Videos"
            value={stats?.totalVideos || 0}
            icon={Video}
            loading={statsLoading}
          />
          <GlassCard
            variant="hover-glow"
            className={statsLoading ? 'animate-pulse' : ''}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-white/60">Download Progress</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-white">
                    {statsLoading ? '...' : `${stats?.downloadRate || 0}%`}
                  </p>
                </div>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-glow">
                <Download className="h-7 w-7 text-white" />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Filters & Search */}
        <GlassCard>
          <GlassCardContent className="p-4">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search by caption or filename..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="glass-input w-full pl-10"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-white/60">Type:</span>
                {mediaTypeFilters.map((filter) => {
                  const Icon = filter.icon;
                  const isActive =
                    (filter.id === '' && !filters.mediaTypeId) ||
                    filters.mediaTypeId === Number(filter.id);
                  return (
                    <Button
                      key={filter.id}
                      variant={isActive ? 'glass-primary' : 'glass'}
                      size="sm"
                      onClick={() => {
                        setFilters((prev) => ({
                          ...prev,
                          mediaTypeId: filter.id ? Number(filter.id) : undefined,
                        }));
                        setPage(1);
                      }}
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {filter.label}
                    </Button>
                  );
                })}

                <div className="flex-1" />

                {/* Download Status Filter */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="download-status" className="text-white/60 text-sm">
                    Status:
                  </Label>
                  <Select
                    id="download-status"
                    value={
                      filters.isDownloaded === undefined
                        ? 'all'
                        : filters.isDownloaded
                        ? 'downloaded'
                        : 'not-downloaded'
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      setFilters((prev) => ({
                        ...prev,
                        isDownloaded:
                          value === 'all'
                            ? undefined
                            : value === 'downloaded'
                            ? true
                            : false,
                      }));
                      setPage(1);
                    }}
                    className="glass-input"
                  >
                    <option value="all">All</option>
                    <option value="downloaded">Downloaded</option>
                    <option value="not-downloaded">Not Downloaded</option>
                  </Select>
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="sort" className="text-white/60 text-sm">
                    Sort:
                  </Label>
                  <Select
                    id="sort"
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split('-');
                      setFilters((prev) => ({
                        ...prev,
                        sortBy: sortBy as 'createdAt' | 'updatedAt' | 'filename',
                        sortOrder: sortOrder as 'ASC' | 'DESC',
                      }));
                      setPage(1);
                    }}
                    className="glass-input"
                  >
                    <option value="createdAt-DESC">Recent First</option>
                    <option value="createdAt-ASC">Oldest First</option>
                    <option value="filename-ASC">Name A-Z</option>
                    <option value="filename-DESC">Name Z-A</option>
                  </Select>
                </div>

                {/* Refresh Button */}
                <Button variant="glass" size="sm" onClick={handleRefresh} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>

              {/* Results Info */}
              <div className="flex items-center justify-between text-sm text-white/60">
                <span>
                  Showing {media.length} of {totalItems} items
                </span>
                <span>
                  Page {page} of {totalPages}
                </span>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Media Grid */}
        {loading ? (
          <GlassCard>
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
              <span className="ml-2 text-white/60">Loading media...</span>
            </div>
          </GlassCard>
        ) : media.length === 0 ? (
          <GlassCard>
            <div className="text-center py-12">
              <Grid3x3 className="h-12 w-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/60">No media found</p>
              <p className="text-white/40 text-sm mt-1">
                Try adjusting your filters or sync media from threads
              </p>
            </div>
          </GlassCard>
        ) : (
          <>
            <div className={`grid ${gridColsClass} gap-4`}>
              {media.map((mediaItem) => {
                const mediaUrl = getMediaUrl(mediaItem);
                const thumbnailUrl = getThumbnailUrl(mediaItem);
                const hasValidUrl = !!(mediaUrl || thumbnailUrl);

                return (
                  <div
                    key={mediaItem.id}
                    className="glass-card group relative aspect-square overflow-hidden cursor-pointer hover:shadow-glow transition-all duration-300"
                    onClick={() => setSelectedMedia(mediaItem)}
                  >
                    {hasValidUrl && isImage(mediaItem) ? (
                      thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt={mediaItem.caption || mediaItem.filename || 'Image'}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                          <ImageIcon className="w-12 h-12 text-white/40" />
                        </div>
                      )
                    ) : hasValidUrl && isVideo(mediaItem) ? (
                      <video
                        src={thumbnailUrl || ''}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                        poster={thumbnailUrl || undefined}
                      >
                        {thumbnailUrl && (
                          <source
                            src={thumbnailUrl}
                            type={mediaItem.mimeType || 'video/mp4'}
                          />
                        )}
                      </video>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/5">
                        <div className="text-center p-4">
                          <LinkIcon className="w-12 h-12 mx-auto mb-2 text-white/40" />
                          <p className="text-xs text-white/60">Link</p>
                        </div>
                      </div>
                    )}

                    {/* Download Badge */}
                    {mediaItem.isDownloaded && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500/90 flex items-center justify-center">
                        <Download className="w-3 h-3 text-white" />
                      </div>
                    )}

                    {/* Video Indicator */}
                    {hasValidUrl && isVideo(mediaItem) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Video className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    )}

                    {/* Caption & Thread Info */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {mediaItem.caption && (
                        <p className="truncate mb-1">{mediaItem.caption}</p>
                      )}
                      <p className="text-white/60 truncate">
                        Thread: {mediaItem.thread.title}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <Button
                  variant="glass"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-white/60">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="glass"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}

        {/* Lightbox Modal */}
        {selectedMedia && (
          <div
            className="fixed inset-0 z-50 flex bg-black/95 backdrop-blur-md animate-fade-in"
            onClick={() => {
              setSelectedMedia(null);
              // Reset image transforms when closing
              setImageZoom(1);
              setImageRotation(0);
              setImageFlipH(1);
              setImageFlipV(1);
            }}
          >
            <div className="w-full h-full">
              <div className="relative h-full">
                <Button
                  variant="glass"
                  size="icon"
                  className="absolute top-4 right-4 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMedia(null);
                    // Reset image transforms when closing
                    setImageZoom(1);
                    setImageRotation(0);
                    setImageFlipH(1);
                    setImageFlipV(1);
                    setImagePan({ x: 0, y: 0 });
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>

                {selectedMedia.url && (
                  <a
                    href={getMediaUrl(selectedMedia)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-4 left-4 z-10"
                  >
                    <Button variant="glass-primary" size="sm" className="gap-2">
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </a>
                )}

                {/* Image Controls - Only show for images */}
                {isImage(selectedMedia) && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newZoom = Math.min(imageZoom + 0.25, 5);
                        setImageZoom(newZoom);
                        // Reset pan when zooming out to 1x or less
                        if (newZoom <= 1) {
                          setImagePan({ x: 0, y: 0 });
                        }
                      }}
                      className="gap-2"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newZoom = Math.max(imageZoom - 0.25, 0.25);
                        setImageZoom(newZoom);
                        // Reset pan when zooming out to 1x or less
                        if (newZoom <= 1) {
                          setImagePan({ x: 0, y: 0 });
                        }
                      }}
                      className="gap-2"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageRotation((prev) => (prev + 90) % 360);
                      }}
                      className="gap-2"
                    >
                      <RotateCw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageRotation((prev) => (prev - 90) % 360);
                      }}
                      className="gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageFlipH((prev) => prev * -1);
                      }}
                      className="gap-2"
                    >
                      <FlipHorizontal className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageFlipV((prev) => prev * -1);
                      }}
                      className="gap-2"
                    >
                      <FlipVertical className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageZoom(1);
                        setImageRotation(0);
                        setImageFlipH(1);
                        setImageFlipV(1);
                        setImagePan({ x: 0, y: 0 });
                      }}
                      className="gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                <div 
                  className="flex items-center justify-center h-full overflow-hidden"
                  onMouseDown={(e) => {
                    if (isImage(selectedMedia) && imageZoom > 1) {
                      e.stopPropagation();
                      setIsDragging(true);
                      setDragStart({ x: e.clientX - imagePan.x / 1.5, y: e.clientY - imagePan.y / 1.5 });
                    }
                  }}
                  onMouseMove={(e) => {
                    if (isDragging && imageZoom > 1) {
                      e.stopPropagation();
                      const deltaX = (e.clientX - dragStart.x) * 1.5;
                      const deltaY = (e.clientY - dragStart.y) * 1.5;
                      setImagePan({
                        x: deltaX,
                        y: deltaY,
                      });
                    }
                  }}
                  onMouseUp={() => {
                    setIsDragging(false);
                  }}
                  onMouseLeave={() => {
                    setIsDragging(false);
                  }}
                  onTouchStart={(e) => {
                    if (isImage(selectedMedia) && imageZoom > 1 && e.touches.length === 1) {
                      e.stopPropagation();
                      const touch = e.touches[0];
                      setIsDragging(true);
                      setDragStart({ x: touch.clientX - imagePan.x / 1.5, y: touch.clientY - imagePan.y / 1.5 });
                    }
                  }}
                  onTouchMove={(e) => {
                    if (isDragging && imageZoom > 1 && e.touches.length === 1) {
                      e.stopPropagation();
                      const touch = e.touches[0];
                      const deltaX = (touch.clientX - dragStart.x) * 1.5;
                      const deltaY = (touch.clientY - dragStart.y) * 1.5;
                      setImagePan({
                        x: deltaX,
                        y: deltaY,
                      });
                    }
                  }}
                  onTouchEnd={() => {
                    setIsDragging(false);
                  }}
                >
                  {isImage(selectedMedia) ? (
                    <img
                      src={getMediaUrl(selectedMedia)}
                      alt={selectedMedia.caption || selectedMedia.filename || 'Image'}
                      className={`max-w-full max-h-full mx-auto object-contain rounded-lg shadow-glow-lg transition-transform duration-200 ${isDragging ? 'cursor-grabbing' : imageZoom > 1 ? 'cursor-grab' : ''}`}
                      style={{
                        transform: `translate(${imagePan.x}px, ${imagePan.y}px) scale(${imageZoom}) rotate(${imageRotation}deg) scaleX(${imageFlipH}) scaleY(${imageFlipV})`,
                        transformOrigin: 'center center',
                      }}
                      loading="eager"
                      onClick={(e) => {
                        if (imageZoom <= 1) {
                          e.stopPropagation();
                        }
                      }}
                      draggable={false}
                    />
                  ) : isVideo(selectedMedia) ? (
                    <video
                      src={getMediaUrl(selectedMedia)}
                      controls
                      className="max-w-full max-h-full mx-auto rounded-lg shadow-glow-lg"
                      preload="auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <source
                        src={getMediaUrl(selectedMedia)}
                        type={selectedMedia.mimeType || 'video/mp4'}
                      />
                    </video>
                  ) : (
                    <GlassCard
                      className="max-w-md"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <GlassCardContent className="p-8 text-center">
                        <LinkIcon className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                        <p className="text-white/80 mb-4">
                          {selectedMedia.caption || 'External Link'}
                        </p>
                        {selectedMedia.url && (
                          <a
                            href={selectedMedia.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 hover:underline break-all"
                          >
                            {selectedMedia.url}
                          </a>
                        )}
                      </GlassCardContent>
                    </GlassCard>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
