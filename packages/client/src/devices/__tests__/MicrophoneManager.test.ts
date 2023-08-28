import { Call } from '../../Call';
import { StreamClient } from '../../coordinator/connection/client';
import { CallingState, StreamVideoWriteableStateStore } from '../../store';

import { afterEach, beforeEach, describe, vi, it, expect, Mock } from 'vitest';
import { mockCall, mockAudioDevices, mockAudioStream } from './mocks';
import { getAudioStream } from '../devices';
import { TrackType } from '../../gen/video/sfu/models/models';
import { MicrophoneManager } from '../MicrophoneManager';
import { of } from 'rxjs';
import {
  SoundStateChangeHandler,
  createSoundDetector,
} from '../../helpers/sound-detector';

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

  it(`should start sound detection if mic is disabled`, async () => {
    await manager.enable();
    await manager.disable();

    expect(createSoundDetector).toHaveBeenCalled();
  });

  it(`shouldn't start sound detection if mic is stopped`, async () => {
    // @ts-expect-error
    manager.state.disableMode = 'stop-tracks';
    await manager.enable();
    await manager.disable();

    expect(createSoundDetector).not.toHaveBeenCalled();
  });

  it(`should stop sound detection if mic is enabled`, async () => {
    manager.state.setSpeakingWhileMuted(true);

    await manager.enable();

    expect(manager.state.speakingWhileMuted).toBe(false);
  });

  it(`should stop sound detection if mic is stopped`, async () => {
    manager.state.setSpeakingWhileMuted(true);
    // @ts-expect-error
    manager.state.disableMode = 'stop-tracks';
    await manager.disable();

    expect(manager.state.speakingWhileMuted).toBe(false);
  });

  it('should update speaking while muted state', async () => {
    const mock = createSoundDetector as Mock;
    let handler: SoundStateChangeHandler;
    mock.mockImplementation((_: MediaStream, h: SoundStateChangeHandler) => {
      handler = h;
    });
    await manager.enable();
    await manager.disable();

    expect(manager.state.speakingWhileMuted).toBe(false);

    handler!({ isSoundDetected: true, audioLevel: 2 });

    expect(manager.state.speakingWhileMuted).toBe(true);

    handler!({ isSoundDetected: false, audioLevel: 0 });

    expect(manager.state.speakingWhileMuted).toBe(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });
});
