import { apiRequest } from './utils';
import type { PaginatedResponse, EventLog } from './types';

// Event Logs APIs
export const eventLogsApi = {
  getAll: async (page = 1, limit = 50): Promise<PaginatedResponse<EventLog>> => {
    return apiRequest<PaginatedResponse<EventLog>>(
      `/api/event-logs?page=${page}&limit=${limit}`
    );
  },
};

