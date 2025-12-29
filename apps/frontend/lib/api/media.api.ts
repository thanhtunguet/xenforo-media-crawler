import { apiRequest } from './utils';
import type {
  Media,
  MediaFilters,
  MediaStatsDto,
  MediaWithThread,
  PaginatedResponse,
} from '@xenforo-media-crawler/contracts';

// Media APIs
export const mediaApi = {
  getThreadMedia: async (
    threadId: number,
    mediaTypeId?: number,
  ): Promise<Media[]> => {
    const query =
      mediaTypeId !== undefined ? `?mediaTypeId=${mediaTypeId}` : '';
    return apiRequest<Media[]>(`/api/media/thread/${threadId}${query}`);
  },
  getAll: async (
    page = 1,
    limit = 24,
    filters?: MediaFilters,
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
      `/api/media?${params.toString()}`,
    );
  },
  getStats: async (): Promise<MediaStatsDto> => {
    return apiRequest<MediaStatsDto>('/api/media/stats');
  },
  getCount: async (mediaTypeId?: number): Promise<{ count: number }> => {
    const query =
      mediaTypeId !== undefined ? `?mediaTypeId=${mediaTypeId}` : '';
    return apiRequest<{ count: number }>(`/api/media/count${query}`);
  },
};
