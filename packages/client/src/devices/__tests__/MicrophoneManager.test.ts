import { Call } from '../../Call';
import { StreamClient } from '../../coordinator/connection/client';
import { CallingState, StreamVideoWriteableStateStore } from '../../store';

import { afterEach, beforeEach, describe, vi, it, expect } from 'vitest';
import { mockCall, mockAudioDevices, mockAudioStream } from './mocks';
import { getAudioStream } from '../devices';
import { TrackType } from '../../gen/video/sfu/models/models';
import { MicrophoneManager } from '../MicrophoneManager';
import { of } from 'rxjs';
import { CallSettingsResponse } from '../../gen/coordinator';

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

  it('should apply backend settings', async () => {
    const settings = {
      audio: {
        mic_default_on: true,
      },
    } as CallSettingsResponse;

    await manager['applyDefaultSettings'](settings);
    expect(manager.state.status).toBe('enabled');
  });

  it(`shouldn't apply backend settings if status is already set`, async () => {
    await manager.enable();

    const settings = {
      audio: {
        mic_default_on: false,
      },
    } as CallSettingsResponse;

    await manager['applyDefaultSettings'](settings);
    expect(manager.state.status).toBe('enabled');
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });
});
