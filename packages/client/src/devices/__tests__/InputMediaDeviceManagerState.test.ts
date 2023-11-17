import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InputMediaDeviceManagerState } from '../InputMediaDeviceManagerState';

class TestInputMediaDeviceManagerState extends InputMediaDeviceManagerState {
  constructor() {
    super('stop-tracks', 'camera' as PermissionName);
  }

  getDeviceIdFromStream = vi.fn();
}

describe('InputMediaDeviceManagerState', () => {
  let state: InputMediaDeviceManagerState;

  beforeEach(() => {
    state = new TestInputMediaDeviceManagerState();
  });

  describe('hasBrowserPermission', () => {
    it('should emit true when permission is granted', async () => {
      const permissionStatus: Partial<PermissionStatus> = {
        state: 'granted',
        addEventListener: vi.fn(),
      };
      const query = vi.fn(() => Promise.resolve(permissionStatus));
      globalThis.navigator ??= {} as Navigator;
      // @ts-ignore - navigator is readonly, but we need to mock it
      globalThis.navigator.permissions = { query };

      const hasPermission = await new Promise((resolve) => {
        state.hasBrowserPermission$.subscribe((v) => resolve(v));
      });
      expect(hasPermission).toBe(true);
      expect(query).toHaveBeenCalledWith({ name: 'camera' });
      expect(permissionStatus.addEventListener).toHaveBeenCalled();
    });

    it(' should emit false when permission is denied', async () => {
      const permissionStatus: Partial<PermissionStatus> = {
        state: 'denied',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      const query = vi.fn(() => Promise.resolve(permissionStatus));
      globalThis.navigator ??= {} as Navigator;
      // @ts-ignore - navigator is readonly, but we need to mock it
      globalThis.navigator.permissions = { query };

      const hasPermission = await new Promise((resolve) => {
        state.hasBrowserPermission$.subscribe((v) => resolve(v));
      });
      expect(hasPermission).toBe(false);
      expect(query).toHaveBeenCalledWith({ name: 'camera' });
      expect(permissionStatus.addEventListener).toHaveBeenCalled();
    });

    it('should emit false when prompt is needed', async () => {
      const permissionStatus: Partial<PermissionStatus> = {
        state: 'prompt',
        addEventListener: vi.fn(),
      };
      const query = vi.fn(() => Promise.resolve(permissionStatus));
      globalThis.navigator ??= {} as Navigator;
      // @ts-ignore - navigator is readonly, but we need to mock it
      globalThis.navigator.permissions = { query };

      const hasPermission = await new Promise((resolve) => {
        state.hasBrowserPermission$.subscribe((v) => resolve(v));
      });
      expect(hasPermission).toBe(false);
      expect(query).toHaveBeenCalledWith({ name: 'camera' });
      expect(permissionStatus.addEventListener).toHaveBeenCalled();
    });

    it('should emit true when permissions cannot be queried', async () => {
      const query = vi.fn(() => Promise.reject());
      globalThis.navigator ??= {} as Navigator;
      // @ts-ignore - navigator is readonly, but we need to mock it
      globalThis.navigator.permissions = { query };

      const hasPermission = await new Promise((resolve) => {
        state.hasBrowserPermission$.subscribe((v) => resolve(v));
      });
      expect(hasPermission).toBe(true);
      expect(query).toHaveBeenCalledWith({ name: 'camera' });
    });

    it('should emit true when permissions API is unavailable', async () => {
      globalThis.navigator ??= {} as Navigator;
      // @ts-ignore - navigator is readonly, but we need to mock it
      globalThis.navigator.permissions = null;

      const hasPermission = await new Promise((resolve) => {
        state.hasBrowserPermission$.subscribe((v) => resolve(v));
      });
      expect(hasPermission).toBe(true);
    });
  });
});
