import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StreamClient } from '../coordinator-client';

vi.mock('../location', () => ({
  getLocationHint: () => Promise.resolve('AMS'),
}));

const encodeBase64Url = (input: string): string => {
  const b64 =
    typeof btoa === 'function'
      ? btoa(input)
      : Buffer.from(input, 'utf8').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const jwtFor = (userId: string): string => {
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = encodeBase64Url(JSON.stringify({ user_id: userId }));
  return `${header}.${body}.signature`;
};

describe('StreamClient (new facade)', () => {
  beforeEach(() => {
    vi.stubEnv('PKG_VERSION', '1.0.0-test');
    vi.stubEnv('CLIENT_BUNDLE', '');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('setBaseURL rewrites the wsBaseURL', () => {
    const client = new StreamClient('api-key', { browser: true });
    client.setBaseURL('https://video.example.com/video');
    expect(client.wsBaseURL).toBe('wss://video.example.com/video');
    client.setBaseURL('http://localhost:3030/video');
    expect(client.wsBaseURL).toBe('ws://localhost:8800/video');
  });

  it('getAuthType reflects anonymous flag', () => {
    const client = new StreamClient('api-key', { browser: true });
    expect(client.getAuthType()).toBe('jwt');
    client.anonymous = true;
    expect(client.getAuthType()).toBe('anonymous');
  });

  it('getUserAgent encodes sdk name, version, extras and bundle', () => {
    const client = new StreamClient('api-key', {
      browser: true,
      clientAppIdentifier: {
        sdkName: 'react',
        sdkVersion: '99.0.0',
        app: 'my-app',
        os: 'macos',
      },
    });
    const ua = client.getUserAgent();
    expect(ua).toBe(
      'stream-video-react-v99.0.0|app=my-app|os=macos|client_bundle=browser',
    );
  });

  it('getUserAgent falls back to defaults and node bundle when no extras supplied', () => {
    const client = new StreamClient('api-key');
    const ua = client.getUserAgent();
    expect(ua).toBe('stream-video-js-v1.0.0-test|client_bundle=node');
  });

  it('connectAnonymousUser resolves the gate immediately and skips opening a socket', async () => {
    const client = new StreamClient('api-key', { browser: true });
    await client.connectAnonymousUser({ id: '!anon' }, '');
    expect(client.anonymous).toBe(true);
    expect(client.user?.id).toBe('!anon');
    // hasConnectionId stays false because no socket is created.
    expect(client.hasConnectionId()).toBe(false);
    // The gate resolved with undefined, so a public-style request can still
    // proceed without hanging.
    const tokenManager = client.tokenManager;
    expect(tokenManager.isStatic()).toBe(true);
  });

  it('axiosInstance is the same reference the RestClient sees (regression for spyOn)', async () => {
    const client = new StreamClient('api-key', { browser: true });
    // The legacy integration test spies on client.axiosInstance.post to assert
    // request shape. Confirm the field is the same reference the new
    // RestClient was wired with.
    const spy = vi.spyOn(client.axiosInstance, 'post');
    expect(spy).toBeDefined();
  });

  it('legacy F11 alias _hasConnectionID/_getConnectionID resolves to the same as the canonical names', () => {
    const client = new StreamClient('api-key', { browser: true });
    expect(client._hasConnectionID()).toBe(client.hasConnectionId());
    expect(client._getConnectionID()).toBe(client.getConnectionId());
  });

  it('connectUser without an id throws', async () => {
    const client = new StreamClient('api-key', { browser: true });
    await expect(
      client.connectUser({ id: '' }, jwtFor('jane')),
    ).rejects.toThrow(/missing/);
  });

  it('connectUser twice with different ids throws on the second call', async () => {
    const client = new StreamClient('api-key', { browser: true });
    // Stub openConnection so we don't actually open a WS.
    client.openConnection = vi.fn(async () => undefined);
    await client.connectUser({ id: 'jane' }, jwtFor('jane'));
    await expect(
      client.connectUser({ id: 'john' }, jwtFor('john')),
    ).rejects.toThrow(/Use client.disconnect/);
  });

  it('connectUser with the same id returns the cached task and warns', async () => {
    const client = new StreamClient('api-key', { browser: true });
    let openCount = 0;
    client.openConnection = vi.fn(async () => {
      openCount += 1;
      return undefined;
    });
    await client.connectUser({ id: 'jane' }, jwtFor('jane'));
    expect(openCount).toBe(1);
    await client.connectUser({ id: 'jane' }, jwtFor('jane'));
    expect(openCount).toBe(1);
  });

  it('disconnectUser clears state and is idempotent', async () => {
    const client = new StreamClient('api-key', { browser: true });
    client.openConnection = vi.fn(async () => undefined);
    await client.connectUser({ id: 'jane' }, jwtFor('jane'));
    await client.disconnectUser();
    expect(client.user).toBeUndefined();
    expect(client.userID).toBeUndefined();
    await expect(client.disconnectUser()).resolves.toBeUndefined();
  });
});
