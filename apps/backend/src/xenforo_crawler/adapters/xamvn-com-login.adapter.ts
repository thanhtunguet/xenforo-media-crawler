import type { AxiosInstance, AxiosResponse } from 'axios';
import type { Response } from 'express';
import { BaseLoginAdapter } from './base-login-adapter';

/**
 * Login adapter for xamvn.com
 * Implements the specific login flow for xamvn.com site
 */
export class XamVNComLoginAdapter extends BaseLoginAdapter {
    getName(): string {
        return 'XamVNComLoginAdapter';
    }

    async login(
        username: string,
        password: string,
        axiosInstance: AxiosInstance,
        siteUrl: string,
        expressResponse?: Response,
    ): Promise<AxiosResponse> {
        // Step 1: Access the homepage to get initial cookies
        const homepageResponse = await axiosInstance.get('/', {
            baseURL: siteUrl,
        });

        this.setCookiesFromResponse(expressResponse, homepageResponse);

        // Step 2: Get the login page to retrieve CSRF token
        const loginPageResponse = await axiosInstance.get('/login/', {
            baseURL: siteUrl,
        });

        this.setCookiesFromResponse(expressResponse, loginPageResponse);
        const csrfToken = this.extractCsrfToken(loginPageResponse);

        if (!csrfToken) {
            throw new Error('Failed to extract CSRF token from login page');
        }

        // Step 3: Prepare login payload (xamvn.com uses standard XenForo login)
        const payload = new URLSearchParams({
            _xfToken: csrfToken,
            login: username,
            password,
            remember: '1',
            _xfRedirect: siteUrl,
        }).toString();

        // Step 4: Submit login form
        const loginResponse = await axiosInstance.post('/login/login', payload, {
            baseURL: siteUrl,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest',
                Origin: siteUrl,
                Referer: `${siteUrl}/login/`,
            },
            maxRedirects: 0,
            validateStatus: (status) => status === 303 || status === 200,
        });

        // Step 5: Save cookies from login response
        this.setCookiesFromResponse(expressResponse, loginResponse);

        // Step 6: Follow redirect if needed to complete login
        if (loginResponse.status === 303) {
            const redirectUrl = loginResponse.headers['location'];
            if (redirectUrl) {
                const finalResponse = await axiosInstance.get(redirectUrl, {
                    baseURL: siteUrl,
                });
                this.setCookiesFromResponse(expressResponse, finalResponse);
                return finalResponse;
            }
        }

        return loginResponse;
    }
}
