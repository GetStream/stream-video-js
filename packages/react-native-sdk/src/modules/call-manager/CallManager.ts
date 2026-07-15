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
import { getCallingxLibIfAvailable } from '../../utils/push/libs/callingx';
import { videoLoggerSystem } from '@stream-io/video-client';

const NativeManager = NativeModules.StreamInCallManager;
const CallingxModule = getCallingxLibIfAvailable();
const AUDIO_INTERRUPTION_EVENT = 'StreamInCallManagerAudioInterruption';
const AUDIO_DEVICE_CHANGED_EVENT = 'onAudioDeviceChanged';

const invariant = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
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
 * Cross-platform audio output device picker. Works on Android, iOS, iOS with
 * CallKit, and Android with Telecom (`@stream-io/react-native-callingx`).
 *
 * When CallKit (iOS) or Telecom (Android) owns the audio session, calls are
 * transparently routed through callingx; otherwise they go to the SDK's
 * in-call manager. Consumers don't need to branch on platform or call type.
 */
class AudioDevicesManager {
  private eventEmitter?: NativeEventEmitter;

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
    // One native call covers the remaining paths: the in-call manager applies the
    // switch when the SDK owns the session, and hands the pick to callingx (via the
    // shared CallingxSessionOwnership bridge) when CallKit (iOS) owns it.
    NativeManager.chooseAudioDeviceEndpoint(deviceId);
  };

  /**
   * Register a listener for audio device changes. Returns an unsubscribe fn.
   *
   * @param onChange called with the latest {@link AudioDevicesState} on change.
   */
  addChangeListener = (
    onChange: (state: AudioDevicesState) => void,
  ): (() => void) => {
    const unsubscribes: Array<() => void> = [];

    // Android Telecom (callingx) route changes.
    if (
      Platform.OS === 'android' &&
      CallingxModule?.isSetup &&
      CallingxModule.isTelecomBacked
    ) {
      const cxSub = CallingxModule.addEventListener(
        'didChangeAudioEndpoints',
        (params) => onChange(snapshotToState(params)),
      );
      unsubscribes.push(() => cxSub.remove());
    }

    // Primary source: the SDK's in-call manager. Its event carries the full
    // state and is the single source backing getStatus() on non-Telecom calls.
    // Native suppresses these while in telecom-managed mode, and callingx emits
    // no endpoint events for non-Telecom calls, so the two Android sources never
    // overlap at runtime — safe to keep both subscribed in parallel.
    this.eventEmitter ??= new NativeEventEmitter(NativeManager);
    const sdkSub = this.eventEmitter.addListener(
      AUDIO_DEVICE_CHANGED_EVENT,
      onChange,
    );
    unsubscribes.push(() => sdkSub.remove());

    // On iOS, when callingx (CallKit) owns the session, the SDK's own route-change
    // observer is suppressed. callingx doesn't emit a per-route-change event, but it
    // does signal session (re)activation — the point at which CallKit establishes /
    // re-establishes the route — so re-fetch status then to normalize. Subscribe
    // alongside the SDK source so an ownership change after subscription can't strand
    // the listener (the duplicate/no-op fire is harmless — setState is idempotent).
    if (Platform.OS === 'ios' && CallingxModule) {
      const cxSub = CallingxModule.addEventListener(
        'didActivateAudioSession',
        () => {
          this.getStatus().then(onChange);
        },
      );
      unsubscribes.push(() => cxSub.remove());
    }

    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
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

const shouldBypassForCallKit = (): boolean => {
  if (Platform.OS !== 'ios') {
    return false;
  }
  if (!CallingxModule) {
    return false;
  }
  return (
    CallingxModule.isSetup &&
    (CallingxModule.hasRegisteredCall() || CallingxModule.isOngoingCallsEnabled)
  );
};

export class CallManager {
  audioDevices = new AudioDevicesManager();
  ios = new IOSCallManager();
  speaker = new SpeakerManager();

  /**
   * Starts the in call manager.
   *
   * @param config.audioRole The audio role to set. It can be one of the following:
   * - `'communicator'`: (Default) For use cases like video or voice calls.
   * It prioritizes low latency and allows manual audio device switching.
   * Audio routing is controlled by the SDK.
   * - `'listener'`: For use cases like livestream viewing.
   * It prioritizes high-quality stereo audio streaming.
   * Audio routing is controlled by the OS, and manual switching is not supported.
   *
   * @param config.deviceEndpointType The default audio device endpoint type to set. It can be one of the following:
   * - `'speaker'`: (Default) For normal video or voice calls.
   * - `'earpiece'`: For voice-only mobile call type scenarios.
   *
   * @param config.enableStereoAudioOutput Whether to enable stereo audio output. Only supported for listener audio role.
   */
  start = (config?: StreamInCallManagerConfig): void => {
    if (shouldBypassForCallKit()) {
      // Forward only the passive endpoint preference; callingx reads it when
      // CallKit drives session activation.
      if (config?.audioRole === 'communicator' && CallingxModule) {
        const type = config.deviceEndpointType ?? 'speaker';
        CallingxModule.setDefaultAudioDeviceEndpointType(type);
      }
      videoLoggerSystem
        .getLogger('CallManager')
        .debug(
          'start: skipping start as callkit is handling the audio session',
        );
      return;
    }
    if (isAndroidTelecomManaged()) {
      // Telecom owns routing/focus; forward the sticky preference to callingx and run in
      // telecom-managed mode (StreamInCallManager keeps proximity/keep-screen-on only).
      if (config?.audioRole !== 'listener' && CallingxModule) {
        CallingxModule.setDefaultAudioDeviceEndpointType(
          config?.deviceEndpointType ?? 'speaker',
        );
      }
      NativeManager.setTelecomManagedMode(true);
      NativeManager.setAudioRole(config?.audioRole ?? 'communicator');
      NativeManager.start();
      return;
    }
    if (Platform.OS === 'android') {
      NativeManager.setTelecomManagedMode(false);
    }
    NativeManager.setAudioRole(config?.audioRole ?? 'communicator');
    if (config?.audioRole === 'communicator') {
      const type = config.deviceEndpointType ?? 'speaker';
      NativeManager.setDefaultAudioDeviceEndpointType(type);
    }
    if (config?.audioRole === 'listener' && config.enableStereoAudioOutput) {
      NativeManager.setEnableStereoAudioOutput(true);
    }
    NativeManager.start();
  };

  /**
   * Stops the in call manager.
   */
  stop = (): void => {
    if (shouldBypassForCallKit()) {
      videoLoggerSystem
        .getLogger('CallManager')
        .debug('stop: skipping stop as callkit is handling the audio session');
      return;
    }
    NativeManager.stop();
  };

  /**
   * For debugging purposes, will emit a log event with the current audio state.
   * in the native layer.
   */
  logAudioState = (): void => NativeManager.logAudioState();

  /**
   * For debugging purposes, returns the current audio state as a string.
   * @returns A string containing the current audio state information.
   */
  getAudioStateLog = (): string => NativeManager.getAudioStateLog();
}
