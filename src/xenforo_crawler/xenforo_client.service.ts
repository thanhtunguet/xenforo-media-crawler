import { Injectable } from '@nestjs/common';
import type { AxiosResponse } from 'axios';
import type { Response } from 'express';
import { HttpClientService } from 'src/_services/http_client_service';

@Injectable()
export class XenforoClientService extends HttpClientService {
  constructor() {
    super({
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
      browserLike: true,
    });
  }

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

  public async login(
    username: string,
    password: string,
    res?: Response,
    siteUrl?: string,
  ): Promise<AxiosResponse> {
    const loginPageResponse = await this.axiosInstance.get('/login/', {
      baseURL: siteUrl,
    });
    this.setCookiesFromResponse(res, loginPageResponse);
    const csrfToken = this.extractCsrfToken(loginPageResponse);
    const payload = new URLSearchParams({
      _xfToken: csrfToken,
      login: username,
      password,

      remember: '1',
      _xfRedirect: siteUrl,
    }).toString();
    const response = await this.axiosInstance.post('/login/login', payload, {
      baseURL: siteUrl,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
        Origin: siteUrl,
        Referer: `${siteUrl}/login/`,
      },
      maxRedirects: 0,
      validateStatus: (status) => status === 303,
    });
    this.setCookiesFromResponse(res, response);
    return response;
  }

  setCookiesFromResponse(expressResponse: Response, response: AxiosResponse) {
    const cookies = response.headers['set-cookie'];
    if (cookies) {
      cookies.forEach((cookie) => {
        expressResponse.cookie(cookie.split('=')[0], cookie.split('=')[1]);
      });
    }
  }
}
