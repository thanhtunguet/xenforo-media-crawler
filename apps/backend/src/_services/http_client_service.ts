import { faker } from '@faker-js/faker';
import {
  type AxiosError,
  type AxiosInstance,
  AxiosRequestConfig,
  type AxiosRequestHeaders,
  AxiosResponse,
  type CreateAxiosDefaults,
} from 'axios';
import { createAxiosWithCookieSupport } from './axios_cookie_adapter';

export interface HttpClientConfig extends AxiosRequestConfig {
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  retry?: number;
  browserLike?: boolean;
}

export abstract class HttpClientService {
  protected axiosInstance: AxiosInstance;
  protected maxRetries: number;
  protected retryDelay: number;

  constructor(config: HttpClientConfig = {}) {
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
    const browserLike = config.browserLike ?? true;

    const createConfig: CreateAxiosDefaults = {
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      withCredentials: true,
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'max-age=0',
        Connection: 'keep-alive',
        'Sec-Fetch-Dest': browserLike ? 'document' : undefined,
        'Sec-Fetch-Mode': browserLike ? 'navigate' : undefined,
        'Sec-Fetch-Site': browserLike ? 'none' : undefined,
        'Sec-Fetch-User': browserLike ? '?1' : undefined,
        'Upgrade-Insecure-Requests': browserLike ? '1' : undefined,
      },
    };

    // Create axios instance with cookie jar support
    this.axiosInstance = createAxiosWithCookieSupport(createConfig);

    // Add request interceptor to set random user agent
    this.axiosInstance.interceptors.request.use((config) => {
      if (!config.headers) {
        config.headers = {} as AxiosRequestHeaders;
      }
      config.headers['User-Agent'] = this.generateRandomUserAgent();
      return config;
    });

    // Add response interceptor for retry mechanism
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config: HttpClientConfig = error.config;

        // Initialize retry count if not exists
        if (!config || config.retry === undefined) {
          if (config) config.retry = 0;
          else return Promise.reject(error);
        }

        // Check if we should retry
        if (config.retry < this.maxRetries) {
          config.retry += 1;

          // Exponential backoff with jitter
          const delay =
            this.retryDelay * Math.pow(2, config.retry - 1) +
            Math.random() * 100;

          // Wait for the specified delay
          await new Promise((resolve) => setTimeout(resolve, delay));

          // Retry the request
          return this.axiosInstance(config);
        }

        return Promise.reject(error);
      },
    );
  }

  /**
   * Make GET request
   */
  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.get<T>(url, config);
  }

  /**
   * Make POST request
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post<T>(url, data, config);
  }

  /**
   * Make PUT request
   */
  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.put<T>(url, data, config);
  }

  /**
   * Make DELETE request
   */
  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.delete<T>(url, config);
  }

  /**
   * Get the underlying axios instance
   */
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  /**
   * Update base URL
   */
  setBaseURL(baseURL: string): void {
    this.axiosInstance.defaults.baseURL = baseURL;
  }

  /**
   * Enable or disable credentials (cookies)
   */
  setWithCredentials(withCredentials: boolean): void {
    this.axiosInstance.defaults.withCredentials = withCredentials;
  }

  /**
   * Set retry options
   */
  setRetryOptions(maxRetries: number, retryDelay: number = 1000): void {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  /**
   * Generates a random user agent string using faker
   * With enhanced browser-like user agents
   */
  private generateRandomUserAgent(): string {
    // Using more common modern browser user agents for better crawling results
    const browserTypes = [
      // Chrome on Windows
      () => faker.internet.userAgent(),
      // Chrome on Mac
      () =>
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      // Firefox on Windows
      () =>
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/117.0',
      // Safari on Mac
      () =>
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15',
      // Edge on Windows
      () =>
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    ];

    const randomBrowserGen =
      browserTypes[Math.floor(Math.random() * browserTypes.length)];
    return randomBrowserGen();
  }
}
