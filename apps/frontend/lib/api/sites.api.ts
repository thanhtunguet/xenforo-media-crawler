import { apiRequest } from './utils';
import type { Site, CreateSiteDto, UpdateSiteDto, PaginatedResponse, Forum } from './types';

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

