import { apiRequest } from './utils';
import type { Forum, JobResponse } from '@xenforo-media-crawler/contracts';

// Site Sync APIs
export const siteSyncApi = {
  syncForums: async (siteId: number): Promise<Forum[]> => {
    return apiRequest<Forum[]>(`/api/sites/${siteId}/sync`, {
      method: 'POST',
    });
  },
  syncAllForumsAndThreads: async (siteId: number): Promise<JobResponse> => {
    return apiRequest<JobResponse>(`/api/sites/${siteId}/sync/threads`, {
      method: 'POST',
    });
  },
  syncForumThreads: async (
    siteId: number,
    forumId: number
  ): Promise<JobResponse> => {
    return apiRequest<JobResponse>(`/api/sites/${siteId}/forums/${forumId}/sync`, {
      method: 'POST',
    });
  },
};

