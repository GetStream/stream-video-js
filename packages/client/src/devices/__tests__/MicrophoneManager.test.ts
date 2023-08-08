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

  it('enable microphone - before joined to call', async () => {
    await manager.enable();

    expect(manager.state.mediaStream).toBeDefined();
    expect(manager.state.status).toBe('enabled');
  });

  it('enable microphone - after joined to call', async () => {
    // @ts-expect-error
    manager['call'].state.callingState = CallingState.JOINED;

    await manager.enable();

    expect(manager['call'].publishAudioStream).toHaveBeenCalledWith(
      manager.state.mediaStream,
    );
  });

  it('disable microphone - before joined to call', async () => {
    await manager.disable();

    expect(manager.state.mediaStream).toBeUndefined();
    expect(manager.state.status).toBe('disabled');
  });

  it('disable microphone - after joined to call', async () => {
    // @ts-expect-error
    manager['call'].state.callingState = CallingState.JOINED;
    const stream = mockAudioStream();
    // @ts-expect-error
    manager.state.setMediaStream(stream);

    await manager.disable();

    expect(manager['call'].stopPublish).toHaveBeenCalledWith(TrackType.AUDIO);
  });

  it('toggle microphone', async () => {
    vi.spyOn(manager, 'disable');
    vi.spyOn(manager, 'enable');

    manager.state.setMediaStream(undefined);
    await manager.toggle();

    expect(manager.enable).toHaveBeenCalled();

    await manager.toggle();

    expect(manager.disable).toHaveBeenCalled();
  });

  it('select device when microphone is off', async () => {
    // @ts-expect-error
    manager['call'].state.callingState = CallingState.JOINED;
    manager.state.setMediaStream(undefined);
    manager.state.setDevice(undefined);

    const deviceId = mockAudioDevices[0].deviceId;
    await manager.select(deviceId);

    expect(manager.state.selectedDevice).toBe(deviceId);
    expect(getAudioStream).not.toHaveBeenCalledWith();
    expect(manager['call'].publishAudioStream).not.toHaveBeenCalled();
  });

  it('select device when microphone is on', async () => {
    // @ts-expect-error
    manager['call'].state.callingState = CallingState.JOINED;
    const stream = mockAudioStream();
    // @ts-expect-error
    manager.state.setMediaStream(stream);
    manager.state.setDevice(undefined);

    const deviceId = mockAudioDevices[0].deviceId;
    await manager.select(deviceId);

    expect(manager['call'].stopPublish).toHaveBeenCalledWith(TrackType.AUDIO);
    expect(manager['call'].publishAudioStream).toHaveBeenCalled();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });
});
