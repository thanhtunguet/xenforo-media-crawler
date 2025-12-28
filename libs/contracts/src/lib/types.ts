import { JobStatus, MediaSortBy, SortOrder } from './enums';

// Site interfaces
export interface Site {
  id: number;
  name: string | null;
  url: string;
  loginAdapter?: string;
  forumCount?: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateSiteDto {
  name?: string;
  url: string;
  loginAdapter?: string;
}

export interface UpdateSiteDto {
  name?: string;
  url?: string;
  loginAdapter?: string;
}

// Forum interfaces
export interface Forum {
  id?: number;
  siteId: number;
  name: string | null;
  originalId: string | null;
  originalUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

// Thread interfaces
export interface Thread {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  originalId?: string | null;
}

// Post interfaces
export interface Post {
  id: number;
  threadId: number;
  content: string;
  createdAt: string;
}

// Media interfaces
export interface Media {
  id: number;
  postId: number;
  mediaTypeId: number;
  originalId: string | null;
  caption: string | null;
  url: string | null;
  thumbnailUrl: string | null;
  filename: string | null;
  isDownloaded: boolean | null;
  localPath: string | null;
  mimeType: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface MediaWithThread extends Media {
  thread: {
    id: number;
    title: string;
    originalId: string | null;
  };
}

export interface MediaStatsDto {
  totalMedia: number;
  totalImages: number;
  totalVideos: number;
  totalLinks: number;
  totalDownloaded: number;
  totalNotDownloaded: number;
  downloadRate: number;
}

export interface MediaFilters {
  mediaTypeId?: number;
  isDownloaded?: boolean;
  search?: string;
  sortBy?: MediaSortBy;
  sortOrder?: SortOrder;
}

// Event Log interfaces
export interface EventLog {
  id: number;
  eventType: string;
  entityType: string | null;
  entityId: number | null;
  entityName: string | null;
  description: string | null;
  metadata: Record<string, any> | null;
  createdAt: string | null;
}

// Job interfaces
export interface Job {
  id: number;
  jobType: string;
  status: JobStatus;
  siteId: number | null;
  forumId: number | null;
  threadId: number | null;
  entityName: string | null;
  progress: number;
  totalItems: number | null;
  processedItems: number;
  currentStep: string | null;
  errorMessage: string | null;
  metadata: Record<string, any> | null;
  createdAt: string | null;
  updatedAt: string | null;
  completedAt: string | null;
}

export interface JobResponse {
  jobId: number;
  message: string;
}

export interface JobProgressEvent {
  jobId: number;
  status: JobStatus;
  progress: number;
  totalItems?: number;
  processedItems?: number;
  currentStep?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

// Pagination interfaces
export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
    totalPages: number;
  };
}

// Login Adapter interfaces
export interface LoginAdapter {
  key: string;
  name: string;
  description: string;
}

export interface LoginAdaptersResponse {
  adapters: LoginAdapter[];
}


