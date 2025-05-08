declare module 'axios-cookiejar-support' {
  import {
    AxiosInstance,
    AxiosRequestConfig,
    type CreateAxiosDefaults,
  } from 'axios';
  import { CookieJar } from 'tough-cookie';

  export interface AxiosRequestConfigWithCookieJar extends AxiosRequestConfig {
    jar?: CookieJar;
  }

  export interface AxiosInstanceWithCookieJar extends AxiosInstance {
    defaults: AxiosRequestConfig & {
      jar: CookieJar;
    };
  }

  export function wrapper(instance: AxiosInstance): AxiosInstanceWithCookieJar;

  export interface CreateAxiosDefaultsWithCookieJar
    extends CreateAxiosDefaults {
    jar?: CookieJar;
  }
}
