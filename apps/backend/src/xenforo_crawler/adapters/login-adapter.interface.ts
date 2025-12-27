import type { AxiosInstance, AxiosResponse } from 'axios';
import type { Response } from 'express';

/**
 * Interface for login adapters
 * Each adapter implements site-specific login behavior
 */
export interface ILoginAdapter {
    /**
     * Perform login to the site
     * @param username - Username or email
     * @param password - Password
     * @param axiosInstance - HTTP client instance
     * @param siteUrl - Base URL of the site
     * @param expressResponse - Express response object to set cookies
     * @returns Promise<AxiosResponse>
     */
    login(
        username: string,
        password: string,
        axiosInstance: AxiosInstance,
        siteUrl: string,
        expressResponse?: Response,
    ): Promise<AxiosResponse>;

    /**
     * Get the name of the adapter
     */
    getName(): string;
}
