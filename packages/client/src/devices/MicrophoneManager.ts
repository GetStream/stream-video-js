import { combineLatest, Observable } from 'rxjs';
import type { INoiseCancellation } from '@stream-io/audio-filters-web';
import { Call } from '../Call';
import {
  AudioDeviceManager,
  createAudioConstraints,
} from './AudioDeviceManager';
import { MicrophoneManagerState } from './MicrophoneManagerState';
import { TrackDisableMode } from './DeviceManagerState';
import { getAudioDevices, getAudioStream } from './devices';
import { AudioBitrateProfile, TrackType } from '../gen/video/sfu/models/models';
import { createSoundDetector } from '../helpers/sound-detector';
import { isReactNative } from '../helpers/platforms';
import {
  AudioSettingsResponse,
  NoiseCancellationSettingsModeEnum,
  OwnCapability,
} from '../gen/coordinator';
import { CallingState } from '../store';
import {
  createSafeAsyncSubscription,
  createSubscription,
} from '../store/rxUtils';
import { RNSpeechDetector } from '../helpers/RNSpeechDetector';
import { withoutConcurrency } from '../helpers/concurrency';

export class MicrophoneManager extends AudioDeviceManager<MicrophoneManagerState> {
  private speakingWhileMutedNotificationEnabled = true;
  private soundDetectorConcurrencyTag = Symbol('soundDetectorConcurrencyTag');
  private soundDetectorCleanup?: Function;
  private rnSpeechDetector: RNSpeechDetector | undefined;
  private noiseCancellation: INoiseCancellation | undefined;
  private noiseCancellationChangeUnsubscribe: (() => void) | undefined;
  private noiseCancellationRegistration?: Promise<void>;
  private unregisterNoiseCancellation?: () => Promise<void>;

  constructor(call: Call, disableMode: TrackDisableMode = 'stop-tracks') {
    super(call, new MicrophoneManagerState(disableMode), TrackType.AUDIO);
  }

  override setup(): void {
    super.setup();
    this.subscriptions.push(
      createSafeAsyncSubscription(
        combineLatest([
          this.call.state.callingState$,
          this.call.state.ownCapabilities$,
          this.state.selectedDevice$,
          this.state.status$,
        ]),
        async ([callingState, ownCapabilities, deviceId, status]) => {
          try {
            if (callingState === CallingState.LEFT) {
              await this.stopSpeakingWhileMutedDetection();
            }
            if (callingState !== CallingState.JOINED) return;
            if (!this.speakingWhileMutedNotificationEnabled) return;

            if (ownCapabilities.includes(OwnCapability.SEND_AUDIO)) {
              if (status === 'disabled') {
                await this.startSpeakingWhileMutedDetection(deviceId);
              } else {
                await this.stopSpeakingWhileMutedDetection();
              }
            } else {
              await this.stopSpeakingWhileMutedDetection();
            }
          } catch (err) {
            this.logger.warn('Could not enable speaking while muted', err);
          }
        },
      ),
    );

    this.subscriptions.push(
      createSubscription(this.call.state.callingState$, (callingState) => {
        // do nothing when noise filtering isn't turned on
        if (!this.noiseCancellationRegistration || !this.noiseCancellation)
          return;

        const autoOn =
          this.call.state.settings?.audio.noise_cancellation?.mode ===
          NoiseCancellationSettingsModeEnum.AUTO_ON;

        if (autoOn && callingState === CallingState.JOINED) {
          this.noiseCancellationRegistration
            .then(() => {
              if (this.noiseCancellation?.canAutoEnable) {
                return this.noiseCancellation.canAutoEnable();
              }
              return true;
            })
            .then((canAutoEnable) => {
              if (canAutoEnable) {
                this.noiseCancellation?.enable();
              }
            })
            .catch((err) => {
              this.logger.warn(`Failed to enable noise cancellation`, err);
              return this.call.notifyNoiseCancellationStopped();
            });
        } else if (callingState === CallingState.LEFT) {
          this.noiseCancellationRegistration
            .then(() => this.noiseCancellation?.disable())
            .catch((err) => {
              this.logger.warn(`Failed to disable noise cancellation`, err);
            });
        }
      }),
    );
  }

  /**
   * Enables noise cancellation for the microphone.
   *
   * @param noiseCancellation - a noise cancellation instance to use.
   */
  async enableNoiseCancellation(noiseCancellation: INoiseCancellation) {
    const { ownCapabilities, settings } = this.call.state;
    const hasNoiseCancellationCapability = ownCapabilities.includes(
      OwnCapability.ENABLE_NOISE_CANCELLATION,
    );
    if (!hasNoiseCancellationCapability) {
      throw new Error('Noise cancellation is not available.');
    }
    const noiseCancellationSettings = settings?.audio.noise_cancellation;
    if (
      !noiseCancellationSettings ||
      noiseCancellationSettings.mode ===
        NoiseCancellationSettingsModeEnum.DISABLED
    ) {
      throw new Error('Noise cancellation is disabled for this call type.');
    }
    try {
      this.noiseCancellation = noiseCancellation;

      // listen for change events and notify the SFU
      this.noiseCancellationChangeUnsubscribe = this.noiseCancellation.on(
        'change',
        (enabled: boolean) => {
          this.call.tracer.trace('noiseCancellation.enabled', enabled);
          if (enabled) {
            this.call.notifyNoiseCancellationStarting().catch((err) => {
              this.logger.warn(`notifyNoiseCancellationStart failed`, err);
            });
          } else {
            this.call.notifyNoiseCancellationStopped().catch((err) => {
              this.logger.warn(`notifyNoiseCancellationStop failed`, err);
            });
          }
        },
      );

      if (isReactNative()) {
        // no filter registration in React Native, its done in the native code on app init
        this.noiseCancellationRegistration = Promise.resolve();
      } else {
        const registrationResult = this.registerFilter(
          noiseCancellation.toFilter(),
        );
        this.noiseCancellationRegistration = registrationResult.registered;
        this.unregisterNoiseCancellation = registrationResult.unregister;
        await this.noiseCancellationRegistration;
      }

      // handles an edge case where a noise cancellation is enabled after
      // the participant as joined the call -> we immediately enable NC
      if (
        noiseCancellationSettings.mode ===
          NoiseCancellationSettingsModeEnum.AUTO_ON &&
        this.call.state.callingState === CallingState.JOINED
      ) {
        let canAutoEnable = true;
        if (noiseCancellation.canAutoEnable) {
          canAutoEnable = await noiseCancellation.canAutoEnable();
        }
        if (canAutoEnable) {
          noiseCancellation.enable();
        }
      }
    } catch (e) {
      this.logger.warn('Failed to enable noise cancellation', e);
      await this.disableNoiseCancellation().catch((err) => {
        this.logger.warn('Failed to disable noise cancellation', err);
      });
      throw e;
    }
  }

  /**
   * Disables noise cancellation for the microphone.
   */
  async disableNoiseCancellation() {
    await (this.unregisterNoiseCancellation?.() ?? Promise.resolve())
      .then(() => this.noiseCancellation?.disable())
      .then(() => this.noiseCancellationChangeUnsubscribe?.())
      .catch((err) => {
        this.logger.warn('Failed to unregister noise cancellation', err);
      });

    this.call.tracer.trace('noiseCancellation.disabled', true);
    await this.call.notifyNoiseCancellationStopped();
  }

  /**
   * Enables speaking while muted notification.
   */
  async enableSpeakingWhileMutedNotification() {
    this.speakingWhileMutedNotificationEnabled = true;
    if (this.state.status === 'disabled') {
      await this.startSpeakingWhileMutedDetection(this.state.selectedDevice);
    }
  }

  /**
   * Disables speaking while muted notification.
   */
  async disableSpeakingWhileMutedNotification() {
    this.speakingWhileMutedNotificationEnabled = false;
    await this.stopSpeakingWhileMutedDetection();
  }

  /**
   * Applies the audio settings to the microphone.
   * @param settings the audio settings to apply.
   * @param publish whether to publish the stream after applying the settings.
   */
  async apply(settings: AudioSettingsResponse, publish: boolean) {
    if (!publish) return;

    const hasPublishedAudio = !!this.call.state.localParticipant?.audioStream;
    const hasPermission = this.call.permissionsContext.hasPermission(
      OwnCapability.SEND_AUDIO,
    );
    if (hasPublishedAudio || !hasPermission) return;

    // Wait for any in progress mic operation
    await this.statusChangeSettled();

    // Publish media stream that was set before we joined
    const { mediaStream } = this.state;
    if (this.enabled && mediaStream) {
      // The mic is already enabled (e.g. lobby screen). Publish the stream
      await this.publishStream(mediaStream);
    } else if (this.state.status === undefined && settings.mic_default_on) {
      // Start mic if backend config specifies, and there is no local setting
      await this.enable();
    }
  }

  protected override getDevices(): Observable<MediaDeviceInfo[]> {
    return getAudioDevices(this.call.tracer);
  }

  protected override getStream(
    constraints: MediaTrackConstraints,
  ): Promise<MediaStream> {
    return getAudioStream(constraints, this.call.tracer);
  }

  protected override doSetAudioBitrateProfile(profile: AudioBitrateProfile) {
    this.setDefaultConstraints({
      ...this.state.defaultConstraints,
      ...createAudioConstraints(profile),
    });

    if (this.noiseCancellation) {
      const disableAudioProcessing =
        profile === AudioBitrateProfile.MUSIC_HIGH_QUALITY;
      if (disableAudioProcessing) {
        this.noiseCancellation.disable(); // disable for high quality music mode
      } else {
        this.noiseCancellation.enable(); // restore it for other modes if available
      }
    }
  }

  private async startSpeakingWhileMutedDetection(deviceId?: string) {
    await withoutConcurrency(this.soundDetectorConcurrencyTag, async () => {
      await this.stopSpeakingWhileMutedDetection();
      if (isReactNative()) {
        this.rnSpeechDetector = new RNSpeechDetector();
        const unsubscribe = await this.rnSpeechDetector.start((event) => {
          this.state.setSpeakingWhileMuted(event.isSoundDetected);
        });
        this.soundDetectorCleanup = () => {
          unsubscribe();
          this.rnSpeechDetector = undefined;
        };
      } else {
        // Need to start a new stream that's not connected to publisher
        const stream = await this.getStream({
          deviceId: { exact: deviceId },
        });
        this.soundDetectorCleanup = createSoundDetector(stream, (event) => {
          this.state.setSpeakingWhileMuted(event.isSoundDetected);
        });
      }
    });
  }

  private async stopSpeakingWhileMutedDetection() {
    await withoutConcurrency(this.soundDetectorConcurrencyTag, async () => {
      if (!this.soundDetectorCleanup) return;
      const soundDetectorCleanup = this.soundDetectorCleanup;
      this.soundDetectorCleanup = undefined;
      this.state.setSpeakingWhileMuted(false);
      await soundDetectorCleanup();
    });
  }
}
