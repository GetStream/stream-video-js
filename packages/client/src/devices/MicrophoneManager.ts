import { combineLatest, Observable } from 'rxjs';
import type { INoiseCancellation } from '@stream-io/audio-filters-web';
import { Call } from '../Call';
import { InputMediaDeviceManager } from './InputMediaDeviceManager';
import { MicrophoneManagerState } from './MicrophoneManagerState';
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

export class MicrophoneManager extends InputMediaDeviceManager<MicrophoneManagerState> {
  private soundDetectorCleanup?: Function;
  private rnSpeechDetector: RNSpeechDetector | undefined;
  private noiseCancellation: INoiseCancellation | undefined;
  private noiseCancellationRegistration?: Promise<() => Promise<void>>;

  constructor(call: Call) {
    super(call, new MicrophoneManagerState(), TrackType.AUDIO);

    combineLatest([
      this.call.state.callingState$,
      this.call.state.ownCapabilities$,
      this.state.selectedDevice$,
      this.state.status$,
    ]).subscribe(async ([callingState, ownCapabilities, deviceId, status]) => {
      if (callingState !== CallingState.JOINED) {
        if (callingState === CallingState.LEFT) {
          await this.stopSpeakingWhileMutedDetection();
        }
        return;
      }
      if (ownCapabilities.includes(OwnCapability.SEND_AUDIO)) {
        if (status === 'disabled') {
          await this.startSpeakingWhileMutedDetection(deviceId);
        } else {
          await this.stopSpeakingWhileMutedDetection();
        }
      } else {
        await this.stopSpeakingWhileMutedDetection();
      }
    });

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
            .then(() => this.call.notifyNoiseCancellationStarting())
            .then(() => this.noiseCancellation?.enable())
            .catch((err) => {
              this.logger('warn', `Failed to enable noise cancellation`, err);
              return this.call.notifyNoiseCancellationStopped();
            });
        } else if (callingState === CallingState.LEFT) {
          this.noiseCancellationRegistration
            .then(() => this.noiseCancellation?.disable())
            .then(() => this.call.notifyNoiseCancellationStopped())
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
      .catch((err) => {
        this.logger('warn', 'Failed to unregister noise cancellation', err);
      });

    return this.call.notifyNoiseCancellationStopped();
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
    await this.stopSpeakingWhileMutedDetection();
    if (isReactNative()) {
      this.rnSpeechDetector = new RNSpeechDetector();
      await this.rnSpeechDetector.start();
      const unsubscribe = this.rnSpeechDetector?.onSpeakingDetectedStateChange(
        (event) => {
          this.state.setSpeakingWhileMuted(event.isSoundDetected);
        },
      );
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
  }

  private async stopSpeakingWhileMutedDetection() {
    if (!this.soundDetectorCleanup) {
      return;
    }
    this.state.setSpeakingWhileMuted(false);
    try {
      await this.soundDetectorCleanup();
    } finally {
      this.soundDetectorCleanup = undefined;
    }
  }
}
