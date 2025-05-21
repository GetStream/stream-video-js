import type { AxiosResponse } from 'axios';
import type { APIErrorResponse } from './types';
import type { ConnectionErrorEvent } from '../../gen/coordinator';

export const sleep = (m: number) => new Promise((r) => setTimeout(r, m));

export function isFunction<T>(value: Function | T): value is Function {
  return (
    value &&
    (Object.prototype.toString.call(value) === '[object Function]' ||
      'function' === typeof value ||
      value instanceof Function)
  );
}

/**
 * A map of known error codes.
 */
export const KnownCodes = {
  TOKEN_EXPIRED: 40,
  WS_CLOSED_SUCCESS: 1000,
};

/**
 * retryInterval - A retry interval which increases acc to number of failures
 *
 * @return {number} Duration to wait in milliseconds
 */
export function retryInterval(numberOfFailures: number): number {
  // try to reconnect in 0.25-5 seconds (random to spread out the load from failures)
  const max = Math.min(500 + numberOfFailures * 2000, 5000);
  const min = Math.min(Math.max(250, (numberOfFailures - 1) * 2000), 5000);
  return Math.floor(Math.random() * (max - min) + min);
}

function hex(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i].toString(16).padStart(2, '0');
  }
  return s;
}

// https://tools.ietf.org/html/rfc4122
export function generateUUIDv4() {
  const bytes = getRandomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version
  bytes[8] = (bytes[8] & 0xbf) | 0x80; // variant

  return [
    hex(bytes.subarray(0, 4)),
    hex(bytes.subarray(4, 6)),
    hex(bytes.subarray(6, 8)),
    hex(bytes.subarray(8, 10)),
    hex(bytes.subarray(10, 16)),
  ].join('-');
}

const getRandomValues = (() => {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return crypto.getRandomValues.bind(crypto);
  }
  return function getRandomValuesWithMathRandom(bytes: Uint8Array): void {
    const max = Math.pow(2, (8 * bytes.byteLength) / bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.random() * max;
    }
  };
})();

function getRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  getRandomValues(bytes);
  return bytes;
}

/**
 * listenForConnectionChanges - Adds an event listener fired on browser going online or offline
 */
export function addConnectionEventListeners(cb: (e: Event) => void) {
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('offline', cb);
    window.addEventListener('online', cb);
  }
}

export function removeConnectionEventListeners(cb: (e: Event) => void) {
  if (typeof window !== 'undefined' && window.removeEventListener) {
    window.removeEventListener('offline', cb);
    window.removeEventListener('online', cb);
  }
}

export function isErrorResponse(
  res: AxiosResponse<unknown>,
): res is AxiosResponse<APIErrorResponse> {
  return !res.status || res.status < 200 || 300 <= res.status;
}

// Type guards to check WebSocket error type
export function isCloseEvent(
  res: CloseEvent | ConnectionErrorEvent,
): res is CloseEvent {
  return (res as CloseEvent).code !== undefined;
}
