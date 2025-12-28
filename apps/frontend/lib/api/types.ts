import { JobStatus, MediaSortBy, SortOrder } from '../enums';

export interface Site {
  id: number;
  name: string | null;
  url: string;
  loginAdapter?: string;
  forumCount?: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Forum {
  id?: number;
  siteId: number;
  name: string | null;
  originalId: string | null;
  originalUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Thread {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  originalId?: string | null;
}

export interface Post {
  id: number;
  threadId: number;
  content: string;
  createdAt: string;
}

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

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
    totalPages: number;
  };
}

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

export interface LoginAdapter {
  key: string;
  name: string;
  description: string;
}

export interface LoginAdaptersResponse {
  adapters: LoginAdapter[];
}

export interface JobResponse {
  jobId: number;
  message: string;
}

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

