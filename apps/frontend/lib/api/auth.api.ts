import { apiRequest } from './utils';

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

