import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { AudioDeviceStatus, StreamInCallManagerConfig } from './types';

const NativeManager = NativeModules.StreamInCallManager;

const invariant = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

class AndroidCallManager {
  private eventEmitter?: NativeEventEmitter;

  /**
   * Get the current audio device status.
   */
  getAudioDeviceStatus = async () => {
    invariant(Platform.OS === 'android', 'Supported only on Android');
    return NativeManager.getAudioDeviceStatus();
  };

  /**
   * Switches the audio device to the specified endpoint.
   *
   * @param endpointName the device name.
   */
  selectAudioDevice = (endpointName: string) => {
    invariant(Platform.OS === 'android', 'Supported only on Android');
    NativeManager.chooseAudioDeviceEndpoint(endpointName);
  };

  /**
   * Register a listener for audio device changes.
   * @param onChange callback to be called when the audio device changes.
   */
  addAudioDeviceChangeListener = (
    onChange: (audioDeviceStatus: AudioDeviceStatus) => void,
  ) => {
    invariant(Platform.OS === 'android', 'Supported only on Android');
    this.eventEmitter ??= new NativeEventEmitter(NativeManager);
    const s = this.eventEmitter.addListener('onAudioDeviceChanged', onChange);
    return () => s.remove();
  };
}

class IOSCallManager {
  /**
   * Will trigger the iOS device selector.
   */
  showDeviceSelector = () => {
    invariant(Platform.OS === 'ios', 'Supported only on iOS');
    NativeManager.showAudioRoutePicker();
  };
}

class SpeakerManager {
  /**
   * Mutes or unmutes the speaker.
   */
  setMute = (mute: boolean) => {
    if (mute) {
      NativeManager.muteAudioOutput();
    } else {
      NativeManager.unmuteAudioOutput();
    }
  };
}

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
   */
  start = (config?: StreamInCallManagerConfig) => {
    NativeManager.setAudioRole(config?.audioRole ?? 'communicator');
    if (config?.audioRole === 'communicator') {
      const type = config.deviceEndpointType ?? 'speaker';
      NativeManager.setDefaultAudioDeviceEndpointType(type);
    }
    NativeManager.start();
  };

  /**
   * Stops the in call manager.
   */
  stop = () => {
    NativeManager.stop();
  };

  /**
   * For debugging purposes, will emit a log event with the current audio state.
   * in the native layer.
   */
  logAudioState = () => NativeManager.logAudioState();
}
