import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MicrophoneManager } from '../MicrophoneManager';
import { Call } from '../../Call';
import { StreamClient } from '../../coordinator/connection/client';
import { CallingState, StreamVideoWriteableStateStore } from '../../store';
import {
  mockAudioDevices,
  mockAudioStream,
  mockBrowserPermission,
  mockCall,
} from './mocks';
import { of } from 'rxjs';
import '../../rtc/__tests__/mocks/webrtc.mocks';
import { OwnCapability } from '../../gen/coordinator';
import { settled, withoutConcurrency } from '../../helpers/concurrency';
import { ClientEventReporter } from '../../reporting';

let speechActivityCallback:
  | ((state: { isSoundDetected: boolean }) => void)
  | null = null;
let unsubscribeMocks: ReturnType<typeof vi.fn>[] = [];

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
    Call: vi.fn(function () {
      return mockCall();
    }),
  };
});

describe('MicrophoneManager React Native', () => {
  let manager: MicrophoneManager;
  let checkPermissionMock: ReturnType<typeof vi.fn>;
  let subscribeMock: ReturnType<typeof vi.fn>;
  let setMutedRecordingPreparedMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    speechActivityCallback = null;
    unsubscribeMocks = [];
    checkPermissionMock = vi.fn(async () => true);
    setMutedRecordingPreparedMock = vi.fn();
    subscribeMock = vi.fn((cb) => {
      speechActivityCallback = cb;
      const unsub = vi.fn();
      unsubscribeMocks.push(unsub);
      return unsub;
    });

    globalThis.streamRNVideoSDK = {
      callManager: {
        setup: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        setMutedRecordingPrepared: setMutedRecordingPreparedMock,
      },
      permissions: {
        check: checkPermissionMock,
      },
      nativeEvents: {
        speechActivity: {
          subscribe: subscribeMock,
        },
      },
    };

    const devicePersistence = { enabled: false, storageKey: '' };
    const streamClient = new StreamClient('abc123');
    manager = new MicrophoneManager(
      new Call({
        id: '',
        type: '',
        streamClient,
        clientStore: new StreamVideoWriteableStateStore(),
        clientEventReporter: new ClientEventReporter({ streamClient }),
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
    expect(subscribeMock).toHaveBeenCalled();
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
    expect(subscribeMock).toHaveBeenCalled();

    expect(manager.state.speakingWhileMuted).toBe(false);

    speechActivityCallback!({ isSoundDetected: true });

    expect(manager.state.speakingWhileMuted).toBe(true);

    speechActivityCallback!({ isSoundDetected: false });

    expect(manager.state.speakingWhileMuted).toBe(false);
  });

  it('should not create duplicate speech detectors for the same device', async () => {
    await manager['startSpeakingWhileMutedDetection']('device-1');
    await manager['startSpeakingWhileMutedDetection']('device-1');

    expect(unsubscribeMocks).toHaveLength(1);

    await manager['stopSpeakingWhileMutedDetection']();
    expect(unsubscribeMocks[0]).toHaveBeenCalledTimes(1);
  });

  it('should cleanup previous speech detector before starting a new one', async () => {
    await manager['startSpeakingWhileMutedDetection']('device-1');
    await manager['startSpeakingWhileMutedDetection']('device-2');

    expect(unsubscribeMocks).toHaveLength(2);
    expect(unsubscribeMocks[0]).toHaveBeenCalledTimes(1);

    await manager['stopSpeakingWhileMutedDetection']();
    expect(unsubscribeMocks[1]).toHaveBeenCalledTimes(1);
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

  it('should prepare muted recording when mic is disabled and user can send audio', async () => {
    await manager.enable();
    await manager.disable();

    await vi.waitUntil(
      () =>
        setMutedRecordingPreparedMock.mock.calls.some(([arg]) => arg === true),
      { timeout: 100 },
    );
    expect(setMutedRecordingPreparedMock).toHaveBeenCalledWith(true);
  });

  it('should release prepared muted recording when mic is enabled', async () => {
    await manager.disable();
    setMutedRecordingPreparedMock.mockClear();
    await manager.enable();

    await vi.waitUntil(
      () =>
        setMutedRecordingPreparedMock.mock.calls.some(([arg]) => arg === false),
      { timeout: 100 },
    );
    expect(setMutedRecordingPreparedMock).toHaveBeenCalledWith(false);
  });

  it('should not prepare muted recording when user cannot send audio', async () => {
    await manager.disable();
    manager['call'].state.setOwnCapabilities([]);
    setMutedRecordingPreparedMock.mockClear();
    // toggle status to re-run the reactive subscription with no send-audio cap
    await manager.enable();
    await manager.disable();

    await vi.waitUntil(
      () => setMutedRecordingPreparedMock.mock.calls.length > 0,
      { timeout: 100 },
    );
    expect(setMutedRecordingPreparedMock).not.toHaveBeenCalledWith(true);
  });

  it('should not prepare muted recording if native microphone permission is denied', async () => {
    checkPermissionMock.mockResolvedValue(false);
    await manager.enable();
    await manager.disable();

    await vi.waitUntil(() => checkPermissionMock.mock.calls.length > 0, {
      timeout: 100,
    });
    expect(setMutedRecordingPreparedMock).not.toHaveBeenCalledWith(true);
  });

  it('should release prepared muted recording when the call is left', async () => {
    await manager.disable();
    await vi.waitUntil(
      () =>
        setMutedRecordingPreparedMock.mock.calls.some(([arg]) => arg === true),
      { timeout: 100 },
    );
    setMutedRecordingPreparedMock.mockClear();

    manager['call'].state.setCallingState(CallingState.LEFT);

    await vi.waitUntil(
      () =>
        setMutedRecordingPreparedMock.mock.calls.some(([arg]) => arg === false),
      { timeout: 100 },
    );
    expect(setMutedRecordingPreparedMock).toHaveBeenCalledWith(false);
  });

  afterEach(() => {
    globalThis.streamRNVideoSDK = undefined;
    vi.clearAllMocks();
    vi.resetModules();
  });
});
