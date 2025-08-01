import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScreenShareManager } from '../ScreenShareManager';
import { Call } from '../../Call';
import { StreamClient } from '../../coordinator/connection/client';
import { CallingState, StreamVideoWriteableStateStore } from '../../store';
import * as RxUtils from '../../store/rxUtils';
import { mockCall, mockDeviceIds$, mockScreenShareStream } from './mocks';
import { getScreenShareStream } from '../devices';
import { TrackType } from '../../gen/video/sfu/models/models';
import { Tracer } from '../../stats';

vi.mock('../devices.ts', () => {
  console.log('MOCKING devices API');
  return {
    disposeOfMediaStream: vi.fn(),
    getScreenShareStream: vi.fn(() => Promise.resolve(mockScreenShareStream())),
    checkIfAudioOutputChangeSupported: vi.fn(() => Promise.resolve(true)),
    deviceIds$: () => mockDeviceIds$(),
    resolveDeviceId: (deviceId) => deviceId,
  };
});

vi.mock('../../Call.ts', () => {
  console.log('MOCKING Call');
  return {
    Call: vi.fn(() => mockCall()),
  };
});

describe('ScreenShareManager', () => {
  let manager: ScreenShareManager;

  beforeEach(() => {
    manager = new ScreenShareManager(
      new Call({
        id: '',
        type: '',
        streamClient: new StreamClient('abc123'),
        clientStore: new StreamVideoWriteableStateStore(),
      }),
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('list devices', () => {
    const devices = manager.listDevices();
    expect(RxUtils.getCurrentValue(devices)).toEqual([]);
  });

  it('select device', async () => {
    await expect(manager.select()).rejects.toThrowError();
  });

  it('get stream', async () => {
    manager.enableScreenShareAudio();
    await manager.enable();
    expect(manager.state.status).toEqual('enabled');

    expect(getScreenShareStream).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceId: undefined,
      }),
      expect.any(Tracer),
    );
  });

  it('get stream with no audio', async () => {
    await manager.disableScreenShareAudio();
    await manager.enable();
    expect(manager.state.status).toEqual('enabled');

    expect(getScreenShareStream).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceId: undefined,
        audio: false,
      }),
      expect.any(Tracer),
    );
  });

  it('should get device id from stream', async () => {
    expect(manager.state.selectedDevice).toBeUndefined();
    await manager.enable();
    expect(manager.state.selectedDevice).toBeDefined();
    expect(manager.state.selectedDevice).toEqual('screen');
  });

  it('should use call settings to set up constraints', async () => {
    const call = manager['call'];
    call.state.setCurrentValue(call.state['settingsSubject'], {
      // @ts-expect-error partial data
      screensharing: {
        target_resolution: {
          width: 800,
          height: 600,
          bitrate: 192000,
        },
      },
    });

    await manager.enable();
    expect(getScreenShareStream).toHaveBeenCalledWith(
      expect.objectContaining({
        video: {
          width: 800,
          height: 600,
        },
      }),
      expect.any(Tracer),
    );
  });

  it('publishes screen share stream', async () => {
    const call = manager['call'];
    call.state.setCallingState(CallingState.JOINED);
    await manager.enable();
    expect(call.publish).toHaveBeenCalledWith(
      manager.state.mediaStream,
      TrackType.SCREEN_SHARE,
    );
  });

  it('stop publish stream', async () => {
    const call = manager['call'];
    call.state.setCallingState(CallingState.JOINED);
    await manager.enable();

    await manager.disable();
    expect(manager.state.status).toEqual('disabled');
    expect(call.stopPublish).toHaveBeenCalledWith(
      TrackType.SCREEN_SHARE,
      TrackType.SCREEN_SHARE_AUDIO,
    );
  });
});
