import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import type { INoiseCancellation } from '@stream-io/audio-filters-web';
import { Call } from '../../Call';
import { StreamClient } from '../../coordinator/connection/client';
import { sleep } from '../../coordinator/connection/utils';
import {
  NoiseCancellationSettingsModeEnum,
  OwnCapability,
} from '../../gen/coordinator';
import { TrackType } from '../../gen/video/sfu/models/models';
import { CallingState, StreamVideoWriteableStateStore } from '../../store';
import {
  mockAudioDevices,
  mockAudioStream,
  mockBrowserPermission,
  mockCall,
  mockDeviceIds$,
} from './mocks';
import { getAudioStream } from '../devices';
import { MicrophoneManager } from '../MicrophoneManager';
import { of } from 'rxjs';
import {
  createSoundDetector,
  SoundStateChangeHandler,
} from '../../helpers/sound-detector';
import { PermissionsContext } from '../../permissions';

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
    deviceIds$: mockDeviceIds$(),
  };
});

vi.mock('../../helpers/sound-detector.ts', () => {
  console.log('MOCKING sound detector');
  return {
    createSoundDetector: vi.fn(() => () => {}),
  };
});

vi.mock('../../Call.ts', () => {
  console.log('MOCKING Call');
  return {
    Call: vi.fn(() => mockCall()),
  };
});

class NoiseCancellationStub implements INoiseCancellation {
  private listeners: { [event: string]: Array<(arg: boolean) => void> } = {};

  isSupported = () => true;
  init = () => Promise.resolve(undefined);
  enable = () => this.listeners['change']?.forEach((l) => l(true));
  disable = () => this.listeners['change']?.forEach((l) => l(false));
  dispose = () => Promise.resolve(undefined);
  toFilter = () => (ms: MediaStream) => ({ output: ms });
  on = (event, callback) => {
    (this.listeners[event] ??= []).push(callback);
    return () => {};
  };
  off = () => {};
}

describe('MicrophoneManager', () => {
  let manager: MicrophoneManager;
  let call: Call;

  beforeEach(() => {
    call = new Call({
      id: '',
      type: '',
      streamClient: new StreamClient('abc123'),
      clientStore: new StreamVideoWriteableStateStore(),
    });
    manager = new MicrophoneManager(call, 'disable-tracks');
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

    expect(manager['call'].publish).toHaveBeenCalledWith(
      manager.state.mediaStream,
      TrackType.AUDIO,
    );
  });

  it('stop publish stream', async () => {
    manager['call'].state.setCallingState(CallingState.JOINED);
    await manager.enable();

    await manager.disable();

    expect(manager['call'].stopPublish).toHaveBeenCalledWith(TrackType.AUDIO);
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

  describe('Speaking While Muted', () => {
    it(`should start sound detection if mic is disabled`, async () => {
      await manager.enable();
      // @ts-expect-error private api
      const fn = vi.spyOn(manager, 'startSpeakingWhileMutedDetection');
      await manager.disable();

      await vi.waitUntil(() => fn.mock.calls.length > 0, { timeout: 100 });
      expect(fn).toHaveBeenCalled();
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
      const prevMockImplementation = mock.getMockImplementation();
      mock.mockImplementation((_: MediaStream, h: SoundStateChangeHandler) => {
        handler = h;
      });
      try {
        await manager['startSpeakingWhileMutedDetection']();

        expect(manager.state.speakingWhileMuted).toBe(false);

        handler!({ isSoundDetected: true, audioLevel: 2 });

        expect(manager.state.speakingWhileMuted).toBe(true);

        handler!({ isSoundDetected: false, audioLevel: 0 });

        expect(manager.state.speakingWhileMuted).toBe(false);
      } finally {
        mock.mockImplementation(prevMockImplementation!);
      }
    });

    // --- this ---
    it('should stop speaking while muted notifications if user loses permission to send audio', async () => {
      await manager.enable();
      await manager.disable();

      // @ts-expect-error private api
      const fn = vi.spyOn(manager, 'stopSpeakingWhileMutedDetection');
      manager['call'].state.setOwnCapabilities([]);

      await vi.waitUntil(() => fn.mock.calls.length > 0, { timeout: 100 });
      expect(fn).toHaveBeenCalled();
    });

    // --- this ---
    it('should start speaking while muted notifications if user gains permission to send audio', async () => {
      await manager.enable();
      await manager.disable();

      manager['call'].state.setOwnCapabilities([]);

      // @ts-expect-error private api
      const fn = vi.spyOn(manager, 'startSpeakingWhileMutedDetection');
      manager['call'].state.setOwnCapabilities([OwnCapability.SEND_AUDIO]);

      await vi.waitUntil(() => fn.mock.calls.length > 0, { timeout: 100 });
      expect(fn).toHaveBeenCalled();
    });

    it(`disables speaking while muted notifications`, async () => {
      // @ts-expect-error - private api
      vi.spyOn(manager, 'startSpeakingWhileMutedDetection');
      // @ts-expect-error - private api
      vi.spyOn(manager, 'stopSpeakingWhileMutedDetection');
      await manager.disableSpeakingWhileMutedNotification();
      await manager.disable();
      expect(manager['stopSpeakingWhileMutedDetection']).toHaveBeenCalled();
      expect(
        manager['startSpeakingWhileMutedDetection'],
      ).not.toHaveBeenCalled();
    });

    it(`enables speaking while muted notifications`, async () => {
      // @ts-expect-error - private api
      vi.spyOn(manager, 'startSpeakingWhileMutedDetection');
      await manager.enableSpeakingWhileMutedNotification();
      await manager.disable();
      expect(manager['startSpeakingWhileMutedDetection']).toHaveBeenCalled();
    });
  });

  describe('Noise Cancellation', () => {
    it('should register filter if all preconditions are met', async () => {
      call.state.setCallingState(CallingState.IDLE);
      const registerFilter = vi.spyOn(manager, 'registerFilter');
      const noiseCancellation = new NoiseCancellationStub();
      const noiseCancellationEnable = vi.spyOn(noiseCancellation, 'enable');
      await manager.enableNoiseCancellation(noiseCancellation);

      expect(registerFilter).toBeCalled();
      expect(noiseCancellationEnable).not.toBeCalled();
    });

    it('should unregister filter when disabling noise cancellation', async () => {
      const noiseCancellation = new NoiseCancellationStub();
      await manager.enableNoiseCancellation(noiseCancellation);
      await manager.disableNoiseCancellation();
      expect(call.notifyNoiseCancellationStopped).toBeCalled();
    });

    it('should throw when own capabilities are missing', async () => {
      call.state.setOwnCapabilities([]);

      await expect(() =>
        manager.enableNoiseCancellation(new NoiseCancellationStub()),
      ).rejects.toThrow();
    });

    it('should throw when noise cancellation is disabled in call settings', async () => {
      call.state.setOwnCapabilities([OwnCapability.ENABLE_NOISE_CANCELLATION]);
      call.state.updateFromCallResponse({
        // @ts-expect-error partial data
        audio: {
          noise_cancellation: {
            mode: NoiseCancellationSettingsModeEnum.DISABLED,
          },
        },
      });
      await expect(() =>
        manager.enableNoiseCancellation(new NoiseCancellationStub()),
      ).rejects.toThrow();
    });

    it('should automatically enable noise noise suppression after joining a call', async () => {
      call.state.setCallingState(CallingState.IDLE); // reset state
      call.state.updateFromCallResponse({
        settings: {
          // @ts-expect-error - partial data
          audio: {
            noise_cancellation: {
              mode: NoiseCancellationSettingsModeEnum.AUTO_ON,
            },
          },
        },
      });

      const noiseCancellation = new NoiseCancellationStub();
      const noiseCancellationEnable = vi.spyOn(noiseCancellation, 'enable');
      await manager.enableNoiseCancellation(noiseCancellation);

      expect(noiseCancellationEnable).not.toBeCalled();

      call.state.setCallingState(CallingState.JOINED);

      // it is quite hard to test the "detached" callingState$ subscription
      // with the current tools and architecture.
      // that is why we go with the good old sleep
      await sleep(25);

      expect(noiseCancellationEnable).toBeCalled();
      expect(call.notifyNoiseCancellationStarting).toBeCalled();
    });

    it('should automatically disable noise suppression after leaving the call', async () => {
      const noiseCancellation = new NoiseCancellationStub();
      const noiseSuppressionDisable = vi.spyOn(noiseCancellation, 'disable');
      await manager.enableNoiseCancellation(noiseCancellation);

      expect(noiseSuppressionDisable).not.toBeCalled();

      call.state.setCallingState(CallingState.LEFT);

      // it is quite hard to test the "detached" callingState$ subscription
      // with the current tools and architecture.
      // that is why we go with the good old sleep
      await sleep(25);

      expect(noiseSuppressionDisable).toBeCalled();
      expect(call.notifyNoiseCancellationStopped).toBeCalled();
    });
  });

  describe('Audio Settings', () => {
    beforeEach(() => {
      // @ts-expect-error - read only property
      call.permissionsContext = new PermissionsContext();
      call.permissionsContext.hasPermission = vi.fn().mockReturnValue(true);
    });

    it('should turn the mic on when set on dashboard', async () => {
      const enable = vi.spyOn(manager, 'enable');
      // @ts-expect-error - partial data
      await manager.apply({ mic_default_on: true }, true);
      expect(enable).toHaveBeenCalled();
    });

    it('should not turn the mic on when set on dashboard', async () => {
      const enable = vi.spyOn(manager, 'enable');
      // @ts-expect-error - partial data
      await manager.apply({ mic_default_on: false }, true);
      expect(enable).not.toHaveBeenCalled();
    });

    it('should not turn on the mic when publish is false', async () => {
      const enable = vi.spyOn(manager, 'enable');
      // @ts-expect-error - partial data
      await manager.apply({ mic_default_on: true }, false);
      expect(enable).not.toHaveBeenCalled();
    });

    it('should not turn on the mic when permission is missing', async () => {
      call.permissionsContext.hasPermission = vi.fn().mockReturnValue(false);
      const enable = vi.spyOn(manager, 'enable');
      // @ts-expect-error - partial data
      await manager.apply({ mic_default_on: true }, true);
      expect(enable).not.toHaveBeenCalled();
    });

    it('should publish the audio stream when mic is turned on before settings are applied', async () => {
      await manager.enable();
      // @ts-expect-error - private api
      vi.spyOn(manager, 'publishStream');
      // @ts-expect-error - partial data
      await manager.apply({ mic_default_on: true }, true);
      expect(manager['publishStream']).toHaveBeenCalled();
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });
});
