import { combineLatest, Observable } from 'rxjs';
import type { INoiseCancellation } from '@stream-io/audio-filters-web';
import { Call } from '../Call';
import { InputMediaDeviceManager } from './InputMediaDeviceManager';
import { MicrophoneManagerState } from './MicrophoneManagerState';
import { TrackDisableMode } from './InputMediaDeviceManagerState';
import { getAudioDevices, getAudioStream } from './devices';
import { TrackType } from '../gen/video/sfu/models/models';
import { createSoundDetector } from '../helpers/sound-detector';
import { isReactNative } from '../helpers/platforms';
import {
  NoiseCancellationSettingsModeEnum,
  OwnCapability,
} from '../gen/coordinator';
import { CallingState } from '../store';
import { createSubscription } from '../store/rxUtils';
import { RNSpeechDetector } from '../helpers/RNSpeechDetector';
import { withoutConcurrency } from '../helpers/concurrency';

export class MicrophoneManager extends InputMediaDeviceManager<MicrophoneManagerState> {
  private speakingWhileMutedNotificationEnabled = true;
  private soundDetectorConcurrencyTag = Symbol('soundDetectorConcurrencyTag');
  private soundDetectorCleanup?: Function;
  private rnSpeechDetector: RNSpeechDetector | undefined;
  private noiseCancellation: INoiseCancellation | undefined;
  private noiseCancellationChangeUnsubscribe: (() => void) | undefined;
  private noiseCancellationRegistration?: Promise<() => Promise<void>>;

  constructor(
    call: Call,
    disableMode: TrackDisableMode = isReactNative()
      ? 'disable-tracks'
      : 'stop-tracks',
  ) {
    super(call, new MicrophoneManagerState(disableMode), TrackType.AUDIO);

    this.subscriptions.push(
      createSubscription(
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
            this.logger('warn', 'Could not enable speaking while muted', err);
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
            .then(() => this.noiseCancellation?.enable())
            .catch((err) => {
              this.logger('warn', `Failed to enable noise cancellation`, err);
              return this.call.notifyNoiseCancellationStopped();
            });
        } else if (callingState === CallingState.LEFT) {
          this.noiseCancellationRegistration
            .then(() => this.noiseCancellation?.disable())
            .catch((err) => {
              this.logger('warn', `Failed to disable noise cancellation`, err);
            });
        }
      }),
    );
  }

  /**
   * Enables noise cancellation for the microphone.
   *
   * Note: not supported in React Native.
   * @param noiseCancellation - a noise cancellation instance to use.
   */
  async enableNoiseCancellation(noiseCancellation: INoiseCancellation) {
    if (isReactNative()) {
      throw new Error('Noise cancellation is not supported in React Native');
    }

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
          if (enabled) {
            this.call.notifyNoiseCancellationStarting().catch((err) => {
              this.logger('warn', `notifyNoiseCancellationStart failed`, err);
            });
          } else {
            this.call.notifyNoiseCancellationStopped().catch((err) => {
              this.logger('warn', `notifyNoiseCancellationStop failed`, err);
            });
          }
        },
      );

      this.noiseCancellationRegistration = this.registerFilter(
        noiseCancellation.toFilter(),
      );
      await this.noiseCancellationRegistration;

      // handles an edge case where a noise cancellation is enabled after
      // the participant as joined the call -> we immediately enable NC
      if (
        noiseCancellationSettings.mode ===
          NoiseCancellationSettingsModeEnum.AUTO_ON &&
        this.call.state.callingState === CallingState.JOINED
      ) {
        noiseCancellation.enable();
      }
    } catch (e) {
      this.logger('warn', 'Failed to enable noise cancellation', e);
      await this.disableNoiseCancellation().catch((err) => {
        this.logger('warn', 'Failed to disable noise cancellation', err);
      });
    }
  }

  /**
   * Disables noise cancellation for the microphone.
   *
   * Note: not supported in React Native.
   */
  async disableNoiseCancellation() {
    if (isReactNative()) {
      throw new Error('Noise cancellation is not supported in React Native');
    }
    await this.noiseCancellationRegistration
      ?.then((unregister) => unregister())
      .then(() => this.noiseCancellation?.disable())
      .then(() => this.noiseCancellationChangeUnsubscribe?.())
      .catch((err) => {
        this.logger('warn', 'Failed to unregister noise cancellation', err);
      });

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

  protected getDevices(): Observable<MediaDeviceInfo[]> {
    return getAudioDevices();
  }

  protected getStream(
    constraints: MediaTrackConstraints,
  ): Promise<MediaStream> {
    return getAudioStream(constraints);
  }

  protected publishStream(stream: MediaStream): Promise<void> {
    return this.call.publishAudioStream(stream);
  }

  protected stopPublishStream(stopTracks: boolean): Promise<void> {
    return this.call.stopPublish(TrackType.AUDIO, stopTracks);
  }

  private async startSpeakingWhileMutedDetection(deviceId?: string) {
    await withoutConcurrency(this.soundDetectorConcurrencyTag, async () => {
      await this.stopSpeakingWhileMutedDetection();
      if (isReactNative()) {
        this.rnSpeechDetector = new RNSpeechDetector();
        await this.rnSpeechDetector.start();
        const unsubscribe =
          this.rnSpeechDetector?.onSpeakingDetectedStateChange((event) => {
            this.state.setSpeakingWhileMuted(event.isSoundDetected);
          });
        this.soundDetectorCleanup = () => {
          unsubscribe();
          this.rnSpeechDetector?.stop();
          this.rnSpeechDetector = undefined;
        };
      } else {
        // Need to start a new stream that's not connected to publisher
        const stream = await this.getStream({
          deviceId,
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
