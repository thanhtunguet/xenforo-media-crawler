import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
} from '@/components/ui/glass-card';
import { Layout } from '@/components/layout';
import { threadsApi, mediaApi, Thread, Media } from '@/lib/api';
import {
  ArrowLeft,
  Image as ImageIcon,
  Video,
  Link as LinkIcon,
  X,
  Download,
  Grid3x3,
  RefreshCw,
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

export default function ThreadAlbumPage() {
  const router = useRouter();
  const { id } = router.query;
  const threadId = id ? Number(id) : null;

  const [thread, setThread] = useState<Thread | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaType, setMediaType] = useState<string>('');
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const [imageFlipH, setImageFlipH] = useState(1);
  const [imageFlipV, setImageFlipV] = useState(1);
  const [imagePan, setImagePan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ 
    x: number; 
    y: number; 
    screenX?: number; 
    screenY?: number; 
    containerCenterX?: number; 
    containerCenterY?: number;
  }>({ x: 0, y: 0 });
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (threadId) {
      loadThread();
      loadMedia();
    }
  }, [threadId, mediaType]);

  const loadThread = async () => {
    if (!threadId) return;
    try {
      const threadData = await threadsApi.getById(threadId);
      setThread(threadData);
    } catch (err) {
      console.error('Failed to load thread:', err);
    }
  };

  const loadMedia = async () => {
    if (!threadId) return;
    try {
      setLoading(true);
      const mediaData = await mediaApi.getThreadMedia(
        threadId,
        mediaType !== '' ? Number(mediaType) : undefined
      );
      console.log('Loaded media:', mediaData);
      setMedia(mediaData);
    } catch (err) {
      console.error('Failed to load media:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMediaUrl = (mediaItem: Media): string => {
    // If downloaded, use backend API endpoint to serve downloaded media
    if (mediaItem.isDownloaded && mediaItem.localPath) {
      return `/api/media/${mediaItem.id}/file`;
    }
    // Otherwise use original URL
    return mediaItem.url || '';
  };

  const getThumbnailUrl = (mediaItem: Media): string => {
    // If downloaded, use backend API endpoint to serve thumbnails
    if (mediaItem.isDownloaded && mediaItem.localPath) {
      return `/api/media/${mediaItem.id}/thumbnail?size=200`;
    }
    // Otherwise use thumbnail URL or fallback to URL
    return mediaItem.thumbnailUrl || mediaItem.url || '';
  };

  const isImage = (mediaItem: Media): boolean => {
    const typeId = Number(mediaItem.mediaTypeId);
    if (typeId === 1) return true;

    // Fallback: check URL extension or mimeType
    const url = mediaItem.url || '';
    const mimeType = mediaItem.mimeType || '';
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const imageMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/svg+xml',
    ];

    return (
      imageExtensions.some((ext) => url.toLowerCase().includes(ext)) ||
      imageMimeTypes.some((mime) => mimeType.toLowerCase().includes(mime))
    );
  };

  const isVideo = (mediaItem: Media): boolean => {
    const typeId = Number(mediaItem.mediaTypeId);
    if (typeId === 2) return true;

    // Fallback: check URL extension or mimeType
    const url = mediaItem.url || '';
    const mimeType = mediaItem.mimeType || '';
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv'];
    const videoMimeTypes = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
      'video/x-msvideo',
    ];

    return (
      videoExtensions.some((ext) => url.toLowerCase().includes(ext)) ||
      videoMimeTypes.some((mime) => mimeType.toLowerCase().includes(mime))
    );
  };

  if (!threadId) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-white/60">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="glass"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Album Header */}
        <GlassCard variant="hover-glow">
          <GlassCardHeader>
            <GlassCardTitle className="gradient-text text-3xl">
              {thread?.title || 'Loading...'}
            </GlassCardTitle>
            <GlassCardDescription>Media gallery for this thread</GlassCardDescription>
          </GlassCardHeader>
        </GlassCard>

        {/* Filter Tabs */}
        <GlassCard>
          <GlassCardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-white/60">Filter:</span>
              {mediaTypeFilters.map((filter) => {
                const Icon = filter.icon;
                const isActive = mediaType === filter.id;
                return (
                  <Button
                    key={filter.id}
                    variant={isActive ? 'glass-primary' : 'glass'}
                    size="sm"
                    onClick={() => setMediaType(filter.id)}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {filter.label}
                  </Button>
                );
              })}
              <div className="ml-auto flex items-center gap-2">
                <div className="text-sm text-white/60">
                  {media.length} item{media.length !== 1 ? 's' : ''}
                </div>
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
                Try changing the filter or download media for this thread
              </p>
            </div>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                      <div className="text-center p-4">
                        <LinkIcon className="w-12 h-12 mx-auto mb-2 text-white/40" />
                        <p className="text-xs text-white/60">
                          {hasValidUrl ? 'Link' : 'No URL'}
                        </p>
                      </div>
                    </div>
                  )}
                  {mediaItem.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                      {mediaItem.caption}
                    </div>
                  )}
                  {hasValidUrl && isVideo(mediaItem) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors pointer-events-none">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Video className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  )}
                  {mediaItem.isDownloaded && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500/90 flex items-center justify-center">
                      <Download className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Media Viewer Modal */}
        {selectedMedia && (
          <div
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md animate-fade-in"
            onClick={() => {
              // Prevent dismissal when zoomed in
              if (imageZoom > 1) {
                return;
              }
              setSelectedMedia(null);
              // Reset image transforms when closing
              setImageZoom(1);
              setImageRotation(0);
              setImageFlipH(1);
              setImageFlipV(1);
              setImagePan({ x: 0, y: 0 });
            }}
          >
            <div className="absolute inset-0 w-full h-full">
              <div className="relative h-full w-full">
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
                        setImageZoom(1);
                        setImagePan({ x: 0, y: 0 });
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
                        setImageZoom(1);
                        setImagePan({ x: 0, y: 0 });
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
                        setImageZoom(1);
                        setImagePan({ x: 0, y: 0 });
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
                        setImageZoom(1);
                        setImagePan({ x: 0, y: 0 });
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
                  className="h-full w-full overflow-hidden flex items-center justify-center"
                  onMouseDown={(e) => {
                    if (isImage(selectedMedia) && imageZoom > 1 && imageRef) {
                      e.stopPropagation();
                      setIsDragging(true);
                      
                      // Lấy vị trí container (center của viewport)
                      const container = e.currentTarget;
                      const containerRect = container.getBoundingClientRect();
                      const containerCenterX = containerRect.left + containerRect.width / 2;
                      const containerCenterY = containerRect.top + containerRect.height / 2;
                      
                      // Vị trí click relative to container center
                      const clickX = e.clientX - containerCenterX;
                      const clickY = e.clientY - containerCenterY;
                      
                      // Tính vị trí pixel trên ảnh (accounting for current pan, zoom, rotation, flip)
                      // Đảo ngược transform để lấy tọa độ trên ảnh gốc
                      const imagePixelX = (clickX - imagePan.x) / imageZoom;
                      const imagePixelY = (clickY - imagePan.y) / imageZoom;
                      
                      // Lưu vị trí pixel trên ảnh và vị trí click trên màn hình
                      setDragStart({ 
                        x: imagePixelX, 
                        y: imagePixelY,
                        screenX: e.clientX,
                        screenY: e.clientY,
                        containerCenterX,
                        containerCenterY
                      });
                    }
                  }}
                  onMouseMove={(e) => {
                    if (isDragging && imageZoom > 1) {
                      e.stopPropagation();
                      
                      // Tính vị trí mới của pixel ảnh trên màn hình
                      const newScreenX = e.clientX;
                      const newScreenY = e.clientY;
                      
                      // Vị trí relative to container center
                      const relativeX = newScreenX - dragStart.containerCenterX!;
                      const relativeY = newScreenY - dragStart.containerCenterY!;
                      
                      // Tính pan mới sao cho pixel ảnh ở đúng vị trí mới
                      const newPanX = relativeX - dragStart.x * imageZoom;
                      const newPanY = relativeY - dragStart.y * imageZoom;
                      
                      setImagePan({
                        x: newPanX,
                        y: newPanY,
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
                    if (isImage(selectedMedia) && imageZoom > 1 && e.touches.length === 1 && imageRef) {
                      e.stopPropagation();
                      const touch = e.touches[0];
                      setIsDragging(true);
                      
                      // Lấy vị trí container (center của viewport)
                      const container = e.currentTarget;
                      const containerRect = container.getBoundingClientRect();
                      const containerCenterX = containerRect.left + containerRect.width / 2;
                      const containerCenterY = containerRect.top + containerRect.height / 2;
                      
                      // Vị trí touch relative to container center
                      const touchX = touch.clientX - containerCenterX;
                      const touchY = touch.clientY - containerCenterY;
                      
                      // Tính vị trí pixel trên ảnh
                      const imagePixelX = (touchX - imagePan.x) / imageZoom;
                      const imagePixelY = (touchY - imagePan.y) / imageZoom;
                      
                      // Lưu vị trí pixel trên ảnh và vị trí touch trên màn hình
                      setDragStart({ 
                        x: imagePixelX, 
                        y: imagePixelY,
                        screenX: touch.clientX,
                        screenY: touch.clientY,
                        containerCenterX,
                        containerCenterY
                      });
                    }
                  }}
                  onTouchMove={(e) => {
                    if (isDragging && imageZoom > 1 && e.touches.length === 1) {
                      e.stopPropagation();
                      const touch = e.touches[0];
                      
                      // Tính vị trí mới của pixel ảnh trên màn hình
                      const newScreenX = touch.clientX;
                      const newScreenY = touch.clientY;
                      
                      // Vị trí relative to container center
                      const relativeX = newScreenX - dragStart.containerCenterX!;
                      const relativeY = newScreenY - dragStart.containerCenterY!;
                      
                      // Tính pan mới sao cho pixel ảnh ở đúng vị trí mới
                      const newPanX = relativeX - dragStart.x * imageZoom;
                      const newPanY = relativeY - dragStart.y * imageZoom;
                      
                      setImagePan({
                        x: newPanX,
                        y: newPanY,
                      });
                    }
                  }}
                  onTouchEnd={() => {
                    setIsDragging(false);
                  }}
                >
                  {isImage(selectedMedia) ? (
                    <img
                      ref={setImageRef}
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
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        if (imageZoom <= 1) {
                          // Zoom in to 2x on double click
                          setImageZoom(2);
                        } else {
                          // Reset zoom if already zoomed
                          setImageZoom(1);
                          setImagePan({ x: 0, y: 0 });
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
                      Your browser does not support the video tag.
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
