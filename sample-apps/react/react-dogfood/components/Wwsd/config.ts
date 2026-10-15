import type { JoinLink } from './types';

const BACKEND_URL_KEY = '@pronto/wwsd-backend-url';
const customerLinkKey = (callId: string) =>
  `@pronto/wwsd-customer-link/${callId}`;

const safely = <T>(fn: () => T, fallback: T): T => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

export const normalizeBackendUrl = (url: string) =>
  url.trim().replace(/\/+$/, '');

/**
 * The WWSD backend URL: an explicit override (remembered for next time),
 * else the last one used in this browser, else NEXT_PUBLIC_WWSD_URL.
 */
export const resolveBackendUrl = (override?: string) => {
  if (override) {
    const url = normalizeBackendUrl(override);
    safely(() => localStorage.setItem(BACKEND_URL_KEY, url), undefined);
    return url;
  }
  const stored = safely(() => localStorage.getItem(BACKEND_URL_KEY), null);
  return normalizeBackendUrl(stored || process.env.NEXT_PUBLIC_WWSD_URL || '');
};

export const storeCustomerLink = (callId: string, url: string) =>
  safely(() => sessionStorage.setItem(customerLinkKey(callId), url), undefined);

export const readCustomerLink = (callId: string) =>
  safely(() => sessionStorage.getItem(customerLinkKey(callId)), null);

/**
 * Turns the backend's rep link (pointing at pronto.getstream.io) into a path
 * on this Pronto, keeping the WWSD app's credentials.
 */
export const toLocalJoinPath = (rep: JoinLink, callId: string) => {
  const source = new URL(rep.url);
  const params = new URLSearchParams();
  for (const key of ['api_key', 'token', 'type']) {
    const value = source.searchParams.get(key);
    if (value) params.set(key, value);
  }
  params.set('skip_lobby', 'true');
  params.set('camera', 'true');
  params.set('mic', 'true');
  params.set('disable_chat', 'true');
  params.set('wwsd', '1');
  if (rep.name) params.set('name', rep.name);
  return `/join/${encodeURIComponent(callId)}?${params}`;
};
