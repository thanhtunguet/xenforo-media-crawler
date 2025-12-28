import { apiRequest } from './utils';

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


