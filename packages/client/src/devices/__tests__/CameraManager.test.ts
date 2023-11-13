import { Call } from '../../Call';
import { StreamClient } from '../../coordinator/connection/client';
import { CallingState, StreamVideoWriteableStateStore } from '../../store';

import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import {
  mockCall,
  mockDeviceIds$,
  mockVideoDevices,
  mockVideoStream,
} from './mocks';
import { getVideoStream } from '../devices';
import { TrackType } from '../../gen/video/sfu/models/models';
import { CameraManager } from '../CameraManager';
import { of } from 'rxjs';

vi.mock('../devices.ts', () => {
  console.log('MOCKING devices API');
  return {
    disposeOfMediaStream: vi.fn(),
    getVideoDevices: vi.fn(() => {
      return of(mockVideoDevices);
    }),
    getVideoStream: vi.fn(() => Promise.resolve(mockVideoStream())),
    deviceIds$: mockDeviceIds$(),
  };
});

vi.mock('../../Call.ts', () => {
  console.log('MOCKING Call');
  return {
    Call: vi.fn(() => mockCall()),
  };
});

describe('CameraManager', () => {
  let manager: CameraManager;

  beforeEach(() => {
    manager = new CameraManager(
      new Call({
        id: '',
        type: '',
        streamClient: new StreamClient('abc123'),
        clientStore: new StreamVideoWriteableStateStore(),
      }),
    );
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

    expect(manager['call'].publishVideoStream).toHaveBeenCalledWith(
      manager.state.mediaStream,
      {
        preferredCodec: undefined,
      },
    );
  });

  it('publish stream with preferred codec', async () => {
    manager['call'].state.setCallingState(CallingState.JOINED);
    manager.setPreferredCodec('h264');

    await manager.enable();

    expect(manager['call'].publishVideoStream).toHaveBeenCalledWith(
      manager.state.mediaStream,
      {
        preferredCodec: 'h264',
      },
    );
  });

  it('stop publish stream', async () => {
    manager['call'].state.setCallingState(CallingState.JOINED);
    await manager.enable();

    await manager.disable();

    expect(manager['call'].stopPublish).toHaveBeenCalledWith(
      TrackType.VIDEO,
      true,
    );
  });

  it('flip', async () => {
    await manager.selectDirection('front');

    await manager.flip();

    expect(manager.state.direction).toBe('back');
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
      deviceId,
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
      deviceId: mockVideoDevices[0].deviceId,
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

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });
});
