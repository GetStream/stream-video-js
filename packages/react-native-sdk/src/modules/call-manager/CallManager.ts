import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import type {
  AudioDeviceStatus,
  IOSAudioInterruptionEvent,
  StreamInCallManagerConfig,
} from './types';
import { videoLoggerSystem } from '@stream-io/video-client';

const NativeManager = NativeModules.StreamInCallManager;
const AUDIO_INTERRUPTION_EVENT = 'StreamInCallManagerAudioInterruption';

const invariant = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

class AndroidCallManager {
  private eventEmitter?: NativeEventEmitter;

  /**
   * Get the current audio device status.
   */
  getAudioDeviceStatus = async (): Promise<AudioDeviceStatus> => {
    invariant(Platform.OS === 'android', 'Supported only on Android');
    return NativeManager.getAudioDeviceStatus();
  };

  /**
   * Switches the audio device to the specified endpoint.
   *
   * @param endpointName the device name.
   */
  selectAudioDevice = (endpointName: string): void => {
    invariant(Platform.OS === 'android', 'Supported only on Android');
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
    this.eventEmitter ??= new NativeEventEmitter(NativeManager);
    const s = this.eventEmitter.addListener('onAudioDeviceChanged', onChange);
    return () => s.remove();
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

export class CallManager {
  android = new AndroidCallManager();
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
      .debug('stop: cleared call manager config');
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
