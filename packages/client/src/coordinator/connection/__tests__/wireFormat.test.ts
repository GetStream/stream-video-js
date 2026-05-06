import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StreamClient } from '../coordinator-client';

vi.mock('../location', () => ({
  getLocationHint: () => Promise.resolve('AMS'),
}));

const buildClient = (
  overrides?: ConstructorParameters<typeof StreamClient>[1],
) => new StreamClient('test-api-key', { browser: true, ...overrides });

const accessPrivate = <T>(c: StreamClient, name: string): T =>
  (c as unknown as Record<string, T>)[name];

describe('wire format parity', () => {
  beforeEach(() => {
    vi.stubEnv('PKG_VERSION', '1.0.0-test');
    vi.stubEnv('CLIENT_BUNDLE', '');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('buildWsUrl()', () => {
    it('encodes api_key, stream-auth-type and X-Stream-Client for a JWT user', () => {
      const client = buildClient();
      client.userID = 'jane';
      client.anonymous = false;
      const url = accessPrivate<() => string>(client, 'buildWsUrl')();
      const parsed = new URL(url);
      expect(parsed.protocol).toBe('wss:');
      expect(parsed.pathname.endsWith('/connect')).toBe(true);
      expect(parsed.searchParams.get('api_key')).toBe('test-api-key');
      expect(parsed.searchParams.get('stream-auth-type')).toBe('jwt');
      expect(parsed.searchParams.get('X-Stream-Client')).toBe(
        client.getUserAgent(),
      );
    });

    it('encodes anonymous when client.anonymous is true', () => {
      const client = buildClient();
      client.anonymous = true;
      const url = accessPrivate<() => string>(client, 'buildWsUrl')();
      const parsed = new URL(url);
      expect(parsed.searchParams.get('stream-auth-type')).toBe('anonymous');
    });
  });

  describe('getUserAgent()', () => {
    it('default: js sdk, env-supplied version, node bundle when CLIENT_BUNDLE is unset', () => {
      const client = new StreamClient('k');
      expect(client.getUserAgent()).toBe(
        'stream-video-js-v1.0.0-test|client_bundle=node',
      );
    });

    it('with extras: app, app_version, os, device_model interleaved before client_bundle', () => {
      const client = new StreamClient('k', {
        browser: true,
        clientAppIdentifier: {
          sdkName: 'react-native',
          sdkVersion: '0.0.42',
          app: 'mobile',
          app_version: '1.2.3',
          os: 'ios',
          device_model: 'iPhone',
        },
      });
      expect(client.getUserAgent()).toBe(
        'stream-video-react-native-v0.0.42|app=mobile|app_version=1.2.3|os=ios|device_model=iPhone|client_bundle=browser',
      );
    });

    it('honors CLIENT_BUNDLE env override', () => {
      vi.stubEnv('CLIENT_BUNDLE', 'browser-esm');
      const client = new StreamClient('k', { browser: true });
      expect(client.getUserAgent()).toBe(
        'stream-video-js-v1.0.0-test|client_bundle=browser-esm',
      );
    });
  });

  describe('buildAuthMessage()', () => {
    it('serializes token + user_details for a fully populated user', () => {
      const client = buildClient();
      client.user = {
        id: 'jane',
        name: 'Jane',
        image: 'jane.png',
        custom: { role: 'host' },
      };
      // Set a token directly via TokenManager state.
      (client.tokenManager as unknown as { token: string }).token =
        'jwt-token-value';
      const json = accessPrivate<() => string>(client, 'buildAuthMessage')();
      const parsed = JSON.parse(json);
      expect(parsed.token).toBe('jwt-token-value');
      expect(parsed.user_details).toEqual({
        id: 'jane',
        name: 'Jane',
        image: 'jane.png',
        custom: { role: 'host' },
      });
    });

    it('omits name/image/custom when not set, but keeps the keys with undefined values', () => {
      const client = buildClient();
      client.user = { id: 'jane' };
      (client.tokenManager as unknown as { token: string }).token =
        'jwt-token-value';
      const json = accessPrivate<() => string>(client, 'buildAuthMessage')();
      // JSON.stringify drops keys with undefined values: confirm the wire
      // payload contains only id under user_details.
      const parsed = JSON.parse(json);
      expect(parsed.user_details).toEqual({ id: 'jane' });
    });

    it('throws when user or token is missing (caught by onOpen in production)', () => {
      const client = buildClient();
      expect(() =>
        accessPrivate<() => string>(client, 'buildAuthMessage')(),
      ).toThrow(/user or token missing/);
    });
  });
});
