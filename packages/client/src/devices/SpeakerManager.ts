import { firstValue } from '../store/subscribable';
import { Call } from '../Call';
import { isReactNative } from '../helpers/platforms';
import { SpeakerState } from './SpeakerState';
import {
  canEnumerateDevices,
  deviceIds$,
  getAudioBrowserPermission,
  getAudioOutputDevices,
  loadAudioOutputDevices,
} from './devices';
import {
  AudioSettingsRequestDefaultDeviceEnum,
  CallSettingsResponse,
} from '../gen/coordinator';
import {
  createSyntheticDevice,
  defaultDeviceId,
  DevicePersistenceOptions,
  readPreferences,
  toPreferenceList,
  writePreferences,
} from './devicePersistence';
import { createSubscription } from '../store/subscription';

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

  async apply(settings: CallSettingsResponse): Promise<void> {
    if (isReactNative()) {
      this.applyRN(settings);
      return;
    }
    await this.applyWeb();
  }

  private async applyWeb() {
    const { enabled, storageKey } = this.devicePersistence;
    if (!enabled) return;

    const preferences = readPreferences(storageKey);
    const preferenceList = toPreferenceList(preferences.speaker);
    if (preferenceList.length === 0) return;

    const preference = preferenceList[0];
    const nextDeviceId =
      preference.selectedDeviceId === defaultDeviceId
        ? ''
        : preference.selectedDeviceId;
    if (!nextDeviceId) {
      if (this.state.selectedDevice !== nextDeviceId) {
        this.select(nextDeviceId);
      }
      return;
    }

    const permissionState = await firstValue(
      getAudioBrowserPermission(this.call.tracer).state$,
    );
    if (permissionState !== 'granted') return;

    const devices = await this.loadDevices();
    const device =
      this.findDevice(devices, nextDeviceId) ??
      (preference.selectedDeviceLabel
        ? devices.find((d) => d.label === preference.selectedDeviceLabel)
        : undefined);
    if (device && this.state.selectedDevice !== device.deviceId) {
      this.select(device.deviceId);
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
        isRingingTypeCall: this.call.ringing,
        cid: this.call.cid,
      });
    }
  }

  setup() {
    if (this.areSubscriptionsSetUp) return;
    this.areSubscriptionsSetUp = true;

    if (canEnumerateDevices() && !isReactNative()) {
      this.subscriptions.push(
        // Detecting a disconnect means comparing the device list against the
        // previous one, so we simply remember it.
        ((): (() => void) => {
          let prevDevices = deviceIds$.getValue();
          return createSubscription(deviceIds$, (currentDevices) => {
            const previous = prevDevices;
            prevDevices = currentDevices;
            const deviceId = this.state.selectedDevice;
            if (!deviceId) return;
            const isDisconnected =
              this.findDevice(previous, deviceId) &&
              !this.findDevice(currentDevices, deviceId);
            if (isDisconnected) this.select('');
          });
        })(),
      );
    }

    if (!isReactNative() && this.devicePersistence.enabled) {
      // Reads both stores directly; they are synchronous, so there is nothing
      // to join. Either one changing is a reason to re-check.
      const permission = getAudioBrowserPermission(this.call.tracer);
      const persistIfGranted = () => {
        const { selectedDevice } = this.state;
        if (!selectedDevice || permission.state !== 'granted') return;
        this.persistSpeakerDevicePreference(selectedDevice);
      };
      this.subscriptions.push(
        createSubscription(this.state.selectedDevice$, persistIfGranted),
        createSubscription(permission.state$, persistIfGranted),
      );
    }
  }

  /**
   * Lists the available audio output devices
   *
   * Note: It prompts the user for a permission to use devices (if not already granted)
   * Note: This method is not supported in React Native
   *
   * @returns a source that updates as devices are connected or disconnected
   */
  listDevices() {
    assertUnsupportedInReactNative();
    return getAudioOutputDevices(this.call.tracer);
  }

  /**
   * Resolves with the available audio output devices, waiting for the first
   * enumeration to complete rather than reporting an empty list.
   */
  async loadDevices(): Promise<MediaDeviceInfo[]> {
    assertUnsupportedInReactNative();
    return loadAudioOutputDevices(this.call.tracer);
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
    this.defaultDevice = undefined;
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

  private findDevice = (devices: MediaDeviceInfo[], deviceId: string) =>
    devices.find((d) => d.deviceId === deviceId && d.kind === 'audiooutput');

  private persistSpeakerDevicePreference(selectedDevice: string) {
    const { storageKey } = this.devicePersistence;
    const devices = this.listDevices().getValue();
    const currentDevice =
      devices.find((d) => d.deviceId === selectedDevice) ??
      createSyntheticDevice(selectedDevice, 'audiooutput');
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
