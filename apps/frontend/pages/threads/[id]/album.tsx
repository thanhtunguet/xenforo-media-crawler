import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Layout } from '@/components/layout';
import { threadsApi, mediaApi, Thread, Media } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function ThreadAlbumPage() {
  const router = useRouter();
  const { id } = router.query;
  const threadId = id ? Number(id) : null;

  const [thread, setThread] = useState<Thread | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaType, setMediaType] = useState<number | ''>('');
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);

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
    // If downloaded, use local path via backend
    if (mediaItem.isDownloaded && mediaItem.localPath) {
      // Extract filename from localPath (format: downloads/thread-{originalId}/{filename})
      const pathParts = mediaItem.localPath.split('/');
      const filename = pathParts[pathParts.length - 1] || mediaItem.filename;
      const originalId = thread?.originalId || threadId;
      if (originalId) {
        return `${API_BASE_URL}/thread-${originalId}/${filename}`;
      }
    }
    // Otherwise use original URL
    return mediaItem.url || '';
  };

  const getThumbnailUrl = (mediaItem: Media): string => {
    // If downloaded, use thumbnail path
    if (mediaItem.isDownloaded && mediaItem.localPath) {
      const pathParts = mediaItem.localPath.split('/');
      const filename = pathParts[pathParts.length - 1] || mediaItem.filename;
      const originalId = thread?.originalId || threadId;
      if (originalId) {
        return `${API_BASE_URL}/thread-${originalId}/thumbnails/${filename}?size=200`;
      }
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
    const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'];
    
    return imageExtensions.some(ext => url.toLowerCase().includes(ext)) ||
           imageMimeTypes.some(mime => mimeType.toLowerCase().includes(mime));
  };

  const isVideo = (mediaItem: Media): boolean => {
    const typeId = Number(mediaItem.mediaTypeId);
    if (typeId === 2) return true;
    
    // Fallback: check URL extension or mimeType
    const url = mediaItem.url || '';
    const mimeType = mediaItem.mimeType || '';
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv'];
    const videoMimeTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
    
    return videoExtensions.some(ext => url.toLowerCase().includes(ext)) ||
           videoMimeTypes.some(mime => mimeType.toLowerCase().includes(mime));
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
            <h2 className="text-3xl font-bold mt-4">
              Album: {thread?.title || 'Loading...'}
            </h2>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filter Media</CardTitle>
            <CardDescription>Filter media by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="space-y-2 flex-1">
                <Label htmlFor="media-type-filter">Media Type</Label>
                <Select
                  id="media-type-filter"
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">All Media</option>
                  <option value="1">Images Only</option>
                  <option value="2">Videos Only</option>
                  <option value="3">Links Only</option>
                </Select>
              </div>
              <div className="pt-6">
                <span className="text-sm text-muted-foreground">
                  {media.length} item{media.length !== 1 ? 's' : ''} found
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-8">Loading media...</div>
        ) : media.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                No media found for this thread.
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {media.map((mediaItem) => {
              const mediaUrl = getMediaUrl(mediaItem);
              const thumbnailUrl = getThumbnailUrl(mediaItem);
              const hasValidUrl = !!(mediaUrl || thumbnailUrl);
              
              return (
                <div
                  key={mediaItem.id}
                  className="group relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                  onClick={() => setSelectedMedia(mediaItem)}
                >
                  {hasValidUrl && isImage(mediaItem) ? (
                    <img
                      src={thumbnailUrl || mediaUrl}
                      alt={mediaItem.caption || mediaItem.filename || 'Image'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        // Fallback to original URL if thumbnail fails
                        const target = e.target as HTMLImageElement;
                        if (mediaUrl && target.src !== mediaUrl) {
                          target.src = mediaUrl;
                        }
                      }}
                    />
                  ) : hasValidUrl && isVideo(mediaItem) ? (
                    <video
                      src={thumbnailUrl || mediaUrl}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                      onError={(e) => {
                        // Fallback to original URL if thumbnail fails
                        const target = e.target as HTMLVideoElement;
                        if (mediaUrl && target.src !== mediaUrl) {
                          target.src = mediaUrl;
                        }
                      }}
                    >
                      <source src={thumbnailUrl || mediaUrl} type={mediaItem.mimeType || 'video/mp4'} />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <div className="text-center p-4">
                        <svg
                          className="w-12 h-12 mx-auto mb-2 text-muted-foreground"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                          />
                        </svg>
                        <p className="text-xs text-muted-foreground">
                          {hasValidUrl ? 'Link' : 'No URL'}
                        </p>
                        {mediaItem.mediaTypeId && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Type: {mediaItem.mediaTypeId}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {mediaItem.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                      {mediaItem.caption}
                    </div>
                  )}
                  {hasValidUrl && isVideo(mediaItem) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors pointer-events-none">
                        <svg
                          className="w-12 h-12 text-white opacity-80"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setSelectedMedia(null)}
          >
            <div className="max-w-4xl max-h-full w-full">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 z-10 bg-black/50 text-white hover:bg-black/70"
                  onClick={() => setSelectedMedia(null)}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </Button>
                {isImage(selectedMedia) ? (
                  <img
                    src={getMediaUrl(selectedMedia)}
                    alt={selectedMedia.caption || selectedMedia.filename || 'Image'}
                    className="max-w-full max-h-[90vh] mx-auto object-contain"
                    loading="eager"
                  />
                ) : isVideo(selectedMedia) ? (
                  <video
                    src={getMediaUrl(selectedMedia)}
                    controls
                    className="max-w-full max-h-[90vh] mx-auto"
                    preload="auto"
                  >
                    <source src={getMediaUrl(selectedMedia)} type={selectedMedia.mimeType || 'video/mp4'} />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="bg-white p-8 rounded-lg text-center">
                    <p className="mb-4">{selectedMedia.caption || 'Link'}</p>
                    <a
                      href={selectedMedia.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {selectedMedia.url}
                    </a>
                  </div>
                )}
                {selectedMedia.caption && (
                  <div className="mt-4 text-white text-center">
                    <p>{selectedMedia.caption}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

