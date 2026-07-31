import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import type {
  AudioDeviceEndpointType,
  AudioDevicesState,
  IOSAudioInterruptionEvent,
  StreamInCallManagerConfig,
} from './types';
import type {
  AudioEndpoint as CallingxAudioEndpoint,
  AudioEndpointsSnapshot as CallingxAudioSnapshot,
} from '@stream-io/react-native-callingx';
import { videoLoggerSystem } from '@stream-io/video-client';
import { getCallingxLibIfAvailable } from '../../utils/push/libs';

const NativeManager = NativeModules.StreamInCallManager;
const CallingxModule = getCallingxLibIfAvailable();
const AUDIO_INTERRUPTION_EVENT = 'StreamInCallManagerAudioInterruption';
const AUDIO_DEVICE_CHANGED_EVENT = 'onAudioDeviceChanged';

const invariant = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

/**
 * Runs a fire-and-forget native call, logging instead of throwing on a bridge
 * error so it can't crash the caller or an event-dispatch loop.
 */
const safeNativeCall = (label: string, fn: () => void): void => {
  try {
    fn();
  } catch (error) {
    videoLoggerSystem.getLogger('CallManager').warn(`${label} failed`, error);
  }
};

/**
 * On Android, whether the current call is managed by Telecom (via callingx).
 * In that mode, audio routing/mode is owned by Telecom and StreamInCallManager audio methods should not be used
 */
const isAndroidTelecomManaged = (): boolean => {
  if (Platform.OS !== 'android' || !CallingxModule) {
    return false;
  }
  return (
    CallingxModule.isSetup &&
    CallingxModule.isTelecomBacked &&
    (CallingxModule.hasRegisteredCall() || CallingxModule.isOngoingCallsEnabled)
  );
};

/**
 * When the current call is Telecom-managed, returns the callingx module and the
 * registered callId. Centralizes the guard so call sites don't repeat the module /
 * callId checks — `isAndroidTelecomManaged()` already implies the module exists, but
 * the extra narrowing here is what makes that provable to the type-checker.
 */
const getTelecomContext = ():
  | { cx: NonNullable<typeof CallingxModule>; callId: string }
  | undefined => {
  if (!isAndroidTelecomManaged() || !CallingxModule) {
    return undefined;
  }
  const callId = CallingxModule.getRegisteredCallIds()[0];
  if (!callId) {
    return undefined;
  }
  return { cx: CallingxModule, callId };
};

/** Map a generic Telecom endpoint type to the SDK's endpoint type. */
const endpointTypeToDisplayName = (type: string): AudioDeviceEndpointType => {
  switch (type) {
    case 'earpiece':
      return 'Earpiece';
    case 'speaker':
      return 'Speaker';
    case 'wired_headset':
      return 'Wired Headset';
    case 'bluetooth':
      return 'Bluetooth Device';
    default:
      return 'Unknown';
  }
};

/** Adapt a callingx endpoints snapshot to the SDK's {@link AudioDevicesState}. */
const snapshotToState = (
  snapshot: CallingxAudioSnapshot,
): AudioDevicesState => ({
  // callingx endpoint ids are stable and unique — use them directly as the
  // device id, so `select(device.id)` maps straight back to a Telecom endpoint.
  devices: snapshot.endpoints.map((e) => ({
    id: e.id,
    name: e.name,
    type: endpointTypeToDisplayName(e.type),
  })),
  selectedDeviceId: snapshot.currentEndpoint?.id,
  currentEndpointType: snapshot.currentEndpoint
    ? endpointTypeToDisplayName(snapshot.currentEndpoint.type)
    : 'Unknown',
});

/**
 * Cross-platform audio output device picker.
 */
class AudioDevicesManager {
  private eventEmitter?: NativeEventEmitter;
  private interruptionReassertSetup = false;

  /**
   * iOS + CallKit only: re-assert the user's output pick after an interruption ends.
   *
   * On interruption-end iOS clears the ephemeral route override (`setPreferredInput` /
   * `overrideOutputAudioPort`) and doesn't restore it, and callingx re-applies its config
   * only on engine-enable — not the engine-restart of interruption recovery.
   */
  private ensureInterruptionReassert = () => {
    if (this.interruptionReassertSetup) return; // subscibed once per app lifetime
    if (Platform.OS !== 'ios' || !CallingxModule) return;
    this.interruptionReassertSetup = true;
    CallingxModule.addEventListener('didAudioInterruption', (event) => {
      if (event.phase === 'ended') {
        safeNativeCall('reapplyAudioRoute', () =>
          NativeManager.reapplyAudioRoute(),
        );
      }
    });
  };

  /**
   * Get the current audio device state (available devices + the selected one).
   * Read directly from the audio session, so it works on every path.
   */
  getStatus = async (): Promise<AudioDevicesState> => {
    // Android Telecom owns routing: read the endpoint snapshot from callingx.
    const tc = getTelecomContext();
    if (tc) {
      const snapshot = await tc.cx.getAvailableAudioEndpoints(tc.callId);
      return snapshotToState(snapshot);
    }
    return NativeManager.getAudioDeviceStatus();
  };

  /**
   * Switch the audio output to the device with the given id.
   *
   * @param deviceId the stable {@link AudioDevice.id} (not the display name).
   */
  select = (deviceId: string): void => {
    // Android Telecom owns routing: the device id is the callingx endpoint id,
    // so route by it directly (no name lookup needed).
    const tc = getTelecomContext();
    if (tc) {
      const { cx, callId } = tc;
      cx.requestAudioEndpointChange(callId, deviceId).catch((error) => {
        videoLoggerSystem
          .getLogger('CallManager')
          .warn(
            `select: failed to route to "${deviceId}" for call ${callId} via Telecom`,
            error,
          );
      });
      return;
    }
    this.ensureInterruptionReassert();
    safeNativeCall('chooseAudioDeviceEndpoint', () =>
      NativeManager.chooseAudioDeviceEndpoint(deviceId),
    );
  };

  /**
   * Register a listener for audio device changes. Returns an unsubscribe fn.
   *
   * @param onChange called with the latest {@link AudioDevicesState} on change.
   */
  addChangeListener = (
    onChange: (state: AudioDevicesState) => void,
  ): (() => void) => {
    let active = true;
    const unsubscribes: Array<() => void> = [];

    // callingx-owned route changes (Android Telecom + iOS CallKit). The event is
    // signal-only, so re-read the current state — ignoring a resolve that lands
    // after unsubscribe, and swallowing bridge rejections.
    if (CallingxModule) {
      const cxSub = CallingxModule.addEventListener(
        'didChangeAudioRoute',
        () => {
          this.getStatus()
            .then((state) => {
              if (active) onChange(state);
            })
            .catch((error) => {
              videoLoggerSystem
                .getLogger('CallManager')
                .warn('addChangeListener: getStatus failed', error);
            });
        },
      );
      unsubscribes.push(() => cxSub.remove());
    }

    // SDK-managed route changes (non-callingx calls).
    this.eventEmitter =
      this.eventEmitter ?? new NativeEventEmitter(NativeManager);
    const sdkSub = this.eventEmitter.addListener(
      AUDIO_DEVICE_CHANGED_EVENT,
      onChange,
    );
    unsubscribes.push(() => sdkSub.remove());

    return () => {
      active = false;
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  };
}

class IOSCallManager {
  private eventEmitter?: NativeEventEmitter;

  /**
   * Will trigger the iOS device selector.
   */
  showDeviceSelector = (): void => {
    invariant(Platform.OS === 'ios', 'Supported only on iOS');
    NativeManager.showAudioRoutePicker();
  };

  /**
   * Register a listener for iOS audio interruptions.
   *
   * @param onInterruption callback to be called when iOS reports an audio interruption.
   */
  addAudioInterruptionListener = (
    onInterruption: (event: IOSAudioInterruptionEvent) => void,
  ): (() => void) => {
    invariant(Platform.OS === 'ios', 'Supported only on iOS');
    this.eventEmitter ??= new NativeEventEmitter(NativeManager);
    const s = this.eventEmitter.addListener(
      AUDIO_INTERRUPTION_EVENT,
      onInterruption,
    );
    return () => s.remove();
  };
}

class SpeakerManager {
  /**
   * Mutes or unmutes the speaker.
   */
  setMute = (mute: boolean): void => {
    if (mute) {
      NativeManager.muteAudioOutput();
    } else {
      NativeManager.unmuteAudioOutput();
    }
  };

  /**
   * Forces speakerphone on/off.
   */
  setForceSpeakerphoneOn = (force: boolean): void => {
    const tc = getTelecomContext();
    if (tc) {
      const { cx, callId } = tc;
      // Telecom owns routing: map on -> speaker endpoint, off -> highest-priority
      // non-speaker endpoint (wired > bluetooth > earpiece), mirroring classic behavior.
      cx.getAvailableAudioEndpoints(callId)
        .then((snapshot) => {
          let target: CallingxAudioEndpoint | undefined;
          if (force) {
            target = snapshot.endpoints.find((e) => e.type === 'speaker');
          } else {
            // Priority for the "speakerphone off" fallback: prefer wired, then bluetooth, then earpiece.
            for (const type of ['wired_headset', 'bluetooth', 'earpiece']) {
              target = snapshot.endpoints.find((e) => e.type === type);
              if (target) break;
            }
          }
          if (target) {
            return cx.requestAudioEndpointChange(callId, target.id);
          }
          return undefined;
        })
        .catch((error) => {
          videoLoggerSystem
            .getLogger('CallManager')
            .warn(
              `setForceSpeakerphoneOn(${force}): failed to route for call ${callId} via Telecom`,
              error,
            );
        });
      return;
    }
    NativeManager.setForceSpeakerphoneOn(force);
  };
}

export class CallManager {
  audioDevices = new AudioDevicesManager();
  ios = new IOSCallManager();
  speaker = new SpeakerManager();

  /**
   * The audio config recorded via {@link start}. The SDK's internal call manager reads it at the
   * next join-time start and applies it before the native audio manager is activated.
   */
  private storedConfig?: StreamInCallManagerConfig;

  /**
   * The config recorded via {@link start}.
   *
   * @internal Read by the SDK's internal call manager at join; not intended for app use.
   */
  getStoredConfig = (): StreamInCallManagerConfig | undefined =>
    this.storedConfig;

  /**
   * Records the desired audio config for the call.
   *
   * This does NOT start the native audio manager — the SDK owns native start/stop and applies this
   * config at the next join-time start (before the audio manager is activated). Call it **before**
   * joining. Calling it mid-call only updates the stored config; it does not change the running
   * call's audio, and the new config takes effect on the next call/rejoin.
   *
   * @param config.audioRole The audio role to set. It can be one of the following:
   * - `'communicator'`: (Default) For use cases like video or voice calls.
   * It prioritizes low latency and allows manual audio device switching.
   * Audio routing is controlled by the SDK.
   * - `'listener'`: For use cases like livestream viewing.
   * It prioritizes high-quality stereo audio streaming.
   * Audio routing is controlled by the OS, and manual switching is not supported.
   *
   * @param config.deviceEndpointType Overrides the default audio device endpoint. When omitted,
   * the SDK uses the device derived from the call settings. It can be one of the following:
   * - `'speaker'`: For normal video or voice calls.
   * - `'earpiece'`: For voice-only mobile call type scenarios.
   *
   * @param config.enableStereoAudioOutput Whether to enable stereo audio output. Only supported for listener audio role.
   */
  start = (config?: StreamInCallManagerConfig): void => {
    this.storedConfig = config;
    videoLoggerSystem
      .getLogger('CallManager')
      .debug('start: stored call manager config', { config });
  };

  /**
   * Clears the stored audio config.
   */
  stop = (): void => {
    this.storedConfig = undefined;
    videoLoggerSystem
      .getLogger('CallManager')
      .debug('[public] stop(): cleared stored config');
  };

  /**
   * For debugging purposes, will emit a log event with the current audio state.
   * in the native layer.
   *
   * NOTE: This method might be called outside of the call JOIN/LEFT window,
   * so it may lead to default peer connection factory and adm being created.
   */
  logAudioState = (): void => NativeManager.logAudioState();

  /**
   * For debugging purposes, returns the current audio state as a string.
   *
   * NOTE: This method might be called outside of the call JOIN/LEFT window,
   * so it may lead to default peer connection factory and adm being created.
   *
   * @returns A string containing the current audio state information.
   */
  getAudioStateLog = (): string => NativeManager.getAudioStateLog();
}
