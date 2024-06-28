import { describe, expect, it, vi } from 'vitest';
import { InputMediaDeviceManagerState } from '../InputMediaDeviceManagerState';
import { firstValueFrom } from 'rxjs';
import { BrowserPermission } from '../BrowserPermission';

class TestInputMediaDeviceManagerState extends InputMediaDeviceManagerState {
  constructor() {
    super(
      'stop-tracks',
      new BrowserPermission({
        queryName: 'camera' as PermissionName,
        constraints: {},
      }),
    );
  }

  getDeviceIdFromStream = vi.fn();
}

function mockPermissionStatus(state: PermissionState): PermissionStatus {
  return {
    state,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as any;
}

describe('InputMediaDeviceManagerState', () => {
  describe('hasBrowserPermission', () => {
    it('should emit true when permission is granted', async () => {
      const permissionStatus = mockPermissionStatus('granted');
      const query = vi.fn(() => Promise.resolve(permissionStatus));
      globalThis.navigator = { permissions: { query } } as any;
      const state = new TestInputMediaDeviceManagerState();

      const hasPermission = await firstValueFrom(state.hasBrowserPermission$);

      expect(hasPermission).toBe(true);
      expect(query).toHaveBeenCalledWith({ name: 'camera' });
      expect(permissionStatus.addEventListener).toHaveBeenCalled();
    });

    it('should emit false when permission is denied', async () => {
      const permissionStatus = mockPermissionStatus('denied');
      const query = vi.fn(() => Promise.resolve(permissionStatus));
      globalThis.navigator = { permissions: { query } } as any;
      const state = new TestInputMediaDeviceManagerState();

      const hasPermission = await firstValueFrom(state.hasBrowserPermission$);

      expect(hasPermission).toBe(false);
      expect(query).toHaveBeenCalledWith({ name: 'camera' });
      expect(permissionStatus.addEventListener).toHaveBeenCalled();
    });

    it('should emit true when prompt is needed', async () => {
      const permissionStatus = mockPermissionStatus('prompt');
      const query = vi.fn(() => Promise.resolve(permissionStatus));
      globalThis.navigator = { permissions: { query } } as any;
      const state = new TestInputMediaDeviceManagerState();

      const hasPermission = await firstValueFrom(state.hasBrowserPermission$);

      expect(hasPermission).toBe(true);
      expect(query).toHaveBeenCalledWith({ name: 'camera' });
      expect(permissionStatus.addEventListener).toHaveBeenCalled();
    });

    it('should emit true when permissions cannot be queried', async () => {
      const query = vi.fn(() => Promise.reject());
      globalThis.navigator = { permissions: { query } } as any;
      const state = new TestInputMediaDeviceManagerState();

      const hasPermission = await firstValueFrom(state.hasBrowserPermission$);

      expect(hasPermission).toBe(true);
      expect(query).toHaveBeenCalledWith({ name: 'camera' });
    });

    it('should emit true when permissions API is unavailable', async () => {
      globalThis.navigator = {} as any;
      const state = new TestInputMediaDeviceManagerState();

      const hasPermission = await firstValueFrom(state.hasBrowserPermission$);

      expect(hasPermission).toBe(true);
    });
  });
});
