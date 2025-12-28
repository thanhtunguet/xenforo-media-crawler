/// <reference lib="dom" />

// In development, use relative URLs (proxied through Next.js)
// In production, use the configured API URL or relative URLs
const API_BASE_URL = 
  process.env.NODE_ENV === 'development' 
    ? '' // Use relative URLs - Next.js will proxy /api to backend
    : (process.env.NEXT_PUBLIC_API_URL || '');

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
  sortBy?: 'createdAt' | 'updatedAt' | 'filename';
  sortOrder?: 'ASC' | 'DESC';
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

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Merge headers properly
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers[key] = value as string;
      });
    } else {
      Object.entries(options.headers).forEach(([key, value]) => {
        headers[key] = value as string;
      });
    }
  }
  
  const { headers: _, ...restOptions } = options;
  
  const fetchOptions: RequestInit = {
    ...restOptions,
    credentials: 'include',
    headers: headers as HeadersInit,
  };
  
  // Use global fetch (available in Next.js)
  const response: Response = await fetch(url, fetchOptions);

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorText = await response.text();
      if (errorText) {
        errorMessage = errorText;
      }
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const text = await response.text();
    return text ? JSON.parse(text) : null as T;
  }
  return null as T;
}

// Authentication APIs
export const authApi = {
  login: async (username: string, password: string, siteId: number) => {
    return apiRequest<any>('/api/xenforo-crawler/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, siteId }),
    });
  },
  loginWithCookie: async (siteId: number) => {
    return apiRequest<any>(`/api/xenforo-crawler/login-with-cookie?siteId=${siteId}`, {
      method: 'POST',
    });
  },
};

// Sites APIs
export const sitesApi = {
  getAll: async (page = 1, limit = 10): Promise<PaginatedResponse<Site>> => {
    return apiRequest<PaginatedResponse<Site>>(
      `/api/sites?page=${page}&limit=${limit}`
    );
  },
  getById: async (id: number): Promise<Site> => {
    return apiRequest<Site>(`/api/sites/${id}`);
  },
  create: async (data: CreateSiteDto): Promise<Site> => {
    return apiRequest<Site>('/api/sites', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id: number, data: UpdateSiteDto): Promise<Site> => {
    return apiRequest<Site>(`/api/sites/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  delete: async (id: number): Promise<void> => {
    return apiRequest<void>(`/api/sites/${id}`, {
      method: 'DELETE',
    });
  },
  getForums: async (
    siteId: number,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<Forum>> => {
    return apiRequest<PaginatedResponse<Forum>>(
      `/api/sites/${siteId}/forums?page=${page}&limit=${limit}`
    );
  },
};

// Site Sync APIs
export const siteSyncApi = {
  syncForums: async (siteId: number): Promise<Forum[]> => {
    return apiRequest<Forum[]>(`/api/sites/${siteId}/sync`, {
      method: 'POST',
    });
  },
  syncAllForumsAndThreads: async (siteId: number): Promise<string> => {
    return apiRequest<string>(`/api/sites/${siteId}/sync/threads`, {
      method: 'POST',
    });
  },
  syncForumThreads: async (
    siteId: number,
    forumId: number
  ): Promise<string> => {
    return apiRequest<string>(`/api/sites/${siteId}/forums/${forumId}/sync`, {
      method: 'POST',
    });
  },
};

// Event Logs APIs
export const eventLogsApi = {
  getAll: async (page = 1, limit = 50): Promise<PaginatedResponse<EventLog>> => {
    return apiRequest<PaginatedResponse<EventLog>>(
      `/api/event-logs?page=${page}&limit=${limit}`
    );
  },
};

// Threads APIs
export const threadsApi = {
  getAll: async (page = 1, limit = 10, forumId?: number): Promise<PaginatedResponse<Thread>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (forumId !== undefined) {
      params.append('forumId', forumId.toString());
    }
    return apiRequest<PaginatedResponse<Thread>>(
      `/api/threads?${params.toString()}`
    );
  },
  getById: async (id: number): Promise<Thread> => {
    return apiRequest<Thread>(`/api/threads/${id}`);
  },
  searchByOriginalId: async (originalId: string): Promise<Thread> => {
    return apiRequest<Thread>(
      `/api/threads/search/original-id?originalId=${encodeURIComponent(originalId)}`
    );
  },
  getPosts: async (
    threadId: number,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<Post>> => {
    return apiRequest<PaginatedResponse<Post>>(
      `/api/threads/${threadId}/posts?page=${page}&limit=${limit}`
    );
  },
};

// Xenforo Crawler APIs
export const crawlerApi = {
  getLoginAdapters: async (): Promise<LoginAdapter[]> => {
    const response = await apiRequest<LoginAdaptersResponse>('/api/xenforo-crawler/login-adapters');
    return response.adapters;
  },
  syncThreadPosts: async (
    threadId: number
  ): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(
      `/api/xenforo-crawler/sync-thread-posts?threadId=${threadId}`,
      {
        method: 'POST',
      }
    );
  },
  downloadThreadMedia: async (
    threadId: number,
    mediaTypeId: number = 0
  ): Promise<{ message: string; mediaType: string; authenticated: boolean }> => {
    return apiRequest<{
      message: string;
      mediaType: string;
      authenticated: boolean;
    }>(
      `/api/xenforo-crawler/download-thread-media?threadId=${threadId}&mediaTypeId=${mediaTypeId}`,
      {
        method: 'POST',
      }
    );
  },
};

// Media APIs
export const mediaApi = {
  getThreadMedia: async (
    threadId: number,
    mediaTypeId?: number
  ): Promise<Media[]> => {
    const query = mediaTypeId !== undefined ? `?mediaTypeId=${mediaTypeId}` : '';
    return apiRequest<Media[]>(`/api/media/thread/${threadId}${query}`);
  },
  getAll: async (
    page: number = 1,
    limit: number = 24,
    filters?: MediaFilters
  ): Promise<PaginatedResponse<MediaWithThread>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters) {
      if (filters.mediaTypeId !== undefined) {
        params.append('mediaTypeId', filters.mediaTypeId.toString());
      }
      if (filters.isDownloaded !== undefined) {
        params.append('isDownloaded', filters.isDownloaded.toString());
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.sortBy) {
        params.append('sortBy', filters.sortBy);
      }
      if (filters.sortOrder) {
        params.append('sortOrder', filters.sortOrder);
      }
    }

    return apiRequest<PaginatedResponse<MediaWithThread>>(
      `/api/media?${params.toString()}`
    );
  },
  getStats: async (): Promise<MediaStatsDto> => {
    return apiRequest<MediaStatsDto>('/api/media/stats');
  },
  getCount: async (mediaTypeId?: number): Promise<{ count: number }> => {
    const query = mediaTypeId !== undefined ? `?mediaTypeId=${mediaTypeId}` : '';
    return apiRequest<{ count: number }>(`/api/media/count${query}`);
  },
};

// System APIs
export const systemApi = {
  getStatus: async (): Promise<{
    status: string;
    version: string;
    uptime: number;
    timestamp: string;
  }> => {
    return apiRequest('/api/status');
  },
};

