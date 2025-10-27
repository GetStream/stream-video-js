import 'react-native';
import type { NativeModule } from 'react-native';
import type { AudioDeviceStatus, AudioRole, DeviceEndpointType } from './types';

export interface CallManager extends NativeModule {
  /**
   * Sets the audio role for the call. This should be done before calling **start()**.
   *
   * @param role The audio role to set. It can be one of the following:
   * - `'communicator'`: (Default) For use cases like video or voice calls.
   * It prioritizes low latency and allows manual audio device switching.
   * Audio routing is controlled by the SDK.
   * - `'listener'`: For use cases like livestream viewing.
   * It prioritizes high-quality stereo audio streaming.
   * Audio routing is controlled by the OS and manual switching is not supported.
   */
  setAudioRole: (role: AudioRole) => void;

  /**
   * Sets the default audio device endpoint type for the call. This should be done before calling **start()**.
   * @param type The default audio device endpoint type to set. It can be one of the following:
   * - `'speaker'`: (Default) For normal video or voice calls.
   * - `'earpiece'`: For voice only mobile call type scenarios.
   */
  setDefaultAudioDeviceEndpointType: (type: DeviceEndpointType) => void;

  /**
   * Choose an audio device endpoint.
   * @param endpointName - The name of the audio device endpoint to choose.
   */
  chooseAudioDeviceEndpoint: (endpoint: string) => void;

  /**
   * Get the current audio device status.
   * @returns The audio device status.
   */
  getAudioDeviceStatus: () => Promise<AudioDeviceStatus>;

  /**
   * Shows the iOS audio route picker.
   */
  showAudioRoutePicker: () => void;

  /**
   * Start the in call manager.
   */
  start: () => void;

  /**
   * Stop the in call manager.
   */
  stop: () => void;

  /**
   * Mutes the speaker
   */
  muteAudioOutput: () => void;

  /**
   * Unmutes the speaker
   */
  unmuteAudioOutput: () => void;

  /**
   * Forces speakerphone on/off.
   */
  setForceSpeakerphoneOn: (boolean) => void;

  /**
   * Log the current audio state natively.
   * Meant for debugging purposes.
   */
  logAudioState: () => void;
}

declare module 'react-native' {
  interface NativeModulesStatic {
    StreamInCallManager: CallManager;
  }
}
