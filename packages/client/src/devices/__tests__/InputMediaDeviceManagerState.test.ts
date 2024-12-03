import { beforeAll, describe, expect, it, vi } from 'vitest';
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
    beforeAll(() => {
      Object.defineProperty(navigator, 'permissions', {
        value: {
          query: vi.fn(),
        },
      });
    });

    it('should emit true when permission is granted', async () => {
      const permissionStatus = mockPermissionStatus('granted');
      const query = vi.fn(() => Promise.resolve(permissionStatus));
      vi.spyOn(navigator.permissions, 'query').mockImplementation(query);
      const state = new TestInputMediaDeviceManagerState();

      const hasPermission = await firstValueFrom(state.hasBrowserPermission$);

      expect(hasPermission).toBe(true);
      expect(query).toHaveBeenCalledWith({ name: 'camera' });
      expect(permissionStatus.addEventListener).toHaveBeenCalled();
    });

    it('should emit false when permission is denied', async () => {
      const permissionStatus = mockPermissionStatus('denied');
      const query = vi.fn(() => Promise.resolve(permissionStatus));
      vi.spyOn(navigator.permissions, 'query').mockImplementation(query);
      const state = new TestInputMediaDeviceManagerState();

      const hasPermission = await firstValueFrom(state.hasBrowserPermission$);

      expect(hasPermission).toBe(false);
      expect(query).toHaveBeenCalledWith({ name: 'camera' });
      expect(permissionStatus.addEventListener).toHaveBeenCalled();
    });

    it('should emit true when prompt is needed', async () => {
      const permissionStatus = mockPermissionStatus('prompt');
      const query = vi.fn(() => Promise.resolve(permissionStatus));
      vi.spyOn(navigator.permissions, 'query').mockImplementation(query);
      const state = new TestInputMediaDeviceManagerState();

      const hasPermission = await firstValueFrom(state.hasBrowserPermission$);

      expect(hasPermission).toBe(true);
      expect(query).toHaveBeenCalledWith({ name: 'camera' });
      expect(permissionStatus.addEventListener).toHaveBeenCalled();
    });

    it('should emit true when permissions cannot be queried', async () => {
      const query = vi.fn(() => Promise.reject());
      vi.spyOn(navigator.permissions, 'query').mockImplementation(query);
      const state = new TestInputMediaDeviceManagerState();

      const hasPermission = await firstValueFrom(state.hasBrowserPermission$);

      expect(hasPermission).toBe(true);
      expect(query).toHaveBeenCalledWith({ name: 'camera' });
    });

    it('should emit true when permissions API is unavailable', async () => {
      const state = new TestInputMediaDeviceManagerState();
      const hasPermission = await firstValueFrom(state.hasBrowserPermission$);
      expect(hasPermission).toBe(true);
    });
  });
});
