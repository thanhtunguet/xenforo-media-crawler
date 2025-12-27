/// <reference lib="dom" />

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface Site {
  id: number;
  name: string | null;
  url: string;
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

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
    totalPages: number;
  };
}

export interface CreateSiteDto {
  name?: string;
  url: string;
}

export interface UpdateSiteDto {
  name?: string;
  url?: string;
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
    return text ? JSON.parse(text) : null;
  }
  return null;
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

// Threads APIs
export const threadsApi = {
  getAll: async (page = 1, limit = 10): Promise<PaginatedResponse<Thread>> => {
    return apiRequest<PaginatedResponse<Thread>>(
      `/api/threads?page=${page}&limit=${limit}`
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
  syncThreadPosts: async (
    siteId: number,
    threadId: number
  ): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(
      `/api/xenforo-crawler/sync-thread-posts?siteId=${siteId}&threadId=${threadId}`,
      {
        method: 'POST',
      }
    );
  },
  downloadThreadMedia: async (
    siteId: number,
    threadId: number,
    mediaTypeId: number = 0
  ): Promise<{ message: string; mediaType: string; authenticated: boolean }> => {
    return apiRequest<{
      message: string;
      mediaType: string;
      authenticated: boolean;
    }>(
      `/api/xenforo-crawler/download-thread-media?siteId=${siteId}&threadId=${threadId}&mediaTypeId=${mediaTypeId}`,
      {
        method: 'POST',
      }
    );
  },
};

