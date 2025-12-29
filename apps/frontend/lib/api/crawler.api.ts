import { apiRequest } from './utils';
import type {
  JobResponse,
  LoginAdapter,
  LoginAdaptersResponse,
} from '@xenforo-media-crawler/contracts'; // Xenforo Crawler APIs

// Xenforo Crawler APIs
export const crawlerApi = {
  getLoginAdapters: async (): Promise<LoginAdapter[]> => {
    const response = await apiRequest<LoginAdaptersResponse>(
      '/api/xenforo-crawler/login-adapters',
    );
    return response.adapters;
  },
  syncThreadPosts: async (threadId: number): Promise<JobResponse> => {
    return apiRequest<JobResponse>(
      `/api/xenforo-crawler/sync-thread-posts?threadId=${threadId}`,
      {
        method: 'POST',
      },
    );
  },
  downloadThreadMedia: async (
    threadId: number,
    mediaTypeId = 0,
  ): Promise<JobResponse & { mediaType: string; authenticated: boolean }> => {
    return apiRequest<
      JobResponse & { mediaType: string; authenticated: boolean }
    >(
      `/api/xenforo-crawler/download-thread-media?threadId=${threadId}&mediaTypeId=${mediaTypeId}`,
      {
        method: 'POST',
      },
    );
  },
};
