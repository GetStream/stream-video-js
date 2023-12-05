import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MicrophoneManager } from '../MicrophoneManager';
import { Call } from '../../Call';
import { StreamClient } from '../../coordinator/connection/client';
import { StreamVideoWriteableStateStore } from '../../store';
import { mockAudioDevices, mockAudioStream, mockCall } from './mocks';
import { of } from 'rxjs';
import '../../rtc/__tests__/mocks/webrtc.mocks';
import { OwnCapability } from '../../gen/coordinator';

let handler;

vi.mock('../../helpers/platforms.ts', () => {
  return {
    isReactNative: vi.fn(() => true),
  };
});

vi.mock('../devices.ts', () => {
  console.log('MOCKING devices API');
  return {
    disposeOfMediaStream: vi.fn(),
    getAudioDevices: vi.fn(() => {
      return of(mockAudioDevices);
    }),
    getAudioStream: vi.fn(() => Promise.resolve(mockAudioStream())),
    deviceIds$: {},
  };
});

vi.mock('../../Call.ts', () => {
  console.log('MOCKING Call');
  return {
    Call: vi.fn(() => mockCall()),
  };
});

vi.mock('../../helpers/RNSpeechDetector.ts', () => {
  console.log('MOCKING RNSpeechDetector');
  return {
    RNSpeechDetector: vi.fn().mockImplementation(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      onSpeakingDetectedStateChange: vi.fn((callback) => {
        handler = callback;
        return vi.fn();
      }),
    })),
  };
});

describe('MicrophoneManager React Native', () => {
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

  it(`should start sound detection if mic is disabled`, async () => {
    await manager.enable();
    // @ts-expect-error
    vi.spyOn(manager, 'startSpeakingWhileMutedDetection');
    await manager.disable();

    expect(manager['startSpeakingWhileMutedDetection']).toHaveBeenCalled();
    expect(manager['rnSpeechDetector']?.start).toHaveBeenCalled();
  });

  it(`should stop sound detection if mic is enabled`, async () => {
    manager.state.setSpeakingWhileMuted(true);
    manager['soundDetectorCleanup'] = () => {};

    await manager.enable();

    expect(manager.state.speakingWhileMuted).toBe(false);
  });

  it('should update speaking while muted state', async () => {
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
