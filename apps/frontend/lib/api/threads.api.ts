import { apiRequest } from './utils';
import type { PaginatedResponse, Thread, Post } from '@xenforo-media-crawler/contracts';

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

