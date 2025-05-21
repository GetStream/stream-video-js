import { describe, expect, it } from 'vitest';
import {
  createCoordinatorClient,
  createTokenOrProvider,
  getInstanceKey,
} from '../clientUtils';
import { TokenProvider } from '../../coordinator/connection/types';
import { getSdkInfo, setSdkInfo } from '../client-details';

describe('clientUtils', () => {
  describe('getInstanceKey', () => {
    it('should compute the correct instance key', () => {
      const instanceKey = getInstanceKey('apiKey', { id: 'userId' });
      expect(instanceKey).toBe('apiKey/userId');
    });
  });

  describe('createTokenOrProvider', () => {
    it('createTokenOrProvider should return token if token is provided', () => {
      const token = createTokenOrProvider({ apiKey: 'xyz', token: 'abc' });
      expect(token).toBe('abc');
    });

    it('createTokenOrProvider should return tokenProvider if tokenProvider is provided', () => {
      const tokenProvider = async () => 'abc';
      const token = createTokenOrProvider({ apiKey: 'xyz', tokenProvider });
      expect(token).toBe(tokenProvider);
    });

    it('createTokenOrProvider should return a wrapped tokenProvider if both token and tokenProvider are provided', async () => {
      const incrementalTokenProvider = (start: number): TokenProvider => {
        return async () => `abc-${start++}`;
      };
      const token = createTokenOrProvider({
        apiKey: 'xyz',
        token: 'def',
        tokenProvider: incrementalTokenProvider(0),
      });
      expect(typeof token).toBe('function');
      const tokenProvider = token as TokenProvider;
      expect(await tokenProvider()).toBe('def');
      expect(await tokenProvider()).toBe('abc-0');
      expect(await tokenProvider()).toBe('abc-1');
      expect(await tokenProvider()).toBe('abc-2');
    });
  });

  describe('createCoordinatorClient', () => {
    it('should create a coordinator client', () => {
      const client = createCoordinatorClient('apiKey', {
        timeout: 1000,
        clientAppIdentifier: {
          app: 'vitest',
          app_version: '1.0.0',
          device_model: 'iPhone',
          os: 'iOS 18.4',
        },
      });
      expect(client).toBeDefined();
      expect(client.getUserAgent()).toBe(
        'stream-video-plain_javascript-v0.0.0' +
          '|app=vitest' +
          '|app_version=1.0.0' +
          '|device_model=iPhone' +
          '|os=iOS 18.4' +
          '|client_bundle=node',
      );
      expect(client.logger).toBeDefined();
      expect(client.options.persistUserOnConnectionFailure).toBe(true);
      expect(client.options.timeout).toBe(1000);
    });

    it('should use default x-stream-client header', () => {
      const sdk = getSdkInfo();
      setSdkInfo(undefined);
      const client = createCoordinatorClient('apiKey', {});
      expect(client).toBeDefined();
      expect(client.getUserAgent()).toBe(
        `stream-video-js-v0.0.0|client_bundle=node`,
      );
      setSdkInfo(sdk!);
    });
  });
});
