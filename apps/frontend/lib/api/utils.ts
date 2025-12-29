/// <reference lib="dom" />

// In development, use relative URLs (proxied through Next.js)
// In production, use the configured API URL or relative URLs
const API_BASE_URL =
  process.env.NODE_ENV === 'development'
    ? '' // Use relative URLs - Next.js will proxy /api to backend
    : process.env.NEXT_PUBLIC_API_URL || '';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
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
    return text ? JSON.parse(text) : (null as T);
  }
  return null as T;
}
