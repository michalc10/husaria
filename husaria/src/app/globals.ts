// src/app/globals.ts
interface HusariaRuntimeConfig {
  apiBaseUrl?: string;
}

declare global {
  interface Window {
    __HUSARIA_CONFIG__?: HusariaRuntimeConfig;
  }
}

const trimTrailingSlash = (value: string): string => value.trim().replace(/\/+$/, '');

const runtimeApiBaseUrl = window.__HUSARIA_CONFIG__?.apiBaseUrl;

export const API_BASE_URL = trimTrailingSlash(runtimeApiBaseUrl || 'http://localhost:3000');
export const sep = '/';

export const API_ROUTE_PREFIXES = [
  '/auth',
  '/judge-station',
  '/sync',
  '/user',
  '/player',
  '/banner',
  '/league',
  '/tournament',
  '/competition-template',
  '/battle',
  '/playerPoints',
  '/ping'
];

export const isApiUrl = (url: string): boolean => {
  if (API_BASE_URL && url.startsWith(API_BASE_URL)) {
    return true;
  }

  try {
    const parsed = new URL(url, window.location.origin);

    if (parsed.origin !== window.location.origin) {
      return false;
    }

    return API_ROUTE_PREFIXES.some(prefix => parsed.pathname === prefix || parsed.pathname.startsWith(`${prefix}/`));
  } catch {
    return API_ROUTE_PREFIXES.some(prefix => url === prefix || url.startsWith(`${prefix}/`));
  }
};
