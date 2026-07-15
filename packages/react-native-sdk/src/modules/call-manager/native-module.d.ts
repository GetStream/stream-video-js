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
   * Enables/disables Telecom-managed mode (Android). Must be set before **start()**.
   * When enabled, audio focus, mode and device routing are owned by the Android
   * Telecom stack (via callingx); StreamInCallManager only keeps proximity,
   * keep-screen-on and mic/output mute.
   */
  setTelecomManagedMode: (enabled: boolean) => void;

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
   * Setup the in call manager.
   */
  setup: () => void;

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
   * Enables or disables stereo audio output.
   * @param enable - Whether to enable stereo audio output.
   */
  setEnableStereoAudioOutput: (enable: boolean) => void;

  /**
   * Sets the microphone mute mode on the call's ADM. No-ops when no call ADM is active. iOS-only.
   * @param mode - The `AudioEngineMuteMode` value.
   */
  setMuteMode: (mode: number) => void;

  /**
   * Keeps the recording chain prepared while muted so the engine stays
   * full-duplex. No-ops when no call ADM is active. iOS-only.
   * @param enabled - Whether to keep recording always prepared.
   */
  setRecordingAlwaysPreparedMode: (enabled: boolean) => void;

  /**
   * Log the current audio state natively.
   * Meant for debugging purposes.
   */
  logAudioState: () => void;

  /**
   * Get the current audio state as a string.
   * Meant for debugging purposes.
   * @returns A string containing the current audio state information.
   */
  getAudioStateLog: () => string;
}

declare module 'react-native' {
  interface NativeModulesStatic {
    StreamInCallManager: CallManager;
  }
}
