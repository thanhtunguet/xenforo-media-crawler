import { apiRequest } from './utils';
import { type Job, JobStatus } from '@xenforo-media-crawler/contracts';

// Jobs APIs
export const jobsApi = {
  getAll: async (limit?: number, status?: JobStatus): Promise<Job[]> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (status) params.append('status', status.toString());
    const query = params.toString();
    return apiRequest<Job[]>(`/api/jobs${query ? `?${query}` : ''}`);
  },
  getById: async (id: number): Promise<Job> => {
    return apiRequest<Job>(`/api/jobs/${id}`);
  },
  start: async (id: number): Promise<Job> => {
    return apiRequest<Job>(`/api/jobs/${id}/start`, {
      method: 'POST',
    });
  },
  pause: async (id: number): Promise<Job> => {
    return apiRequest<Job>(`/api/jobs/${id}/pause`, {
      method: 'PATCH',
    });
  },
  resume: async (id: number): Promise<Job> => {
    return apiRequest<Job>(`/api/jobs/${id}/resume`, {
      method: 'PATCH',
    });
  },
  cancel: async (id: number): Promise<Job> => {
    return apiRequest<Job>(`/api/jobs/${id}/cancel`, {
      method: 'PATCH',
    });
  },
};
