import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  GlassCardFooter,
} from '@/components/ui/glass-card';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Layout } from '@/components/layout';
import { threadsApi, crawlerApi, Post, Thread, mediaApi, Media } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { JobProgressDialog } from '@/components/JobProgressDialog';
import Link from 'next/link';
import {
  RefreshCw,
  Download,
  Image as ImageIcon,
  FileText,
  ArrowLeft,
  Album,
  MessageSquare,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  RotateCcw,
} from 'lucide-react';

export default function ThreadPage() {
  const router = useRouter();
  const { id } = router.query;
  const threadId = id ? Number(id) : null;
  const { addToast } = useToast();

  const [thread, setThread] = useState<Thread | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [syncJobId, setSyncJobId] = useState<number | null>(null);
  const [downloadJobId, setDownloadJobId] = useState<number | null>(null);
  const [showSyncProgress, setShowSyncProgress] = useState(false);
  const [showDownloadProgress, setShowDownloadProgress] = useState(false);
  const [mediaType, setMediaType] = useState('0');
  const [mediaCount, setMediaCount] = useState(0);

  // Image viewer state
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
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
      loadPosts();
      loadMediaCount();
    }
  }, [threadId, page]);

  // Add click handlers to images in post content
  useEffect(() => {
    const handleImageClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        e.preventDefault();
        const imgSrc = (target as HTMLImageElement).src;
        setSelectedImageUrl(imgSrc);
      }
    };

    // Add event listeners to all images in post content
    const postImages = document.querySelectorAll('.post-content img');
    postImages.forEach((img) => {
      img.addEventListener('click', handleImageClick);
      img.classList.add('cursor-pointer', 'hover:opacity-80', 'transition-opacity');
    });

    // Cleanup
    return () => {
      postImages.forEach((img) => {
        img.removeEventListener('click', handleImageClick);
      });
    };
  }, [posts]); // Re-run when posts change

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
      setTotalPosts(response.meta.totalItems);
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setPostsLoading(false);
    }
  };

  const loadMediaCount = async () => {
    if (!threadId) return;
    try {
      const media = await mediaApi.getThreadMedia(threadId);
      setMediaCount(media.length);
    } catch (err) {
      console.error('Failed to load media count:', err);
    }
  };

  const handleSyncPosts = async () => {
    if (!threadId) {
      addToast('Thread ID is required', 'error');
      return;
    }
    try {
      setSyncing(true);
      const response = await crawlerApi.syncThreadPosts(threadId);
      setSyncJobId(response.jobId);
      setShowSyncProgress(true);
      addToast('Post sync started. This may take a while.', 'success');
    } catch (err: any) {
      console.error('Failed to sync posts:', err);
      addToast(err.message || 'Failed to sync posts', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleDownloadMedia = async () => {
    if (!threadId) {
      addToast('Thread ID is required', 'error');
      return;
    }
    try {
      setDownloading(true);
      const response = await crawlerApi.downloadThreadMedia(
        threadId,
        Number(mediaType)
      );
      setDownloadJobId(response.jobId);
      setShowDownloadProgress(true);
      addToast('Media download started. This may take a while.', 'success');
    } catch (err: any) {
      console.error('Failed to download media:', err);
      addToast(err.message || 'Failed to download media', 'error');
    } finally {
      setDownloading(false);
    }
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

        {/* Thread Info Card */}
        {loading ? (
          <GlassCard>
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
              <span className="ml-2 text-white/60">Loading thread...</span>
            </div>
          </GlassCard>
        ) : thread ? (
          <>
            <GlassCard variant="hover-glow">
              <GlassCardHeader>
                <GlassCardTitle className="gradient-text text-3xl">
                  {thread.title}
                </GlassCardTitle>
                <GlassCardDescription>
                  Created: {new Date(thread.createdAt).toLocaleString()} • Updated:{' '}
                  {new Date(thread.updatedAt).toLocaleString()}
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                <div
                  className="prose prose-invert max-w-none text-white/80"
                  dangerouslySetInnerHTML={{ __html: thread.content }}
                />
              </GlassCardContent>
            </GlassCard>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassCard variant="bordered" className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{totalPosts}</div>
                    <div className="text-sm text-white/60">Total Posts</div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard variant="bordered" className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{mediaCount}</div>
                    <div className="text-sm text-white/60">Media Items</div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </>
        ) : (
          <GlassCard>
            <div className="text-center py-12 text-white/60">Thread not found</div>
          </GlassCard>
        )}

        {/* Actions Card */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Thread Actions</GlassCardTitle>
            <GlassCardDescription>
              Sync posts and download media from this thread
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button
                variant="glass-primary"
                onClick={handleSyncPosts}
                disabled={syncing}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing Posts...' : 'Sync Posts'}
              </Button>

              <Link href={`/threads/${threadId}/album`}>
                <Button variant="glass" className="gap-2">
                  <Album className="h-4 w-4" />
                  View Album
                </Button>
              </Link>

              <div className="flex items-end gap-2 ml-auto">
                <div className="space-y-2">
                  <Label htmlFor="media-type" className="text-white/80 text-xs">
                    Media Type
                  </Label>
                  <Select
                    id="media-type"
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value)}
                    className="glass-input"
                  >
                    <option value="0">All</option>
                    <option value="1">Images</option>
                    <option value="2">Videos</option>
                    <option value="3">Links</option>
                  </Select>
                </div>
                <Button
                  variant="glass"
                  onClick={handleDownloadMedia}
                  disabled={downloading}
                  className="gap-2"
                >
                  <Download className={`h-4 w-4 ${downloading ? 'animate-spin' : ''}`} />
                  {downloading ? 'Downloading...' : 'Download Media'}
                </Button>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Posts Section */}
        <GlassCard>
          <GlassCardHeader>
            <div className="flex items-center justify-between">
              <div>
                <GlassCardTitle>Posts</GlassCardTitle>
                <GlassCardDescription>
                  {totalPosts} post{totalPosts !== 1 ? 's' : ''} in this thread
                </GlassCardDescription>
              </div>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            {postsLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
                <span className="ml-2 text-white/60">Loading posts...</span>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/60">No posts found</p>
                <p className="text-white/40 text-sm mt-1">
                  Try syncing posts from a site
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post, index) => (
                  <div
                    key={post.id}
                    className="glass-card p-4 hover:shadow-glow transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-sm">
                          {(page - 1) * 10 + index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="prose prose-invert prose-sm max-w-none text-white/80 post-content"
                          dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                        <div className="mt-3 text-xs text-white/40">
                          Posted: {new Date(post.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
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
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Image Viewer Modal */}
      {selectedImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md animate-fade-in"
          onClick={() => {
            // Prevent dismissal when zoomed in
            if (imageZoom > 1) {
              return;
            }
            setSelectedImageUrl(null);
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
              {/* Close Button */}
              <Button
                variant="glass"
                size="icon"
                className="absolute top-4 right-4 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageUrl(null);
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

              {/* Download Button */}
              <a
                href={selectedImageUrl}
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

              {/* Image Controls */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                <Button
                  variant="glass"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newZoom = Math.min(imageZoom + 0.25, 5);
                    setImageZoom(newZoom);
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

              {/* Image Display */}
              <div
                className="h-full w-full overflow-hidden flex items-center justify-center"
                onMouseDown={(e) => {
                  if (imageZoom > 1 && imageRef) {
                    e.stopPropagation();
                    setIsDragging(true);
                    const container = e.currentTarget;
                    const containerRect = container.getBoundingClientRect();
                    const containerCenterX = containerRect.left + containerRect.width / 2;
                    const containerCenterY = containerRect.top + containerRect.height / 2;
                    const clickX = e.clientX - containerCenterX;
                    const clickY = e.clientY - containerCenterY;
                    const imagePixelX = (clickX - imagePan.x) / imageZoom;
                    const imagePixelY = (clickY - imagePan.y) / imageZoom;
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
                    const newScreenX = e.clientX;
                    const newScreenY = e.clientY;
                    const newScreenPosX = newScreenX - (dragStart.containerCenterX || 0);
                    const newScreenPosY = newScreenY - (dragStart.containerCenterY || 0);
                    const newPanX = newScreenPosX - dragStart.x * imageZoom;
                    const newPanY = newScreenPosY - dragStart.y * imageZoom;
                    setImagePan({ x: newPanX, y: newPanY });
                  }
                }}
                onMouseUp={() => {
                  setIsDragging(false);
                }}
                onMouseLeave={() => {
                  setIsDragging(false);
                }}
              >
                <img
                  ref={setImageRef}
                  src={selectedImageUrl}
                  alt="Post image"
                  className={`max-w-full max-h-full mx-auto object-contain rounded-lg shadow-glow-lg transition-transform duration-200 ${
                    isDragging ? 'cursor-grabbing' : imageZoom > 1 ? 'cursor-grab' : ''
                  }`}
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
                      setImageZoom(2);
                    } else {
                      setImageZoom(1);
                      setImagePan({ x: 0, y: 0 });
                    }
                  }}
                  draggable={false}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <JobProgressDialog
        jobId={syncJobId}
        isOpen={showSyncProgress}
        onClose={() => {
          setShowSyncProgress(false);
          setSyncJobId(null);
          loadPosts();
          loadMediaCount();
        }}
        title="Syncing Thread Posts"
      />

      <JobProgressDialog
        jobId={downloadJobId}
        isOpen={showDownloadProgress}
        onClose={() => {
          setShowDownloadProgress(false);
          setDownloadJobId(null);
          loadMediaCount();
        }}
        title="Downloading Media"
      />
    </Layout>
  );
}
