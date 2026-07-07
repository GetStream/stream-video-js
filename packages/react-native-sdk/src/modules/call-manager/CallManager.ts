import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import type {
  AudioDeviceStatus,
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

/** The callId of the (single) call currently registered with Telecom, if any. */
const getTelecomCallId = (): string | undefined =>
  CallingxModule?.getRegisteredCallIds()[0];

/** Map a generic Telecom endpoint type to the SDK's endpoint display name. */
const endpointTypeToDisplayName = (
  type: string,
): AudioDeviceStatus['currentEndpointType'] => {
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

/** Adapt a callingx endpoints snapshot to the SDK's {@link AudioDeviceStatus}. */
const snapshotToStatus = (
  snapshot: CallingxAudioSnapshot,
): AudioDeviceStatus => ({
  devices: snapshot.endpoints.map((e) => e.name),
  currentEndpointType: snapshot.currentEndpoint
    ? endpointTypeToDisplayName(snapshot.currentEndpoint.type)
    : 'Unknown',
  selectedDevice: snapshot.currentEndpoint?.name ?? '',
});

class AndroidCallManager {
  private eventEmitter?: NativeEventEmitter;

  /**
   * Get the current audio device status.
   */
  getAudioDeviceStatus = async (): Promise<AudioDeviceStatus> => {
    invariant(Platform.OS === 'android', 'Supported only on Android');
    if (isAndroidTelecomManaged()) {
      const callId = getTelecomCallId();
      if (callId && CallingxModule) {
        const snapshot =
          await CallingxModule.getAvailableAudioEndpoints(callId);
        return snapshotToStatus(snapshot);
      }
    }
    return NativeManager.getAudioDeviceStatus();
  };

  /**
   * Switches the audio device to the specified endpoint.
   *
   * @param endpointName the device name.
   */
  selectAudioDevice = (endpointName: string): void => {
    invariant(Platform.OS === 'android', 'Supported only on Android');
    if (isAndroidTelecomManaged()) {
      const callId = getTelecomCallId();
      const cx = CallingxModule;
      if (callId && cx) {
        // Resolve name -> endpoint id from the current Telecom snapshot, then route via Telecom.
        cx.getAvailableAudioEndpoints(callId)
          .then((snapshot) => {
            const target = snapshot.endpoints.find(
              (e) => e.name === endpointName,
            );
            if (target) {
              return cx.requestAudioEndpointChange(callId, target.id);
            }
            return undefined;
          })
          .catch((error) => {
            videoLoggerSystem
              .getLogger('CallManager')
              .warn(
                `selectAudioDevice: failed to route to "${endpointName}" for call ${callId} via Telecom`,
                error,
              );
          });
        return;
      }
    }
    NativeManager.chooseAudioDeviceEndpoint(endpointName);
  };

  /**
   * Register a listener for audio device changes.
   * @param onChange callback to be called when the audio device changes.
   */
  addAudioDeviceChangeListener = (
    onChange: (audioDeviceStatus: AudioDeviceStatus) => void,
  ): (() => void) => {
    invariant(Platform.OS === 'android', 'Supported only on Android');
    const cleanups: Array<() => void> = [];

    // Telecom (callingx) route changes.
    if (CallingxModule?.isSetup && CallingxModule.isTelecomBacked) {
      const sub = CallingxModule.addEventListener(
        'didChangeAudioEndpoints',
        (params) => onChange(snapshotToStatus(params)),
      );
      cleanups.push(() => sub.remove());
    }

    // StreamInCallManager route changes (non-Telecom calls). Native
    // suppresses these while in telecom-managed mode, and callingx emits no
    // endpoint events for non-Telecom calls, so the two sources never overlap
    // at runtime — safe to keep both subscribed in parallel.
    this.eventEmitter ??= new NativeEventEmitter(NativeManager);
    const s = this.eventEmitter.addListener('onAudioDeviceChanged', onChange);
    cleanups.push(() => s.remove());

    return () => cleanups.forEach((cleanup) => cleanup());
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
    if (isAndroidTelecomManaged()) {
      const callId = getTelecomCallId();
      const cx = CallingxModule;
      if (callId && cx) {
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
  android = new AndroidCallManager();
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
