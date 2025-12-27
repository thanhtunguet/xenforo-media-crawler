import type { AxiosInstance, AxiosResponse } from 'axios';
import type { Response } from 'express';
import { BaseLoginAdapter } from './base-login-adapter';

/**
 * Login adapter for XamVN Clone sites (original implementation)
 * This is the default adapter that works with standard XenForo installations
 */
export class XamvnCloneLoginAdapter extends BaseLoginAdapter {
    getName(): string {
        return 'XamvnCloneLoginAdapter';
    }

    async login(
        username: string,
        password: string,
        axiosInstance: AxiosInstance,
        siteUrl: string,
        expressResponse?: Response,
    ): Promise<AxiosResponse> {
        // Step 1: Get the login page to retrieve CSRF token
        const loginPageResponse = await axiosInstance.get('/login/', {
            baseURL: siteUrl,
        });

        this.setCookiesFromResponse(expressResponse, loginPageResponse);
        const csrfToken = this.extractCsrfToken(loginPageResponse);

        // Step 2: Prepare login payload
        const payload = new URLSearchParams({
            _xfToken: csrfToken || '',
            login: username,
            password,
            remember: '1',
            _xfRedirect: siteUrl,
        }).toString();

        // Step 3: Submit login form
        const response = await axiosInstance.post('/login/login', payload, {
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

        // Step 4: Save cookies from login response
        this.setCookiesFromResponse(expressResponse, response);

        return response;
    }
}
