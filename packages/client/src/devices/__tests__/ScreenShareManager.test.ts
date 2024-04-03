import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScreenShareManager } from '../ScreenShareManager';
import { Call } from '../../Call';
import { StreamClient } from '../../coordinator/connection/client';
import { CallingState, StreamVideoWriteableStateStore } from '../../store';
import * as RxUtils from '../../store/rxUtils';
import { mockCall, mockDeviceIds$, mockScreenShareStream } from './mocks';
import { getScreenShareStream } from '../devices';
import { TrackType } from '../../gen/video/sfu/models/models';
import { StopPublishOptions } from '../../types';

vi.mock('../devices.ts', () => {
  console.log('MOCKING devices API');
  return {
    disposeOfMediaStream: vi.fn(),
    getScreenShareStream: vi.fn(() => Promise.resolve(mockScreenShareStream())),
    checkIfAudioOutputChangeSupported: vi.fn(() => Promise.resolve(true)),
    deviceIds$: () => mockDeviceIds$(),
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
    globalThis.navigator ??= {} as Navigator;
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
    // @ts-ignore - remove the navigator mock
    delete globalThis.navigator;
  });

  it('list devices', () => {
    const devices = manager.listDevices();
    expect(RxUtils.getCurrentValue(devices)).toEqual([]);
  });

  it('select device', () => {
    expect(manager.select('any-device-id')).rejects.toThrowError();
  });

  it('get stream', async () => {
    manager.enableScreenShareAudio();
    await manager.enable();
    expect(manager.state.status).toEqual('enabled');

    expect(getScreenShareStream).toHaveBeenCalledWith({
      deviceId: undefined,
    });
  });

  it('get stream with no audio', async () => {
    await manager.disableScreenShareAudio();
    await manager.enable();
    expect(manager.state.status).toEqual('enabled');

    expect(getScreenShareStream).toHaveBeenCalledWith({
      deviceId: undefined,
      audio: false,
    });
  });

  it('should get device id from stream', async () => {
    expect(manager.state.selectedDevice).toBeUndefined();
    await manager.enable();
    expect(manager.state.selectedDevice).toBeDefined();
    expect(manager.state.selectedDevice).toEqual('screen');
  });

  it('publishes screen share stream', async () => {
    const call = manager['call'];
    call.state.setCallingState(CallingState.JOINED);
    await manager.enable();
    expect(call.publishScreenShareStream).toHaveBeenCalledWith(
      manager.state.mediaStream,
      { screenShareSettings: undefined },
    );
  });

  it('publishes screen share stream with settings', async () => {
    const call = manager['call'];
    call.state.setCallingState(CallingState.JOINED);

    manager.setSettings({ maxFramerate: 15, maxBitrate: 1000 });

    await manager.enable();
    expect(call.publishScreenShareStream).toHaveBeenCalledWith(
      manager.state.mediaStream,
      { screenShareSettings: { maxFramerate: 15, maxBitrate: 1000 } },
    );
  });

  it('stop publish stream', async () => {
    const call = manager['call'];
    call.state.setCallingState(CallingState.JOINED);
    await manager.enable();

    await manager.disable();
    expect(manager.state.status).toEqual('disabled');
    expect(call.stopPublish).toHaveBeenCalledWith(TrackType.SCREEN_SHARE, {
      notifySfu: true,
      stopTracks: true,
    } satisfies StopPublishOptions);
    expect(call.stopPublish).toHaveBeenCalledWith(
      TrackType.SCREEN_SHARE_AUDIO,
      { notifySfu: true, stopTracks: true } satisfies StopPublishOptions,
    );
  });
});
