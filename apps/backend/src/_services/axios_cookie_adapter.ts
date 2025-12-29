import axios, {
  AxiosInstance,
  type AxiosRequestHeaders,
  AxiosResponse,
  type CreateAxiosDefaults,
} from 'axios';
import { URL } from 'url';

interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
}

/**
 * Simple cookie store to manage cookies
 */
class CookieStore {
  private cookies: Cookie[] = [];

  /**
   * Add a cookie to the store
   */
  addCookie(cookie: Cookie): void {
    // Replace existing cookie if it has the same name, domain and path
    const index = this.cookies.findIndex(
      (c) =>
        c.name === cookie.name &&
        c.domain === cookie.domain &&
        c.path === cookie.path,
    );

    if (index !== -1) {
      this.cookies[index] = cookie;
    } else {
      this.cookies.push(cookie);
    }

    // Clean expired cookies
    this.cleanExpiredCookies();
  }

  /**
   * Get cookies applicable for a URL
   */
  getCookiesForUrl(url: URL): Cookie[] {
    this.cleanExpiredCookies();

    return this.cookies.filter((cookie) => {
      // Check domain match (including subdomains)
      const domainMatch = cookie.domain.startsWith('.')
        ? url.hostname.endsWith(cookie.domain.slice(1)) ||
          url.hostname === cookie.domain.slice(1)
        : url.hostname === cookie.domain;

      // Check path match
      const pathMatch = url.pathname.startsWith(cookie.path);

      // Check if secure cookie matches https protocol
      const secureMatch = !cookie.secure || url.protocol === 'https:';

      return domainMatch && pathMatch && secureMatch;
    });
  }

  /**
   * Clear all cookies
   */
  clear(): void {
    this.cookies = [];
  }

  /**
   * Remove expired cookies
   */
  private cleanExpiredCookies(): void {
    const now = new Date();
    this.cookies = this.cookies.filter(
      (cookie) => !cookie.expires || cookie.expires > now,
    );
  }
}

/**
 * Parse Set-Cookie header and extract cookie information
 */
function parseSetCookieHeader(header: string, requestUrl: URL): Cookie | null {
  const parts = header.split(';').map((part) => part.trim());
  const [nameValue, ...attributes] = parts;

  const nameValueMatch = nameValue.match(/^([^=]+)=(.*)$/);
  if (!nameValueMatch) return null;

  const name = nameValueMatch[1];
  const value = nameValueMatch[2];

  const cookie: Cookie = {
    name,
    value,
    domain: requestUrl.hostname,
    path: '/',
  };

  attributes.forEach((attr) => {
    const [key, val] = attr.split('=').map((s) => s.trim());
    const lowerKey = key.toLowerCase();

    if (lowerKey === 'expires') {
      cookie.expires = new Date(val);
    } else if (lowerKey === 'max-age') {
      const seconds = parseInt(val, 10);
      if (!isNaN(seconds)) {
        cookie.expires = new Date(Date.now() + seconds * 1000);
      }
    } else if (lowerKey === 'domain' && val) {
      cookie.domain = val.startsWith('.') ? val : `.${val}`;
    } else if (lowerKey === 'path' && val) {
      cookie.path = val;
    } else if (lowerKey === 'secure') {
      cookie.secure = true;
    } else if (lowerKey === 'httponly') {
      cookie.httpOnly = true;
    }
  });

  return cookie;
}

/**
 * Format cookies into a string for the Cookie header
 */
function formatCookieHeader(cookies: Cookie[]): string {
  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
}

/**
 * Creates an axios instance with custom cookie handling
 */
export function createAxiosWithCookieSupport(
  config: CreateAxiosDefaults,
): AxiosInstance {
  const cookieStore = new CookieStore();
  const instance = axios.create(config);

  // Request interceptor to add cookies to requests
  instance.interceptors.request.use((config) => {
    const url = new URL(config.url || '', config.baseURL || 'http://localhost');
    const cookies = cookieStore.getCookiesForUrl(url);

    if (cookies.length > 0) {
      config.headers = config.headers || ({} as AxiosRequestHeaders);
      config.headers.Cookie = formatCookieHeader(cookies);
    }

    return config;
  });

  // Response interceptor to store cookies from responses
  instance.interceptors.response.use((response: AxiosResponse) => {
    const requestUrl = new URL(
      response.config.url || '',
      response.config.baseURL || 'http://localhost',
    );

    const setCookieHeaders = response.headers['set-cookie'];
    if (setCookieHeaders) {
      if (Array.isArray(setCookieHeaders)) {
        setCookieHeaders.forEach((header) => {
          const cookie = parseSetCookieHeader(header, requestUrl);
          if (cookie) {
            cookieStore.addCookie(cookie);
          }
        });
      } else {
        const cookie = parseSetCookieHeader(setCookieHeaders, requestUrl);
        if (cookie) {
          cookieStore.addCookie(cookie);
        }
      }
    }

    return response;
  });

  // Add method to clear cookies
  (instance as any).clearCookies = () => {
    cookieStore.clear();
  };

  return instance;
}

/**
 * Creates a standard axios instance without cookie handling
 * This is provided for comparison purposes
 */
export function createStandardAxios(): AxiosInstance {
  return axios.create();
}
