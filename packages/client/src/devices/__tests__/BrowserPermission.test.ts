import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrowserPermission } from '../BrowserPermission';
import { isReactNative } from '../../helpers/platforms';
import { Tracer } from '../../stats';

vi.mock('../../helpers/platforms', () => ({
  isReactNative: vi.fn(() => true),
}));

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('BrowserPermission native state', () => {
  afterEach(() => {
    globalThis.streamRNVideoSDK = undefined;
  });

  it('tracks the native state on React Native, keeping the behavioral one granted', async () => {
    let onForeground = () => {};
    const unsubscribe = vi.fn();
    const query = vi.fn().mockResolvedValue('denied');
    globalThis.streamRNVideoSDK = {
      permissions: { query },
      nativeEvents: {
        appForeground: {
          subscribe: (cb: () => void) => {
            onForeground = cb;
            return unsubscribe;
          },
        },
      },
    } as any;
    const tracer = new Tracer(null);
    const permission = new BrowserPermission({
      constraints: { audio: true },
      queryName: 'microphone' as PermissionName,
      tracer,
    });

    expect(await permission.getState()).toBe('granted');
    await flush();
    expect(tracer.take().snapshot).toEqual([]);
    expect(query).toHaveBeenCalledWith('microphone');

    const listener = vi.fn();
    permission.listenNative(listener);
    expect(listener).toHaveBeenCalledExactlyOnceWith('denied');

    // unchanged and failed queries don't notify
    await permission.refreshNativeState();
    query.mockRejectedValueOnce(new Error('boom'));
    expect(await permission.refreshNativeState()).toBe('denied');
    expect(listener).toHaveBeenCalledOnce();

    query.mockResolvedValue('granted');
    onForeground();
    await flush();
    expect(listener).toHaveBeenLastCalledWith('granted');

    permission.dispose();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('does not query the native state on web', async () => {
    vi.mocked(isReactNative).mockReturnValue(false);
    const query = vi.fn();
    globalThis.streamRNVideoSDK = { permissions: { query } } as any;
    const permission = new BrowserPermission({
      constraints: { audio: true },
      queryName: 'microphone' as PermissionName,
      tracer: undefined,
    });

    expect(await permission.refreshNativeState()).toBeUndefined();
    expect(query).not.toHaveBeenCalled();
  });
});
