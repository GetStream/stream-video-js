import { isReactNative } from '../helpers/platforms';
import { SpeakerState } from './SpeakerState';
import { getAudioOutputDevices } from './devices';

export class SpeakerManager {
  public readonly state = new SpeakerState();

  constructor() {}

  /**
   * Lists the available audio output devices
   *
   * Note: It prompts the user for a permission to use devices (if not already granted)
   *
   * @returns an Observable that will be updated if a device is connected or disconnected
   */
  listDevices() {
    return getAudioOutputDevices();
  }

  /**
   * Select device
   *
   * Note: this method is not supported in React Native
   *
   * @param deviceId empty string means the system default
   */
  select(deviceId: string) {
    if (isReactNative()) {
      throw new Error('This feature is not supported in React Native');
    }
    this.state.setDevice(deviceId);
  }

  /**
   * Set the volume of the audio elements
   * @param volume a number between 0 and 1
   *
   * Note: this method is not supported in React Native
   */
  setVolume(volume: number) {
    if (isReactNative()) {
      throw new Error('This feature is not supported in React Native');
    }
    if (volume && (volume < 0 || volume > 1)) {
      throw new Error('Volume must be between 0 and 1');
    }
    this.state.setVolume(volume);
  }
}
