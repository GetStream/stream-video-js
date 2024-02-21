import { Call } from '../../Call';
import { StreamClient } from '../../coordinator/connection/client';
import { CallingState, StreamVideoWriteableStateStore } from '../../store';

import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import {
  mockAudioDevices,
  mockAudioStream,
  mockCall,
  mockDeviceIds$,
} from './mocks';
import { getAudioStream } from '../devices';
import { TrackType } from '../../gen/video/sfu/models/models';
import { MicrophoneManager } from '../MicrophoneManager';
import { of } from 'rxjs';
import {
  createSoundDetector,
  SoundStateChangeHandler,
} from '../../helpers/sound-detector';
import { OwnCapability } from '../../gen/coordinator';

vi.mock('../devices.ts', () => {
  console.log('MOCKING devices API');
  return {
    disposeOfMediaStream: vi.fn(),
    getAudioDevices: vi.fn(() => {
      return of(mockAudioDevices);
    }),
    getAudioStream: vi.fn(() => Promise.resolve(mockAudioStream())),
    deviceIds$: mockDeviceIds$(),
  };
});

vi.mock('../../helpers/sound-detector.ts', () => {
  console.log('MOCKING sound detector');
  return {
    createSoundDetector: vi.fn(),
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
    manager['call'].state.setCallingState(CallingState.JOINED);

    await manager.enable();

    expect(manager['call'].publishAudioStream).toHaveBeenCalledWith(
      manager.state.mediaStream,
    );
  });

  it('stop publish stream', async () => {
    manager['call'].state.setCallingState(CallingState.JOINED);
    await manager.enable();

    await manager.disable();

    expect(manager['call'].stopPublish).toHaveBeenCalledWith(
      TrackType.AUDIO,
      false,
    );
  });

  it('disable-enable mic should set track.enabled', async () => {
    await manager.enable();

    expect(manager.state.mediaStream!.getAudioTracks()[0].enabled).toBe(true);

    await manager.disable();

    expect(manager.state.mediaStream!.getAudioTracks()[0].enabled).toBe(false);
  });

  it('disable mic with forceStop should remove the stream', async () => {
    await manager.enable();

    expect(manager.state.mediaStream!.getAudioTracks()[0].enabled).toBe(true);

    await manager.disable();

    expect(manager.state.mediaStream!.getAudioTracks()[0].enabled).toBe(false);

    await manager.disable(true);

    expect(manager.state.mediaStream).toBeUndefined();
  });

  it(`should start sound detection if mic is disabled`, async () => {
    await manager.enable();
    // @ts-expect-error
    vi.spyOn(manager, 'startSpeakingWhileMutedDetection');
    await manager.disable();

    expect(manager['startSpeakingWhileMutedDetection']).toHaveBeenCalled();
  });

  it(`should stop sound detection if mic is enabled`, async () => {
    manager.state.setSpeakingWhileMuted(true);
    manager['soundDetectorCleanup'] = () => {};

    await manager.enable();

    expect(manager.state.speakingWhileMuted).toBe(false);
  });

  it('should update speaking while muted state', async () => {
    const mock = createSoundDetector as Mock;
    let handler: SoundStateChangeHandler;
    mock.mockImplementation((_: MediaStream, h: SoundStateChangeHandler) => {
      handler = h;
    });
    await manager['startSpeakingWhileMutedDetection']();

    expect(manager.state.speakingWhileMuted).toBe(false);

    handler!({ isSoundDetected: true, audioLevel: 2 });

    expect(manager.state.speakingWhileMuted).toBe(true);

    handler!({ isSoundDetected: false, audioLevel: 0 });

    expect(manager.state.speakingWhileMuted).toBe(false);
  });

  it('should stop speaking while muted notifications if user loses permission to send audio', async () => {
    await manager.enable();
    await manager.disable();

    // @ts-expect-error
    vi.spyOn(manager, 'stopSpeakingWhileMutedDetection');
    manager['call'].state.setOwnCapabilities([]);

    expect(manager['stopSpeakingWhileMutedDetection']).toHaveBeenCalled();
  });

  it('should start speaking while muted notifications if user gains permission to send audio', async () => {
    await manager.enable();
    await manager.disable();

    manager['call'].state.setOwnCapabilities([]);

    // @ts-expect-error
    vi.spyOn(manager, 'stopSpeakingWhileMutedDetection');
    manager['call'].state.setOwnCapabilities([OwnCapability.SEND_AUDIO]);

    expect(manager['stopSpeakingWhileMutedDetection']).toHaveBeenCalled();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });
});
