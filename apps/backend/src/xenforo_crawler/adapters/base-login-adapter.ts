import type { AxiosInstance, AxiosResponse } from 'axios';
import type { Response } from 'express';
import type { ILoginAdapter } from './login-adapter.interface';

/**
 * Base abstract class for login adapters
 * Provides common utility methods for all adapters
 */
export abstract class BaseLoginAdapter implements ILoginAdapter {
  abstract login(
    username: string,
    password: string,
    axiosInstance: AxiosInstance,
    siteUrl: string,
    expressResponse?: Response,
  ): Promise<AxiosResponse>;

  abstract getName(): string;

  /**
   * Extract CSRF token from HTML response
   * Tries multiple common patterns used in XenForo sites
   */
  protected extractCsrfToken(response: AxiosResponse<string>): string | null {
    // Try to find the token in the HTML meta tag (most common in Xenforo)
    let csrfTokenMatch = response.data.match(
      /<input type="hidden" name="_xfToken" value="([^"]+)" /,
    );
    if (csrfTokenMatch) {
      return csrfTokenMatch[1];
    }

    // Try alternate meta tag format
    csrfTokenMatch = response.data.match(/name="_xfToken" value="([^"]+)"/);
    if (csrfTokenMatch) {
      return csrfTokenMatch[1];
    }

    // Try csrf_token format (older versions)
    csrfTokenMatch = response.data.match(/name="csrf_token" value="([^"]+)"/);
    if (csrfTokenMatch) {
      return csrfTokenMatch[1];
    }

    // Try to find in JS variable
    csrfTokenMatch = response.data.match(/XF\.config\.csrf = '([^']+)'/);
    if (csrfTokenMatch) {
      return csrfTokenMatch[1];
    }

    // Try to find in JSON data
    csrfTokenMatch = response.data.match(/"csrf":"([^"]+)"/);
    if (csrfTokenMatch) {
      return csrfTokenMatch[1];
    }

    return null;
  }

  /**
   * Set cookies from Axios response to Express response
   */
  protected setCookiesFromResponse(
    expressResponse: Response | undefined,
    axiosResponse: AxiosResponse,
  ): void {
    if (!expressResponse) return;

    const cookies = axiosResponse.headers['set-cookie'];
    if (cookies) {
      cookies.forEach((cookie) => {
        const [nameValue] = cookie.split(';');
        const [name, ...valueParts] = nameValue.split('=');
        const value = valueParts.join('=');
        expressResponse.cookie(name.trim(), value);
      });
    }
  }
}
