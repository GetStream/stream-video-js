import { Call } from '../../Call';
import { StreamClient } from '../../coordinator/connection/client';
import { CallingState, StreamVideoWriteableStateStore } from '../../store';

import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { fromPartial } from '@total-typescript/shoehorn';
import {
  createLocalStorageMock,
  emitDeviceIds,
  mockBrowserPermission,
  mockCall,
  mockDeviceIds$,
  mockVideoDevices,
  mockVideoStream,
} from './mocks';
import { createVideoStreamForDevice } from './mediaStreamTestHelpers';
import { TrackType } from '../../gen/video/sfu/models/models';
import { CameraManager } from '../CameraManager';
import { of } from 'rxjs';
import { PermissionsContext } from '../../permissions';
import { Tracer } from '../../stats';
import {
  defaultDeviceId,
  readPreferences,
  toPreferenceList,
} from '../devicePersistence';

const getVideoStream = vi.hoisted(() =>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  vi.fn((_trackConstraints?: MediaTrackConstraints, _tracer?: Tracer) =>
    Promise.resolve(mockVideoStream()),
  ),
);

vi.mock('../devices.ts', () => {
  console.log('MOCKING devices API');
  return {
    disposeOfMediaStream: vi.fn(),
    getVideoDevices: vi.fn(() => {
      return of(mockVideoDevices);
    }),
    getVideoStream,
    getAudioBrowserPermission: () => mockBrowserPermission,
    getVideoBrowserPermission: () => mockBrowserPermission,
    deviceIds$: mockDeviceIds$(),
    resolveDeviceId: (deviceId) => deviceId,
  };
});

vi.mock('../../Call.ts', () => {
  console.log('MOCKING Call');
  return {
    Call: vi.fn(() => mockCall()),
  };
});

vi.mock('../../helpers/compatibility.ts', () => {
  console.log('MOCKING mobile device');
  return {
    isMobile: () => true,
  };
});

vi.mock('../../helpers/platforms', () => {
  console.log('MOCKING mobile device');
  return {
    isReactNative: () => false,
  };
});

describe('CameraManager', () => {
  let manager: CameraManager;
  let call: Call;

  beforeEach(() => {
    const devicePersistence = { enabled: false, storageKey: '' };
    call = new Call({
      id: '',
      type: '',
      streamClient: new StreamClient('abc123', { devicePersistence }),
      clientStore: new StreamVideoWriteableStateStore(),
    });
    manager = new CameraManager(call, devicePersistence);
  });

  it('list devices', () => {
    const spy = vi.fn();
    manager.listDevices().subscribe(spy);

    expect(spy).toHaveBeenCalledWith(mockVideoDevices);
  });

  it('get stream', async () => {
    await manager.enable();

    expect(getVideoStream).toHaveBeenCalledWith(
      {
        deviceId: undefined,
        width: 1280,
        height: 720,
      },
      expect.any(Tracer),
    );
  });

  it('should get device id from stream', async () => {
    expect(manager.state.selectedDevice).toBeUndefined();

    await manager.enable();

    expect(manager.state.selectedDevice).toBeDefined();
  });

  it('publish stream', async () => {
    manager['call'].state.setCallingState(CallingState.JOINED);

    await manager.enable();

    expect(manager['call'].publish).toHaveBeenCalledWith(
      manager.state.mediaStream,
      TrackType.VIDEO,
      undefined,
    );
  });

  it('stop publish stream', async () => {
    manager['call'].state.setCallingState(CallingState.JOINED);
    await manager.enable();

    await manager.disable();

    expect(manager['call'].stopPublish).toHaveBeenCalledWith(TrackType.VIDEO);
  });

  it('flip', async () => {
    getVideoStream.mockReturnValue(Promise.resolve(mockVideoStream()));
    await manager.selectDirection('front');
    expect(manager.state.direction).toBe('front');
    vi.spyOn(manager, 'selectDirection');
    getVideoStream.mockReturnValue(
      Promise.resolve(mockVideoStream('environment')),
    );
    await manager.flip();
    expect(manager.selectDirection).toHaveBeenCalledWith('back');
    expect(manager.state.direction).toBe('back');
    // reset the mock
    getVideoStream.mockReturnValue(Promise.resolve(mockVideoStream()));
  });

  it('select camera direction', async () => {
    expect(manager.state.direction).toBe(undefined);

    await manager.enable();

    expect(getVideoStream).toHaveBeenCalledWith(
      {
        deviceId: undefined,
        width: 1280,
        height: 720,
      },
      expect.any(Tracer),
    );

    await manager.selectDirection('front');

    expect(getVideoStream).toHaveBeenCalledWith(
      {
        deviceId: undefined,
        width: 1280,
        height: 720,
        facingMode: 'user',
      },
      expect.any(Tracer),
    );

    await manager.selectDirection('back');

    expect(getVideoStream).toHaveBeenCalledWith(
      {
        deviceId: undefined,
        facingMode: 'environment',
        width: 1280,
        height: 720,
      },
      expect.any(Tracer),
    );
  });

  it(`shouldn't set deviceId and facingMode at the same time`, async () => {
    await manager.enable();

    await manager.flip();

    expect(getVideoStream).toHaveBeenCalledWith(
      {
        facingMode: 'environment',
        width: 1280,
        height: 720,
      },
      expect.any(Tracer),
    );

    const deviceId = mockVideoDevices[1].deviceId;
    await manager.select(deviceId);

    expect((getVideoStream as Mock).mock.lastCall[0]).toEqual({
      deviceId: { exact: deviceId },
      width: 1280,
      height: 720,
    });
  });

  it(`should set target resolution, but shouldn't change device status`, async () => {
    manager['targetResolution'] = { width: 640, height: 480 };

    expect(manager.state.status).toBe(undefined);

    await manager.selectTargetResolution({ width: 1280, height: 720 });

    const targetResolution = manager['targetResolution'];

    expect(targetResolution.width).toBe(1280);
    expect(targetResolution.height).toBe(720);
    expect(manager.state.status).toBe(undefined);
  });

  it('should apply target resolution to existing media stream track', async () => {
    await manager.enable();
    await manager.selectTargetResolution({ width: 640, height: 480 });

    expect((getVideoStream as Mock).mock.lastCall[0]).toEqual({
      deviceId: { exact: mockVideoDevices[0].deviceId },
      width: 640,
      height: 480,
    });
  });

  it(`should do nothing if existing track has the correct resolution`, async () => {
    await manager.enable();

    expect(getVideoStream).toHaveBeenCalledOnce();

    await manager.selectTargetResolution({ width: 1280, height: 720 });

    expect(getVideoStream).toHaveBeenCalledOnce();
  });

  describe('Video Settings', () => {
    beforeEach(() => {
      // @ts-expect-error - read only property
      call.permissionsContext = new PermissionsContext();
      call.permissionsContext.hasPermission = vi.fn().mockReturnValue(true);
    });

    it('should enable the camera when set on the dashboard', async () => {
      vi.spyOn(manager, 'enable');
      await manager.apply(
        fromPartial({
          enabled: true,
          target_resolution: { width: 640, height: 480 },
          camera_facing: 'front',
          camera_default_on: true,
        }),
        true,
      );

      expect(manager.state.direction).toBe('front');
      expect(manager.state.status).toBe('enabled');
      expect(manager['targetResolution']).toEqual({ width: 640, height: 480 });
      expect(manager.enable).toHaveBeenCalled();
    });

    it('should enable the camera when enabled is not provided', async () => {
      vi.spyOn(manager, 'enable');
      await manager.apply(
        fromPartial({
          target_resolution: { width: 640, height: 480 },
          camera_facing: 'front',
          camera_default_on: true,
        }),
        true,
      );

      expect(manager.state.direction).toBe('front');
      expect(manager.state.status).toBe('enabled');
      expect(manager['targetResolution']).toEqual({ width: 640, height: 480 });
      expect(manager.enable).toHaveBeenCalled();
    });

    it('should not enable the camera when set on the dashboard', async () => {
      vi.spyOn(manager, 'enable');
      await manager.apply(
        fromPartial({
          enabled: true,
          target_resolution: { width: 640, height: 480 },
          camera_facing: 'front',
          camera_default_on: false,
        }),
        true,
      );

      expect(manager.state.direction).toBe('front');
      expect(manager.state.status).toBe(undefined);
      expect(manager['targetResolution']).toEqual({ width: 640, height: 480 });
      expect(manager.enable).not.toHaveBeenCalled();
    });

    it('should skip defaults when preferences are applied', async () => {
      const devicePersistence = { enabled: true, storageKey: '' };
      const persistedManager = new CameraManager(call, devicePersistence);
      const applySpy = vi
        .spyOn(persistedManager as never, 'applyPersistedPreferences')
        .mockResolvedValue(true);
      const selectDirectionSpy = vi.spyOn(persistedManager, 'selectDirection');
      const enableSpy = vi.spyOn(persistedManager, 'enable');

      await persistedManager.apply(
        fromPartial({
          enabled: true,
          target_resolution: { width: 640, height: 480 },
          camera_facing: 'front',
          camera_default_on: true,
        }),
        true,
      );

      expect(applySpy).toHaveBeenCalledWith(true);
      expect(selectDirectionSpy).not.toHaveBeenCalled();
      expect(enableSpy).not.toHaveBeenCalled();
    });

    it('should not apply defaults when device is not pristine', async () => {
      manager.state.setStatus('enabled');
      const selectDirectionSpy = vi.spyOn(manager, 'selectDirection');
      const enableSpy = vi.spyOn(manager, 'enable');

      await manager.apply(
        fromPartial({
          enabled: true,
          target_resolution: { width: 640, height: 480 },
          camera_facing: 'front',
          camera_default_on: true,
        }),
        true,
      );

      expect(selectDirectionSpy).not.toHaveBeenCalled();
      expect(enableSpy).not.toHaveBeenCalled();
    });

    it('should on the camera but not publish when publish is false', async () => {
      manager['call'].state.setCallingState(CallingState.IDLE);
      vi.spyOn(manager, 'enable');
      // @ts-expect-error - private api
      vi.spyOn(manager, 'publishStream');
      await manager.apply(
        fromPartial({
          enabled: true,
          target_resolution: { width: 640, height: 480 },
          camera_facing: 'front',
          camera_default_on: true,
        }),
        false,
      );

      expect(manager.state.direction).toBe('front');
      expect(manager.state.status).toBe('enabled');
      expect(manager['targetResolution']).toEqual({ width: 640, height: 480 });
      expect(manager.enable).toHaveBeenCalled();
      // @ts-expect-error - private api
      expect(manager.publishStream).not.toHaveBeenCalled();
    });

    it('should not enable the camera when the user does not have permission', async () => {
      call.permissionsContext.canPublish = vi.fn().mockReturnValue(false);
      vi.spyOn(manager, 'enable');
      await manager.apply(
        fromPartial({
          target_resolution: { width: 640, height: 480 },
          camera_facing: 'front',
          camera_default_on: true,
          enabled: true,
        }),
        true,
      );

      expect(manager.state.direction).toBe('front');
      expect(manager.state.status).toBe(undefined);
      expect(manager['targetResolution']).toEqual({ width: 640, height: 480 });
      expect(manager.enable).not.toHaveBeenCalled();
    });

    it('should publish the stream when the camera is already enabled', async () => {
      await manager.enable();
      // @ts-expect-error - private api
      vi.spyOn(manager, 'publishStream');
      await manager.apply(
        fromPartial({
          target_resolution: { width: 640, height: 480 },
          camera_facing: 'front',
          camera_default_on: true,
          enabled: true,
        }),
        true,
      );

      expect(manager['publishStream']).toHaveBeenCalled();
    });

    it('should not turn on the camera when video is disabled', async () => {
      vi.spyOn(manager, 'enable');
      await manager.apply(
        fromPartial({
          enabled: false,
          target_resolution: { width: 640, height: 480 },
          camera_facing: 'front',
          camera_default_on: true,
        }),
        false,
      );

      expect(manager.state.status).toBe(undefined);
      expect(manager.enable).not.toHaveBeenCalled();
    });
  });

  describe('Device Persistence Stress', () => {
    it('persists the final camera and muted state after rapid toggles, switches, and unplug', async () => {
      const storageKey = '@test/device-preferences-camera-stress';
      const localStorageMock = createLocalStorageMock();
      const originalWindow = globalThis.window;
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: { localStorage: localStorageMock },
      });

      const getVideoStreamMock = vi.mocked(getVideoStream);
      getVideoStreamMock.mockImplementation((constraints) => {
        const requestedDeviceId = (constraints?.deviceId as { exact?: string })
          ?.exact;
        const selectedDevice =
          mockVideoDevices.find((d) => d.deviceId === requestedDeviceId) ??
          mockVideoDevices[0];
        return Promise.resolve(
          createVideoStreamForDevice(selectedDevice.deviceId),
        );
      });

      const stressManager = new CameraManager(call, {
        enabled: true,
        storageKey,
      });

      try {
        const finalDevice = mockVideoDevices[2];
        emitDeviceIds(mockVideoDevices);

        await Promise.allSettled([
          stressManager.enable(),
          stressManager.select(mockVideoDevices[1].deviceId),
          stressManager.toggle(),
          stressManager.select(finalDevice.deviceId),
          stressManager.toggle(),
          stressManager.enable(),
        ]);
        await stressManager.statusChangeSettled();
        await stressManager.select(finalDevice.deviceId);
        await stressManager.enable();
        await stressManager.statusChangeSettled();

        expect(stressManager.state.selectedDevice).toBe(finalDevice.deviceId);
        expect(stressManager.state.status).toBe('enabled');

        const persistedBeforeUnplug = toPreferenceList(
          readPreferences(storageKey).camera,
        );
        expect(persistedBeforeUnplug[0]).toEqual({
          selectedDeviceId: finalDevice.deviceId,
          selectedDeviceLabel: finalDevice.label,
          muted: false,
        });

        emitDeviceIds(
          mockVideoDevices.filter((d) => d.deviceId !== finalDevice.deviceId),
        );

        await vi.waitFor(() => {
          expect(stressManager.state.selectedDevice).toBe(undefined);
          expect(stressManager.state.status).toBe('disabled');
        });

        const persistedAfterUnplug = toPreferenceList(
          readPreferences(storageKey).camera,
        );
        expect(persistedAfterUnplug[0]).toEqual({
          selectedDeviceId: defaultDeviceId,
          selectedDeviceLabel: '',
          muted: true,
        });
        expect(persistedAfterUnplug).toContainEqual({
          selectedDeviceId: finalDevice.deviceId,
          selectedDeviceLabel: finalDevice.label,
          muted: true,
        });
      } finally {
        stressManager.dispose();
        Object.defineProperty(globalThis, 'window', {
          configurable: true,
          value: originalWindow,
        });
      }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });
});
