import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MicrophoneManager } from '../MicrophoneManager';
import { Call } from '../../Call';
import { StreamClient } from '../../coordinator/connection/client';
import { StreamVideoWriteableStateStore } from '../../store';
import {
  mockAudioDevices,
  mockAudioStream,
  mockBrowserPermission,
  mockCall,
} from './mocks';
import { of } from 'rxjs';
import '../../rtc/__tests__/mocks/webrtc.mocks';
import { OwnCapability } from '../../gen/coordinator';
import { SoundStateChangeHandler } from '../../helpers/sound-detector';
import { settled, withoutConcurrency } from '../../helpers/concurrency';

let handler: SoundStateChangeHandler = () => {};
let unsubscribeHandlers: ReturnType<typeof vi.fn>[] = [];

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
    getAudioBrowserPermission: () => mockBrowserPermission,
    getVideoBrowserPermission: () => mockBrowserPermission,
    deviceIds$: {},
    resolveDeviceId: (deviceId) => deviceId,
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
      start: vi.fn((callback) => {
        handler = callback;
        const unsubscribe = vi.fn();
        unsubscribeHandlers.push(unsubscribe);
        return unsubscribe;
      }),
      stop: vi.fn(),
      onSpeakingDetectedStateChange: vi.fn(),
    })),
  };
});

describe('MicrophoneManager React Native', () => {
  let manager: MicrophoneManager;
  let checkPermissionMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    unsubscribeHandlers = [];
    checkPermissionMock = vi.fn(async () => true);

    globalThis.streamRNVideoSDK = {
      callManager: {
        setup: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      },
      permissions: {
        check: checkPermissionMock,
      },
    };

    const devicePersistence = { enabled: false, storageKey: '' };
    manager = new MicrophoneManager(
      new Call({
        id: '',
        type: '',
        streamClient: new StreamClient('abc123'),
        clientStore: new StreamVideoWriteableStateStore(),
      }),
      devicePersistence,
    );
  });

  it(`should start sound detection if mic is disabled`, async () => {
    await manager.enable();
    // @ts-expect-error - private method
    const fn = vi.spyOn(manager, 'startSpeakingWhileMutedDetection');
    await manager.disable();

    await vi.waitUntil(() => fn.mock.calls.length > 0, { timeout: 100 });
    expect(fn).toHaveBeenCalled();
    expect(manager['rnSpeechDetector']?.start).toHaveBeenCalled();
  });

  it('should check native microphone permission before starting detection', async () => {
    await manager.enable();
    await manager.disable();

    await vi.waitUntil(() => checkPermissionMock.mock.calls.length > 0, {
      timeout: 100,
    });
    expect(checkPermissionMock).toHaveBeenCalledWith('microphone');
  });

  it('should not start sound detection if native microphone permission is denied', async () => {
    checkPermissionMock.mockResolvedValue(false);

    await manager.enable();
    // @ts-expect-error - private method
    const fn = vi.spyOn(manager, 'startSpeakingWhileMutedDetection');
    await manager.disable();

    await vi.waitUntil(() => checkPermissionMock.mock.calls.length > 0, {
      timeout: 100,
    });
    expect(fn).not.toHaveBeenCalled();
  });

  it(`should stop sound detection if mic is enabled`, async () => {
    manager.state.setSpeakingWhileMuted(true);
    manager['soundDetectorCleanup'] = async () => {};

    await manager.enable();

    // @ts-expect-error private field
    const syncTag = manager.soundDetectorConcurrencyTag;
    await withoutConcurrency(syncTag, () => Promise.resolve());
    await settled(syncTag);

    await vi.waitUntil(() => manager.state.speakingWhileMuted === false, {
      timeout: 100,
    });
    expect(manager.state.speakingWhileMuted).toBe(false);
  });

  it('should update speaking while muted state', async () => {
    await manager['startSpeakingWhileMutedDetection']();
    expect(manager['rnSpeechDetector']?.start).toHaveBeenCalled();

    expect(manager.state.speakingWhileMuted).toBe(false);

    handler!({ isSoundDetected: true, audioLevel: 2 });

    expect(manager.state.speakingWhileMuted).toBe(true);

    handler!({ isSoundDetected: false, audioLevel: 0 });

    expect(manager.state.speakingWhileMuted).toBe(false);
  });

  it('should not create duplicate speech detectors for the same device', async () => {
    await manager['startSpeakingWhileMutedDetection']('device-1');
    await manager['startSpeakingWhileMutedDetection']('device-1');

    expect(unsubscribeHandlers).toHaveLength(1);

    await manager['stopSpeakingWhileMutedDetection']();
    expect(unsubscribeHandlers[0]).toHaveBeenCalledTimes(1);
  });

  it('should cleanup previous speech detector before starting a new one', async () => {
    await manager['startSpeakingWhileMutedDetection']('device-1');
    await manager['startSpeakingWhileMutedDetection']('device-2');

    expect(unsubscribeHandlers).toHaveLength(2);
    expect(unsubscribeHandlers[0]).toHaveBeenCalledTimes(1);

    await manager['stopSpeakingWhileMutedDetection']();
    expect(unsubscribeHandlers[1]).toHaveBeenCalledTimes(1);
  });

  it('should stop speaking while muted notifications if user loses permission to send audio', async () => {
    await manager.enable();
    await manager.disable();

    // @ts-expect-error private method
    const fn = vi.spyOn(manager, 'stopSpeakingWhileMutedDetection');
    manager['call'].state.setOwnCapabilities([]);

    await vi.waitUntil(() => fn.mock.calls.length > 0, { timeout: 100 });
    expect(fn).toHaveBeenCalled();
  });

  it('should start speaking while muted notifications if user gains permission to send audio', async () => {
    await manager.enable();
    await manager.disable();

    manager['call'].state.setOwnCapabilities([]);

    // @ts-expect-error - private method
    const fn = vi.spyOn(manager, 'startSpeakingWhileMutedDetection');
    manager['call'].state.setOwnCapabilities([OwnCapability.SEND_AUDIO]);

    await vi.waitUntil(() => fn.mock.calls.length > 0, { timeout: 100 });
    expect(fn).toHaveBeenCalled();
  });

  afterEach(() => {
    globalThis.streamRNVideoSDK = undefined;
    vi.clearAllMocks();
    vi.resetModules();
  });
});
