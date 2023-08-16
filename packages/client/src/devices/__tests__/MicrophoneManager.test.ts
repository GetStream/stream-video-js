import { Call } from '../../Call';
import { StreamClient } from '../../coordinator/connection/client';
import { CallingState, StreamVideoWriteableStateStore } from '../../store';

import { afterEach, beforeEach, describe, vi, it, expect } from 'vitest';
import { mockCall, mockAudioDevices, mockAudioStream } from './mocks';
import { getAudioStream } from '../devices';
import { TrackType } from '../../gen/video/sfu/models/models';
import { MicrophoneManager } from '../MicrophoneManager';
import { of } from 'rxjs';

vi.mock('../devices.ts', () => {
  console.log('MOCKING devices API');
  return {
    disposeOfMediaStream: vi.fn(),
    getAudioDevices: vi.fn(() => {
      return of(mockAudioDevices);
    }),
    getAudioStream: vi.fn(() => Promise.resolve(mockAudioStream())),
  };
});

vi.mock('../../Call.ts', () => {
  console.log('MOCKING Call');
  return {
    Call: vi.fn(() => mockCall()),
  };
});

describe('MicrophoneManager', () => {
  let manager: MicrophoneManager;

  beforeEach(() => {
    manager = new MicrophoneManager(
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

    expect(spy).toHaveBeenCalledWith(mockAudioDevices);
  });

  it('get stream', async () => {
    await manager.enable();

    expect(getAudioStream).toHaveBeenCalledWith({
      deviceId: undefined,
    });
  });

  it('should get device id from stream', async () => {
    expect(manager.state.selectedDevice).toBeUndefined();

    await manager.enable();

    expect(manager.state.selectedDevice).toBeDefined();
  });

  it('publish stream', async () => {
    // @ts-expect-error
    manager['call'].state.callingState = CallingState.JOINED;

    await manager.enable();

    expect(manager['call'].publishAudioStream).toHaveBeenCalledWith(
      manager.state.mediaStream,
    );
  });

  it('stop publish stream', async () => {
    // @ts-expect-error
    manager['call'].state.callingState = CallingState.JOINED;
    await manager.enable();

    await manager.disable();

    expect(manager['call'].stopPublish).toHaveBeenCalledWith(TrackType.AUDIO);
  });

  it('should pause and resume tracks', async () => {
    await manager.enable();

    manager.pause();

    expect(manager.state.mediaStream?.getAudioTracks()[0].enabled).toBe(false);

    manager.resume();

    expect(manager.state.mediaStream?.getAudioTracks()[0].enabled).toBe(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });
});
