import { combineLatest, firstValueFrom, Observable } from 'rxjs';
import type {
  INoiseCancellation,
  NoiseCancellationOverloadEvent,
} from '@stream-io/audio-filters-web';
import { Call } from '../Call';
import { getCallExtraOpts } from '../helpers/extraOpts';
import {
  AudioDeviceManager,
  createAudioConstraints,
} from './AudioDeviceManager';
import { type BrowserPermissionState } from './BrowserPermission';
import { MicrophoneManagerState } from './MicrophoneManagerState';
import { TrackDisableMode } from './DeviceManagerState';
import { getAudioDevices, getAudioStream, resolveDeviceId } from './devices';
import {
  AudioBitrateProfile,
  NoiseCancellationEngine,
  TrackType,
} from '../gen/video/sfu/models/models';
import type { StartNoiseCancellationRequest } from '../gen/video/sfu/signal_rpc/signal';
import { createSoundDetector } from '../helpers/sound-detector';
import { createNoAudioDetector } from '../helpers/no-audio-detector';
import { isReactNative } from '../helpers/platforms';
import { AudioSettingsResponse, OwnCapability } from '../gen/coordinator';
import { type MicCaptureReportEvent } from '../coordinator/connection/types';
import { CallingState } from '../store';
import {
  createSafeAsyncSubscription,
  createSubscription,
} from '../store/rxUtils';
import { withoutConcurrency } from '../helpers/concurrency';
import { disposeOfMediaStream } from './utils';
import { promiseWithResolvers } from '../helpers/promise';
import { DevicePersistenceOptions } from './devicePersistence';
import { of } from 'rxjs';

export class MicrophoneManager extends AudioDeviceManager<MicrophoneManagerState> {
  private speakingWhileMutedNotificationEnabled = true;
  private soundDetectorConcurrencyTag = Symbol('soundDetectorConcurrencyTag');
  private soundDetectorCleanup?: () => Promise<void>;
  private soundDetectorDeviceId?: string;
  private noAudioDetectorCleanup?: () => Promise<void>;
  private noiseCancellation: INoiseCancellation | undefined;
  private startedNoiseCancellation?: Pick<
    StartNoiseCancellationRequest,
    'engine' | 'model'
  >;
  private noiseCancellationUnsubscribers: Array<() => void> = [];
  private noiseCancellationRegistration?: Promise<void>;
  private unregisterNoiseCancellation?: () => Promise<void>;
  private disableBrowserNoiseSuppression = false;

  private silenceThresholdMs = 5000;

  constructor(
    call: Call,
    devicePersistence: Required<DevicePersistenceOptions>,
    disableMode: TrackDisableMode = 'stop-tracks',
  ) {
    super(
      call,
      new MicrophoneManagerState(disableMode, call.tracer),
      TrackType.AUDIO,
      devicePersistence,
    );
  }

  override setup(): void {
    if (this.areSubscriptionsSetUp) return;
    super.setup();
    this.subscriptions.push(
      createSafeAsyncSubscription(
        combineLatest([
          this.call.state.callingState$,
          this.call.state.ownCapabilities$,
          this.state.selectedDevice$,
          this.state.browserPermissionState$,
          // only triggers: queued handlers can run after the status changed
          // again, so the live status is read below. RN also re-runs on the
          // intent: a rolled-back enable leaves the committed status as is
          this.state.status$,
          isReactNative() ? this.state.optimisticStatus$ : of(undefined),
        ]),
        async ([callingState, ownCapabilities, deviceId, permissionState]) => {
          try {
            if (callingState === CallingState.LEFT) {
              // The muted-recording-prepared mode is reset in `callManager.stop()`
              // (during leave, while the call factory is still alive), not here —
              // this subscription fires asynchronously and could land after the
              // factory is disposed, forcing a default-ADM rebuild.
              await this.stopSpeakingWhileMutedDetection();
            }
            if (callingState !== CallingState.JOINED) return;
            if (!this.speakingWhileMutedNotificationEnabled) return;

            if (ownCapabilities.includes(OwnCapability.SEND_AUDIO)) {
              const hasPermission = await this.hasPermission(permissionState);
              // RN also checks the intent: a mic enabled before the join is
              // published only after JOINED
              const isMuted =
                this.state.status !== 'enabled' &&
                !(isReactNative() && this.state.optimisticStatus === 'enabled');
              if (hasPermission && isMuted) {
                this.setMutedRecordingPrepared(true);
                await this.startSpeakingWhileMutedDetection(deviceId);
              } else {
                this.setMutedRecordingPrepared(false);
                await this.stopSpeakingWhileMutedDetection();
              }
            } else {
              this.setMutedRecordingPrepared(false);
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
          'auto-on';

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
                this.noiseCancellation?.enable().catch((err) => {
                  this.logger.warn('Failed to enable noise cancellation', err);
                });
              }
            })
            .catch((err) => {
              this.logger.warn(`Failed to enable noise cancellation`, err);
              return this.notifyNoiseCancellationStopped();
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

    if (!isReactNative()) {
      const unsubscribe = createSafeAsyncSubscription(
        combineLatest([this.state.status$, this.state.mediaStream$]),
        async ([status, mediaStream]) => {
          if (this.noAudioDetectorCleanup) {
            const cleanup = this.noAudioDetectorCleanup;
            this.noAudioDetectorCleanup = undefined;
            await cleanup().catch((err) => {
              this.logger.warn('Failed to stop no-audio detector', err);
            });
          }

          if (status !== 'enabled' || !mediaStream) return;
          if (this.silenceThresholdMs <= 0) return;

          const deviceId = this.state.selectedDevice;
          const devices = await firstValueFrom(this.listDevices());
          const label = devices.find((d) => d.deviceId === deviceId)?.label;

          let lastCapturesAudio: boolean | undefined;
          this.noAudioDetectorCleanup = createNoAudioDetector(mediaStream, {
            noAudioThresholdMs: this.silenceThresholdMs,
            emitIntervalMs: this.silenceThresholdMs,
            onCaptureStatusChange: (capturesAudio) => {
              const event: MicCaptureReportEvent = {
                type: 'mic.capture_report',
                call_cid: this.call.cid,
                capturesAudio,
                deviceId,
                label,
              };

              if (capturesAudio !== lastCapturesAudio) {
                lastCapturesAudio = capturesAudio;
                this.call.tracer.trace('mic.capture_report', event);
              }

              this.call.streamClient.dispatchEvent(event);
            },
          });
        },
      );
      this.subscriptions.push(unsubscribe);
    }
  }

  override enable(): Promise<void> {
    if (isReactNative() && !this.call.hasMediaEngine) {
      this.state.setPendingStatus('enabled');
      return Promise.resolve();
    }

    return super.enable();
  }

  override disable(options: { forceStop?: boolean }): Promise<void>;
  override disable(forceStop?: boolean): Promise<void>;
  override async disable(
    forceStopOrOptions?: boolean | { forceStop?: boolean },
  ): Promise<void> {
    if (isReactNative() && !this.call.hasMediaEngine) {
      this.state.setPendingStatus('disabled');
      return;
    }

    // forward verbatim to the base, narrowing so the right overload is selected
    if (forceStopOrOptions === undefined) return super.disable();
    if (typeof forceStopOrOptions === 'boolean') {
      return super.disable(forceStopOrOptions);
    }
    return super.disable(forceStopOrOptions);
  }

  override toggle(): Promise<void> {
    if (isReactNative() && !this.call.hasMediaEngine) {
      this.state.setPendingStatus(
        this.state.optimisticStatus === 'enabled' ? 'disabled' : 'enabled',
      );
      return Promise.resolve();
    }

    return super.toggle();
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
      noiseCancellationSettings.mode === 'disabled'
    ) {
      throw new Error('Noise cancellation is disabled for this call type.');
    }
    const { engine } = getCallExtraOpts(settings).noise_cancellation ?? {};
    if (
      engine &&
      noiseCancellation.engine &&
      engine !== noiseCancellation.engine
    ) {
      throw new Error(
        `Noise cancellation engine ${noiseCancellation.engine} doesn't match the call type engine ${engine}.`,
      );
    }
    try {
      this.noiseCancellation = noiseCancellation;

      // listen for change events and notify the SFU
      this.noiseCancellationUnsubscribers.push(
        this.noiseCancellation.on('change', (enabled: boolean) => {
          this.call.tracer.trace('noiseCancellation.enabled', enabled);
          this.state.setNoiseCancellationStatus(
            enabled ? 'enabled' : 'disabled',
          );
          if (enabled) {
            this.notifyNoiseCancellationStarting().catch((err) => {
              this.logger.warn(`notifyNoiseCancellationStart failed`, err);
            });
          } else {
            this.notifyNoiseCancellationStopped().catch((err) => {
              this.logger.warn(`notifyNoiseCancellationStop failed`, err);
            });
          }
        }),
        this.noiseCancellation.on(
          'overload',
          (event: NoiseCancellationOverloadEvent) => {
            this.call.tracer.trace('noiseCancellation.overload', event);
            this.state.setNoiseCancellationStatus(
              event.willRestore ? 'suspended' : 'overloaded',
            );
          },
        ),
      );

      if (isReactNative()) {
        // no filter registration in React Native, its done in the native code on app init
        this.noiseCancellationRegistration = Promise.resolve();
      } else {
        this.disableBrowserNoiseSuppression = true;
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
        noiseCancellationSettings.mode === 'auto-on' &&
        this.call.state.callingState === CallingState.JOINED
      ) {
        let canAutoEnable = true;
        if (noiseCancellation.canAutoEnable) {
          canAutoEnable = await noiseCancellation.canAutoEnable();
        }
        if (canAutoEnable) {
          noiseCancellation.enable().catch((err) => {
            this.logger.warn('Failed to enable noise cancellation', err);
          });
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
    this.disableBrowserNoiseSuppression = false;
    await (this.unregisterNoiseCancellation?.() ?? Promise.resolve())
      .then(() => this.noiseCancellation?.disable())
      .then(() => {
        this.noiseCancellationUnsubscribers.forEach((unsubscribe) =>
          unsubscribe(),
        );
        this.noiseCancellationUnsubscribers = [];
      })
      .catch((err) => {
        this.logger.warn('Failed to unregister noise cancellation', err);
      });

    this.state.setNoiseCancellationStatus('disabled');

    this.call.tracer.trace('noiseCancellation.disabled', true);
    await this.notifyNoiseCancellationStopped();
  }

  private describeNoiseCancellation = () => ({
    engine:
      this.noiseCancellation?.engine === 'stream'
        ? NoiseCancellationEngine.STREAM
        : NoiseCancellationEngine.KRISP_UNSPECIFIED,
    model: this.noiseCancellation?.model ?? '',
  });

  private notifyNoiseCancellationStarting = () => {
    const noiseCancellation = this.describeNoiseCancellation();
    this.startedNoiseCancellation = noiseCancellation;
    return this.call.notifyNoiseCancellationStarting(noiseCancellation);
  };

  /**
   * Reports the engine and model that were started, so the stop matches the
   * start even after the engine was disposed or reconfigured.
   */
  private notifyNoiseCancellationStopped = () => {
    const noiseCancellation =
      this.startedNoiseCancellation ?? this.describeNoiseCancellation();
    this.startedNoiseCancellation = undefined;
    return this.call.notifyNoiseCancellationStopped(noiseCancellation);
  };

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
   * Sets the silence threshold in milliseconds for no-audio detection.
   * When the microphone is enabled but produces no audio for this duration,
   * a 'mic.capture_report' event will be emitted.
   *
   * @param thresholdMs the threshold in milliseconds (default: 5000).
   *   Set to 0 or a negative value to disable no-audio detection.
   */
  setSilenceThreshold(thresholdMs: number) {
    this.silenceThresholdMs = thresholdMs;
  }

  /**
   * Performs audio capture test on a specific microphone.
   *
   * This method is only available in browser environments (not React Native).
   *
   * @param deviceId The device ID to test.
   * @param options Optional test configuration.
   * @returns Promise that resolves with the test result (true or false).
   */
  async performTest(
    deviceId: string,
    options?: { testDurationMs?: number },
  ): Promise<boolean> {
    if (isReactNative()) throw new Error('Not available in React Native');

    const stream = await this.getStream({ deviceId: { exact: deviceId } });
    const { testDurationMs = 3000 } = options || {};
    const { promise, resolve } = promiseWithResolvers<boolean>();
    let finished = false;
    const finish = async (capturesAudio: boolean) => {
      if (finished) return;
      finished = true;
      clearTimeout(deadline);
      resolve(capturesAudio);
      await cleanup().catch((err) => {
        this.logger.warn('Failed to stop detector during test', err);
      });
      disposeOfMediaStream(stream);
    };
    const cleanup = createNoAudioDetector(stream, {
      noAudioThresholdMs: testDurationMs,
      emitIntervalMs: testDurationMs,
      onCaptureStatusChange: finish,
    });
    const deadline = setTimeout(() => void finish(false), testDurationMs * 2);
    return promise;
  }

  /**
   * Applies the audio settings to the microphone.
   * @param settings the audio settings to apply.
   * @param publish whether to publish the stream after applying the settings.
   * @param forceDisabled whether to keep the mic disabled, regardless of server-side or local preferences.
   */
  async apply(
    settings: AudioSettingsResponse,
    publish: boolean,
    forceDisabled: boolean = false,
  ) {
    // Wait for any in progress mic operation
    await this.statusChangeSettled();

    // apply server-side settings only when the device state is pristine
    // and there are no persisted preferences
    const shouldApplyDefaults =
      this.state.status === undefined &&
      this.state.optimisticStatus === undefined;
    let persistedPreferencesApplied = false;
    const permissionState = await firstValueFrom(
      this.state.browserPermissionState$,
    );
    if (
      shouldApplyDefaults &&
      this.devicePersistence.enabled &&
      permissionState === 'granted'
    ) {
      persistedPreferencesApplied = await this.applyPersistedPreferences(
        true,
        forceDisabled,
      );
    }

    const canPublish = this.call.permissionsContext.canPublish(this.trackType);
    if (shouldApplyDefaults && !persistedPreferencesApplied) {
      if (
        !forceDisabled &&
        canPublish &&
        settings.mic_default_on &&
        permissionState !== 'denied'
      ) {
        await this.enable();
      }
    }

    if (isReactNative() && publish && canPublish) {
      // On RN the microphone is enabled/disabled optimistically before JOINED. Reconcile now
      // acquires the track and publishes it, so it fully owns the publish.
      await this.reconcileOptimisticStatus();
    } else {
      const { mediaStream } = this.state;
      if (canPublish && publish && this.enabled && mediaStream) {
        await this.publishStream(mediaStream);
      }
    }
  }

  protected override getDevices(): Observable<MediaDeviceInfo[]> {
    return getAudioDevices(this.call.tracer);
  }

  /**
   * Layers the capture constraints from the call settings
   * (`extra_opts.audio.media_constraints`) under the configured ones, so
   * they only replace the SDK defaults.
   * Turns off the browser's own noise suppression while the noise
   * cancellation filter is registered, so the audio isn't suppressed twice.
   * Echo cancellation and auto gain control stay as configured.
   */
  protected override getResolvedConstraints(
    constraints: MediaTrackConstraints,
  ): MediaTrackConstraints {
    const resolved = { ...this.getCallSettingsConstraints(), ...constraints };
    if (!this.disableBrowserNoiseSuppression) return resolved;
    return { ...resolved, noiseSuppression: false };
  }

  private getCallSettingsConstraints = (): MediaTrackConstraints => {
    const mediaConstraints = getCallExtraOpts(this.call.state.settings).audio
      ?.media_constraints;
    const constraints: MediaTrackConstraints = {};
    if (!mediaConstraints) return constraints;
    const { auto_gain_control, echo_cancellation, noise_suppression } =
      mediaConstraints;
    if (typeof auto_gain_control === 'boolean') {
      constraints.autoGainControl = auto_gain_control;
    }
    if (typeof echo_cancellation === 'boolean') {
      constraints.echoCancellation = echo_cancellation;
    }
    if (typeof noise_suppression === 'boolean') {
      constraints.noiseSuppression = noise_suppression;
    }
    return constraints;
  };

  protected override async getStream(
    constraints: MediaTrackConstraints,
  ): Promise<MediaStream> {
    // Ensure the call's media factory exists before capture so the resulting
    // track is owned by it (the WebRTC globals resolve to the live factory).
    await this.call.ensureMediaFactory();
    return getAudioStream(
      constraints,
      this.call.tracer,
      this.getCaptureMediaDevices(),
    );
  }

  /**
   * On mute, hands a clone of the live mic track to the speaking while muted
   * detection, so the device stays captured after the mic tracks are stopped.
   * Releasing and re-acquiring the mic flips Bluetooth headsets between audio
   * profiles.
   */
  protected override async muteStream(stopTracks: boolean = true) {
    const [track] = this.state.rootMediaStream?.getAudioTracks() ?? [];
    const clone =
      track?.readyState === 'live' &&
      this.state.optimisticStatus === 'disabled' &&
      this.canHandOffMic()
        ? track.clone()
        : undefined;
    try {
      await super.muteStream(stopTracks);
    } catch (err) {
      clone?.stop();
      throw err;
    }
    if (!clone) return;

    // the mic, the call, or the selected device may have changed while
    // unpublishing
    const deviceId = resolveDeviceId(
      clone.getSettings().deviceId,
      'audioinput',
    );
    if (
      clone.readyState !== 'live' ||
      !this.canHandOffMic() ||
      deviceId !== this.state.selectedDevice
    ) {
      clone.stop();
      return;
    }
    this.startSpeakingWhileMutedDetection(deviceId, clone).catch((err) => {
      clone.stop();
      this.logger.warn('Could not hand off mic to speaking while muted', err);
    });
  }

  /**
   * Whether a mute can hand the mic over to the speaking while muted detection.
   */
  private canHandOffMic = () => {
    const { callingState, ownCapabilities } = this.call.state;
    return (
      !isReactNative() &&
      this.speakingWhileMutedNotificationEnabled &&
      callingState === CallingState.JOINED &&
      ownCapabilities.includes(OwnCapability.SEND_AUDIO)
    );
  };

  protected override doSetAudioBitrateProfile(profile: AudioBitrateProfile) {
    const { channelCount, ...processing } = createAudioConstraints(profile);
    const base: MediaTrackConstraints = { ...this.state.defaultConstraints };
    delete base.autoGainControl;
    delete base.echoCancellation;
    delete base.noiseSuppression;
    // music turns the audio processing off; voice profiles leave it to the
    // call settings and the SDK defaults
    const isMusic = profile === AudioBitrateProfile.MUSIC_HIGH_QUALITY;
    this.setDefaultConstraints({
      ...base,
      channelCount,
      ...(isMusic ? processing : {}),
    });

    if (this.noiseCancellation) {
      const disableAudioProcessing =
        profile === AudioBitrateProfile.MUSIC_HIGH_QUALITY;
      if (disableAudioProcessing) {
        this.noiseCancellation.disable().catch((err) => {
          this.logger.warn(
            'Failed to disable noise cancellation for music mode',
            err,
          );
        }); // disable for high quality music mode
      } else {
        this.noiseCancellation.enable().catch((err) => {
          this.logger.warn('Failed to enable noise cancellation', err);
        }); // restore it for other modes if available
      }
    }
  }

  private async startSpeakingWhileMutedDetection(
    deviceId?: string,
    track?: MediaStreamTrack,
  ) {
    await withoutConcurrency(this.soundDetectorConcurrencyTag, async () => {
      if (
        this.soundDetectorCleanup &&
        this.soundDetectorDeviceId === deviceId
      ) {
        track?.stop();
        return;
      }

      await this.teardownSpeakingWhileMutedDetection();

      if (isReactNative()) {
        const speechActivity =
          globalThis.streamRNVideoSDK?.nativeEvents?.speechActivity;
        if (!speechActivity) {
          this.logger.warn(
            'Native speech activity not available, make sure the "@stream-io/react-native-webrtc" peer dependency version is satisfied',
          );
          return;
        }
        const unsubscribe = speechActivity.subscribe((event) => {
          this.state.setSpeakingWhileMuted(event.isSoundDetected);
        });
        this.soundDetectorCleanup = async () => {
          unsubscribe();
        };
      } else {
        // Use the handed-off mic track, or start a new stream that's not
        // connected to publisher
        const stream = track
          ? new MediaStream([track])
          : await this.getStream(
              this.getResolvedConstraints({
                ...this.state.defaultConstraints,
                deviceId: { exact: deviceId },
              }),
            );
        this.soundDetectorCleanup = createSoundDetector(stream, (event) => {
          this.state.setSpeakingWhileMuted(event.isSoundDetected);
        });
      }

      this.soundDetectorDeviceId = deviceId;
    });
  }

  private async stopSpeakingWhileMutedDetection() {
    await withoutConcurrency(this.soundDetectorConcurrencyTag, async () => {
      return this.teardownSpeakingWhileMutedDetection();
    });
  }

  private async teardownSpeakingWhileMutedDetection(): Promise<void> {
    const soundDetectorCleanup = this.soundDetectorCleanup;
    this.soundDetectorCleanup = undefined;
    this.soundDetectorDeviceId = undefined;
    this.state.setSpeakingWhileMuted(false);
    if (!soundDetectorCleanup) return;

    await soundDetectorCleanup().catch((err) => {
      this.logger.warn('Failed to stop speaking while muted detector', err);
    });
  }

  /**
   * iOS-only: keep the mic-input chain prepared while muted
   * so the `AVAudioEngine` stays full-duplex and remote audio renders on a
   * muted join.
   */
  private setMutedRecordingPrepared(enabled: boolean): void {
    if (!isReactNative()) return;
    globalThis.streamRNVideoSDK?.callManager.setMutedRecordingPrepared?.(
      enabled,
    );
  }

  private async hasPermission(
    permissionState: BrowserPermissionState,
  ): Promise<boolean> {
    if (!isReactNative()) return permissionState === 'granted';

    const nativePermissions = globalThis.streamRNVideoSDK?.permissions;
    if (!nativePermissions) return true; // assume granted

    try {
      return await nativePermissions.check('microphone');
    } catch (err) {
      this.logger.warn('Failed to check permission', err);
      return false;
    }
  }
}
