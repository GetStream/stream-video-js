import { combineLatest } from 'rxjs';
import { Call } from '../Call';
import { isReactNative } from '../helpers/platforms';
import { SpeakerState } from './SpeakerState';
import { deviceIds$, getAudioOutputDevices } from './devices';
import {
  AudioSettingsRequestDefaultDeviceEnum,
  CallSettingsResponse,
} from '../gen/coordinator';
import {
  defaultDeviceId,
  DevicePersistenceOptions,
  readPreferences,
  toPreferenceList,
  writePreferences,
} from './devicePersistence';
import { createSubscription, getCurrentValue } from '../store/rxUtils';

export class SpeakerManager {
  readonly state: SpeakerState;
  private subscriptions: (() => void)[] = [];
  private areSubscriptionsSetUp = false;
  private readonly call: Call;
  private defaultDevice?: AudioSettingsRequestDefaultDeviceEnum;
  private readonly devicePersistence: Required<DevicePersistenceOptions>;

  constructor(
    call: Call,
    devicePreferences: Required<DevicePersistenceOptions>,
  ) {
    this.call = call;
    this.state = new SpeakerState(call.tracer);
    this.devicePersistence = devicePreferences;
    this.setup();
  }

  apply(settings: CallSettingsResponse) {
    return isReactNative() ? this.applyRN(settings) : this.applyWeb();
  }

  private applyWeb() {
    if (!this.devicePersistence.enabled) return;

    const preferences = readPreferences(this.devicePersistence.storageKey);
    const preferenceList = toPreferenceList(preferences.speaker);
    if (preferenceList.length === 0) return;

    const preference = preferenceList[0];
    const nextDeviceId =
      preference.selectedDeviceId === defaultDeviceId
        ? ''
        : preference.selectedDeviceId;
    if (this.state.selectedDevice !== nextDeviceId) {
      this.select(nextDeviceId);
    }
  }

  private applyRN(settings: CallSettingsResponse) {
    /// Determines if the speaker should be enabled based on a priority hierarchy of
    /// settings.
    ///
    /// The priority order is as follows:
    /// 1. If video camera is set to be on by default, speaker is enabled
    /// 2. If audio speaker is set to be on by default, speaker is enabled
    /// 3. If the default audio device is set to speaker, speaker is enabled
    ///
    /// This ensures that the speaker state aligns with the most important user
    /// preference or system requirement.
    const speakerOnWithSettingsPriority =
      settings.video.camera_default_on ||
      settings.audio.speaker_default_on ||
      settings.audio.default_device ===
        AudioSettingsRequestDefaultDeviceEnum.SPEAKER;

    const defaultDevice = speakerOnWithSettingsPriority
      ? AudioSettingsRequestDefaultDeviceEnum.SPEAKER
      : AudioSettingsRequestDefaultDeviceEnum.EARPIECE;

    if (this.defaultDevice !== defaultDevice) {
      this.call.logger.debug('SpeakerManager: setting default device', {
        defaultDevice,
      });
      this.defaultDevice = defaultDevice;
      globalThis.streamRNVideoSDK?.callManager.setup({
        defaultDevice,
      });
    }
  }

  setup() {
    if (this.areSubscriptionsSetUp) return;
    this.areSubscriptionsSetUp = true;

    if (deviceIds$ && !isReactNative()) {
      this.subscriptions.push(
        createSubscription(
          combineLatest([deviceIds$, this.state.selectedDevice$]),
          ([devices, deviceId]) => {
            if (!deviceId) return;
            const device = devices.find(
              (d) => d.deviceId === deviceId && d.kind === 'audiooutput',
            );
            if (!device) this.select('');
          },
        ),
      );
    }

    if (!isReactNative() && this.devicePersistence.enabled) {
      this.subscriptions.push(
        createSubscription(this.state.selectedDevice$, (selectedDevice) => {
          this.persistSpeakerDevicePreference(selectedDevice);
        }),
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
    assertUnsupportedInReactNative();
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
    assertUnsupportedInReactNative();
    this.state.setDevice(deviceId);
  }

  /**
   * Disposes the manager.
   *
   * @internal
   */
  dispose = () => {
    this.subscriptions.forEach((unsubscribe) => unsubscribe());
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
    assertUnsupportedInReactNative();
    if (volume && (volume < 0 || volume > 1)) {
      throw new Error('Volume must be between 0 and 1');
    }
    this.state.setVolume(volume);
  }

  /**
   * Set the volume of a participant.
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

  private persistSpeakerDevicePreference(selectedDevice: string) {
    const { storageKey } = this.devicePersistence;
    const devices = getCurrentValue(this.listDevices()) || [];
    const currentDevice = devices.find((d) => d.deviceId === selectedDevice);
    writePreferences(currentDevice, 'speaker', undefined, storageKey);
  }
}

const assertUnsupportedInReactNative = () => {
  if (isReactNative()) {
    throw new Error(
      'Unsupported in React Native. See: https://getstream.io/video/docs/react-native/guides/camera-and-microphone/#speaker-management',
    );
  }
};
