import { combineLatest, Subscription } from 'rxjs';
import { Call } from '../Call';
import { isReactNative } from '../helpers/platforms';
import { SpeakerState } from './SpeakerState';
import { deviceIds$, getAudioOutputDevices } from './devices';

export class SpeakerManager {
  readonly state: SpeakerState;
  private subscriptions: Subscription[] = [];
  private areSubscriptionsSetUp = false;
  private readonly call: Call;

  constructor(call: Call) {
    this.call = call;
    this.state = new SpeakerState(call.tracer);
    this.setup();
  }

  setup() {
    if (this.areSubscriptionsSetUp) {
      return;
    }

    this.areSubscriptionsSetUp = true;

    if (deviceIds$ && !isReactNative()) {
      this.subscriptions.push(
        combineLatest([deviceIds$!, this.state.selectedDevice$]).subscribe(
          ([devices, deviceId]) => {
            if (!deviceId) {
              return;
            }
            const device = devices.find(
              (d) => d.deviceId === deviceId && d.kind === 'audiooutput',
            );
            if (!device) {
              this.select('');
            }
          },
        ),
      );
    }
  }

  /**
   * Lists the available audio output devices
   *
   * Note: It prompts the user for a permission to use devices (if not already granted)
   * Note: This method is not supported in React Native
   *
   * @returns an Observable that will be updated if a device is connected or disconnected
   */
  listDevices() {
    if (isReactNative()) {
      throw new Error(
        'This feature is not supported in React Native. Please visit https://getstream.io/video/docs/reactnative/core/camera-and-microphone/#speaker-management for more details',
      );
    }
    return getAudioOutputDevices(this.call.tracer);
  }

  /**
   * Select a device.
   *
   * Note: This method is not supported in React Native
   *
   * @param deviceId empty string means the system default
   */
  select(deviceId: string) {
    if (isReactNative()) {
      throw new Error(
        'This feature is not supported in React Native. Please visit https://getstream.io/video/docs/reactnative/core/camera-and-microphone/#speaker-management for more details',
      );
    }
    this.state.setDevice(deviceId);
  }

  /**
   * Disposes the manager.
   *
   * @internal
   */
  dispose = () => {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.subscriptions = [];
    this.areSubscriptionsSetUp = false;
  };

  /**
   * Set the volume of the audio elements
   * @param volume a number between 0 and 1.
   *
   * Note: This method is not supported in React Native
   */
  setVolume(volume: number) {
    if (isReactNative()) {
      throw new Error(
        'This feature is not supported in React Native. Please visit https://getstream.io/video/docs/reactnative/core/camera-and-microphone/#speaker-management for more details',
      );
    }
    if (volume && (volume < 0 || volume > 1)) {
      throw new Error('Volume must be between 0 and 1');
    }
    this.state.setVolume(volume);
  }

  /**
   * Set the volume of a participant.
   *
   * Note: This method is not supported in React Native.
   *
   * @param sessionId the participant's session id.
   * @param volume a number between 0 and 1. Set it to `undefined` to use the default volume.
   */
  setParticipantVolume(sessionId: string, volume: number | undefined) {
    if (volume && (volume < 0 || volume > 1)) {
      throw new Error('Volume must be between 0 and 1, or undefined');
    }
    this.call.state.updateParticipant(sessionId, (p) => {
      if (isReactNative() && p.audioStream) {
        for (const track of p.audioStream.getAudioTracks()) {
          // @ts-expect-error track._setVolume is present in react-native-webrtc
          track?._setVolume(volume);
        }
      }
      return { audioVolume: volume };
    });
  }
}
