import { combineLatest, firstValueFrom, pairwise } from 'rxjs';
import { Call } from '../Call';
import { isReactNative } from '../helpers/platforms';
import { SpeakerState } from './SpeakerState';
import {
  deviceIds$,
  getAudioBrowserPermission,
  getAudioOutputDevices,
} from './devices';
import { AudioSettingsRequest, CallSettingsResponse } from '../gen/coordinator';
import {
  createSyntheticDevice,
  defaultDeviceId,
  DevicePersistenceOptions,
  readPreferences,
  toPreferenceList,
  writePreferences,
} from './devicePersistence';
import { createSubscription, getCurrentValue } from '../store/rxUtils';

/**
 * The default audio output for a React Native call, derived from the call
 * settings with this priority:
 * 1. If the camera is on by default, the speaker is used
 * 2. If the speaker is on by default, the speaker is used
 * 3. If the default audio device is the speaker, the speaker is used
 * Otherwise the earpiece. Without settings, the speaker (the native default).
 *
 * @internal
 */
export const getRNDefaultAudioDevice = (
  settings: CallSettingsResponse | undefined,
): AudioSettingsRequest['default_device'] => {
  if (!settings) return 'speaker';
  const speakerOnWithSettingsPriority =
    settings.video.camera_default_on ||
    settings.audio.speaker_default_on ||
    settings.audio.default_device === 'speaker';
  return speakerOnWithSettingsPriority ? 'speaker' : 'earpiece';
};

export class SpeakerManager {
  readonly state: SpeakerState;
  private subscriptions: (() => void)[] = [];
  private areSubscriptionsSetUp = false;
  private readonly call: Call;
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

  /**
   * Restores the persisted output device (web). React Native has no output
   * selection here: the call-settings default goes to the native call manager
   * at join (`getRNDefaultAudioDevice`).
   */
  async apply(): Promise<void> {
    if (isReactNative()) return;
    await this.applyWeb();
  }

  private async applyWeb() {
    const { enabled, storageKey } = this.devicePersistence;
    if (!enabled || !this.state.isDeviceSelectionSupported) return;

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

    const permissionState = await firstValueFrom(
      getAudioBrowserPermission(this.call.tracer).asStateObservable(),
    );
    if (permissionState !== 'granted') return;

    const devices = await firstValueFrom(this.listDevices());
    const device =
      this.findDevice(devices, nextDeviceId) ??
      (preference.selectedDeviceLabel
        ? devices.find((d) => d.label === preference.selectedDeviceLabel)
        : undefined);
    if (device && this.state.selectedDevice !== device.deviceId) {
      this.select(device.deviceId);
    }
  }

  setup() {
    if (this.areSubscriptionsSetUp) return;
    this.areSubscriptionsSetUp = true;

    if (deviceIds$ && !isReactNative()) {
      this.subscriptions.push(
        createSubscription(
          combineLatest([
            deviceIds$!.pipe(pairwise()),
            this.state.selectedDevice$,
          ]),
          ([[prevDevices, currentDevices], deviceId]) => {
            if (!deviceId) return;
            const isDisconnected =
              this.findDevice(prevDevices, deviceId) &&
              !this.findDevice(currentDevices, deviceId);
            if (isDisconnected) this.select('');
          },
        ),
      );
    }

    if (!isReactNative() && this.devicePersistence.enabled) {
      this.subscriptions.push(
        createSubscription(
          combineLatest([
            this.state.selectedDevice$,
            getAudioBrowserPermission(this.call.tracer).asStateObservable(),
          ]),
          ([selectedDevice, browserPermissionState]) => {
            if (!selectedDevice || browserPermissionState !== 'granted') return;

            this.persistSpeakerDevicePreference(selectedDevice);
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

  private findDevice = (devices: MediaDeviceInfo[], deviceId: string) =>
    devices.find((d) => d.deviceId === deviceId && d.kind === 'audiooutput');

  private persistSpeakerDevicePreference(selectedDevice: string) {
    const { storageKey } = this.devicePersistence;
    const devices = getCurrentValue(this.listDevices()) || [];
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
