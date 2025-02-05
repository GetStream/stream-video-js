import { Call } from '../../Call';
import { StreamClient } from '../../coordinator/connection/client';
import { CallingState, StreamVideoWriteableStateStore } from '../../store';

import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import {
  mockBrowserPermission,
  mockCall,
  mockDeviceIds$,
  mockVideoDevices,
  mockVideoStream,
} from './mocks';
import { TrackType } from '../../gen/video/sfu/models/models';
import { CameraManager } from '../CameraManager';
import { of } from 'rxjs';
import { PermissionsContext } from '../../permissions';

const getVideoStream = vi.hoisted(() =>
  vi.fn(() => Promise.resolve(mockVideoStream())),
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
    call = new Call({
      id: '',
      type: '',
      streamClient: new StreamClient('abc123'),
      clientStore: new StreamVideoWriteableStateStore(),
    });
    manager = new CameraManager(call);
  });

  it('list devices', () => {
    const spy = vi.fn();
    manager.listDevices().subscribe(spy);

    expect(spy).toHaveBeenCalledWith(mockVideoDevices);
  });

  it('get stream', async () => {
    await manager.enable();

    expect(getVideoStream).toHaveBeenCalledWith({
      deviceId: undefined,
      width: 1280,
      height: 720,
    });
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

    expect(getVideoStream).toHaveBeenCalledWith({
      deviceId: undefined,
      width: 1280,
      height: 720,
    });

    await manager.selectDirection('front');

    expect(getVideoStream).toHaveBeenCalledWith({
      deviceId: undefined,
      width: 1280,
      height: 720,
      facingMode: 'user',
    });

    await manager.selectDirection('back');

    expect(getVideoStream).toHaveBeenCalledWith({
      deviceId: undefined,
      facingMode: 'environment',
      width: 1280,
      height: 720,
    });
  });

  it(`shouldn't set deviceId and facingMode at the same time`, async () => {
    await manager.enable();

    await manager.flip();

    expect(getVideoStream).toHaveBeenCalledWith({
      facingMode: 'environment',
      width: 1280,
      height: 720,
    });

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
        // @ts-expect-error - partial settings
        {
          target_resolution: { width: 640, height: 480 },
          camera_facing: 'front',
          camera_default_on: true,
        },
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
        // @ts-expect-error - partial settings
        {
          target_resolution: { width: 640, height: 480 },
          camera_facing: 'front',
          camera_default_on: false,
        },
        true,
      );

      expect(manager.state.direction).toBe('front');
      expect(manager.state.status).toBe(undefined);
      expect(manager['targetResolution']).toEqual({ width: 640, height: 480 });
      expect(manager.enable).not.toHaveBeenCalled();
    });

    it('should not turn on the camera when publish is false', async () => {
      vi.spyOn(manager, 'enable');
      await manager.apply(
        // @ts-expect-error - partial settings
        {
          target_resolution: { width: 640, height: 480 },
          camera_facing: 'front',
          camera_default_on: true,
        },
        false,
      );

      expect(manager.state.direction).toBe('front');
      expect(manager.state.status).toBe(undefined);
      expect(manager['targetResolution']).toEqual({ width: 640, height: 480 });
      expect(manager.enable).not.toHaveBeenCalled();
    });

    it('should not enable the camera when the user does not have permission', async () => {
      call.permissionsContext.hasPermission = vi.fn().mockReturnValue(false);
      vi.spyOn(manager, 'enable');
      await manager.apply(
        // @ts-expect-error - partial settings
        {
          target_resolution: { width: 640, height: 480 },
          camera_facing: 'front',
          camera_default_on: true,
        },
        true,
      );

      expect(manager.state.direction).toBe(undefined);
      expect(manager.state.status).toBe(undefined);
      expect(manager['targetResolution']).toEqual({ width: 1280, height: 720 });
      expect(manager.enable).not.toHaveBeenCalled();
    });

    it('should publish the stream when the camera is already enabled', async () => {
      await manager.enable();
      // @ts-expect-error - private api
      vi.spyOn(manager, 'publishStream');
      await manager.apply(
        // @ts-expect-error - partial settings
        {
          target_resolution: { width: 640, height: 480 },
          camera_facing: 'front',
          camera_default_on: true,
        },
        true,
      );

      expect(manager['publishStream']).toHaveBeenCalled();
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });
});
