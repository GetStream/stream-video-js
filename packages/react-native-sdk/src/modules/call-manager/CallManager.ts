import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import type {
  AudioDevicesState,
  IOSAudioInterruptionEvent,
  StreamInCallManagerConfig,
} from './types';
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
 * Cross-platform audio output device picker. Works on Android, iOS, and iOS
 * with CallKit (`@stream-io/react-native-callingx`).
 *
 * When CallKit owns the audio session, calls are transparently routed through
 * callingx; otherwise they go to the SDK's in-call manager. Consumers don't
 * need to branch on platform or call type.
 */
class AudioDevicesManager {
  private eventEmitter?: NativeEventEmitter;

  /**
   * Get the current audio device state (available devices + the selected one).
   * Read directly from the audio session, so it works on every path.
   */
  getStatus = async (): Promise<AudioDevicesState> => {
    return NativeManager.getAudioDeviceStatus();
  };

  /**
   * Switch the audio output to the device with the given id.
   *
   * @param deviceId the stable {@link AudioDevice.id} (not the display name).
   */
  select = (deviceId: string): void => {
    // One native call covers both paths: the in-call manager applies the switch when
    // the SDK owns the session, and hands the pick to callingx (via the shared
    // CallingxSessionOwnership bridge) when CallKit owns it.
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

    // Primary source: the SDK's in-call manager. Its event carries the full
    // state and is the single source backing getStatus().
    this.eventEmitter ??= new NativeEventEmitter(NativeManager);
    const sdkSub = this.eventEmitter.addListener(
      AUDIO_DEVICE_CHANGED_EVENT,
      onChange,
    );
    unsubscribes.push(() => sdkSub.remove());

    // On iOS, when callingx (CallKit) owns the session, route changes arrive via
    // its signal and the SDK's observer is suppressed. Subscribe to both so an
    // ownership change after subscription can't strand the listener; re-fetch to
    // normalize (and ignore the rare duplicate fire — setState is idempotent).
    if (Platform.OS === 'ios' && CallingxModule) {
      const cxSub = CallingxModule.addEventListener(
        'didChangeAudioRoute',
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
