import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import type { AxiosResponse } from 'axios';
import type { Response } from 'express';
import { HttpClientService } from 'src/_services/http_client_service';
import {
  getLoginAdapter,
  LoginAdapterType,
  type ILoginAdapter,
} from './adapters';

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

  /**
   * Get login adapter by type string
   */
  private getLoginAdapterByType(adapterType: string): ILoginAdapter {
    // Map string to enum
    const typeMap: Record<string, LoginAdapterType> = {
      'xamvn-clone': LoginAdapterType.XAMVN_CLONE,
      'xamvn-com': LoginAdapterType.XAMVN_COM,
    };

    const type = typeMap[adapterType];
    if (!type) {
      // Default to xamvn-clone for backwards compatibility
      console.warn(
        `Unknown login adapter type: ${adapterType}, using default: xamvn-clone`,
      );
      return getLoginAdapter(LoginAdapterType.XAMVN_CLONE);
    }

    return getLoginAdapter(type);
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
    loginAdapterType: string = 'xamvn-clone',
  ): Promise<AxiosResponse> {
    const adapter = this.getLoginAdapterByType(loginAdapterType);
    console.log(`Using login adapter: ${adapter.getName()}`);
    return adapter.login(username, password, this.axiosInstance, siteUrl || '', res);
  }

  public async loginWithCookie(
    res?: Response,
    siteUrl?: string,
  ): Promise<AxiosResponse> {
    const cookiePath = path.resolve('./cookies.json');
    if (!fs.existsSync(cookiePath)) {
      throw new Error('cookies.json not found');
    }

    const cookies = JSON.parse(fs.readFileSync(cookiePath, 'utf-8'));
    this.axiosInstance.defaults.headers.cookie = cookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join('; ');

    const response = await this.axiosInstance.get('/', {
      baseURL: siteUrl,
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
