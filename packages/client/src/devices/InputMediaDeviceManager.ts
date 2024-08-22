import { combineLatest, Observable, pairwise } from 'rxjs';
import { Call } from '../Call';
import { CallingState } from '../store';
import { createSubscription } from '../store/rxUtils';
import { InputMediaDeviceManagerState } from './InputMediaDeviceManagerState';
import { isReactNative } from '../helpers/platforms';
import { Logger } from '../coordinator/connection/types';
import { getLogger } from '../logger';
import { TrackType } from '../gen/video/sfu/models/models';
import { deviceIds$ } from './devices';
import {
  settled,
  withCancellation,
  withoutConcurrency,
} from '../helpers/concurrency';
import {
  MediaStreamFilter,
  MediaStreamFilterEntry,
  MediaStreamFilterRegistrationResult,
} from './filters';

export abstract class InputMediaDeviceManager<
  T extends InputMediaDeviceManagerState<C>,
  C = MediaTrackConstraints,
> {
  /**
   * if true, stops the media stream when call is left
   */
  stopOnLeave = true;
  logger: Logger;

  protected subscriptions: Function[] = [];
  private isTrackStoppedDueToTrackEnd = false;
  private filters: MediaStreamFilterEntry[] = [];
  private statusChangeConcurrencyTag = Symbol('statusChangeConcurrencyTag');
  private filterRegistrationConcurrencyTag = Symbol(
    'filterRegistrationConcurrencyTag',
  );

  protected constructor(
    protected readonly call: Call,
    public readonly state: T,
    protected readonly trackType: TrackType,
  ) {
    this.logger = getLogger([`${TrackType[trackType].toLowerCase()} manager`]);
    if (
      deviceIds$ &&
      !isReactNative() &&
      (this.trackType === TrackType.AUDIO || this.trackType === TrackType.VIDEO)
    ) {
      this.handleDisconnectedOrReplacedDevices();
    }
  }

  /**
   * Lists the available audio/video devices
   *
   * Note: It prompts the user for a permission to use devices (if not already granted)
   *
   * @returns an Observable that will be updated if a device is connected or disconnected
   */
  listDevices() {
    return this.getDevices();
  }

  /**
   * Returns `true` when this device is in enabled state.
   */
  get enabled() {
    return this.state.status === 'enabled';
  }

  /**
   * Starts stream.
   */
  async enable() {
    if (this.state.optimisticStatus === 'enabled') {
      return;
    }

    this.state.setPendingStatus('enabled');

    await withCancellation(this.statusChangeConcurrencyTag, async (signal) => {
      try {
        await this.unmuteStream();
        this.state.setStatus('enabled');
      } finally {
        if (!signal.aborted) {
          this.state.setPendingStatus(this.state.status);
        }
      }
    });
  }

  /**
   * Stops or pauses the stream based on state.disableMode
   * @param {boolean} [forceStop=false] when true, stops the tracks regardless of the state.disableMode
   */
  async disable(forceStop: boolean = false) {
    this.state.prevStatus = this.state.status;
    if (!forceStop && this.state.optimisticStatus === 'disabled') {
      return;
    }

    this.state.setPendingStatus('disabled');

    await withCancellation(this.statusChangeConcurrencyTag, async (signal) => {
      try {
        const stopTracks =
          forceStop || this.state.disableMode === 'stop-tracks';
        await this.muteStream(stopTracks);
        this.state.setStatus('disabled');
      } finally {
        if (!signal.aborted) {
          this.state.setPendingStatus(this.state.status);
        }
      }
    });
  }

  /**
   * Returns a promise that resolves when all pe
   */
  async statusChangeSettled() {
    await settled(this.statusChangeConcurrencyTag);
  }

  /**
   * If status was previously enabled, it will re-enable the device.
   */
  async resume() {
    if (
      this.state.prevStatus === 'enabled' &&
      this.state.status === 'disabled'
    ) {
      await this.enable();
    }
  }

  /**
   * If the current device status is disabled, it will enable the device,
   * else it will disable it.
   */
  async toggle() {
    if (this.state.optimisticStatus === 'enabled') {
      return await this.disable();
    } else {
      return await this.enable();
    }
  }

  /**
   * Registers a filter that will be applied to the stream.
   *
   * The registered filter will get the existing stream, and it should return
   * a new stream with the applied filter.
   *
   * @param filter the filter to register.
   * @returns MediaStreamFilterRegistrationResult
   */
  registerFilter(
    filter: MediaStreamFilter,
  ): MediaStreamFilterRegistrationResult {
    const entry: MediaStreamFilterEntry = {
      start: filter,
      stop: undefined,
    };

    const registered = withoutConcurrency(
      this.filterRegistrationConcurrencyTag,
      async () => {
        this.filters.push(entry);
        await this.applySettingsToStream();
      },
    );

    return {
      registered,
      unregister: () =>
        withoutConcurrency(this.filterRegistrationConcurrencyTag, async () => {
          entry.stop?.();
          this.filters = this.filters.filter((f) => f !== entry);
          await this.applySettingsToStream();
        }),
    };
  }

  /**
   * Will set the default constraints for the device.
   *
   * @param constraints the constraints to set.
   */
  setDefaultConstraints(constraints: C) {
    this.state.setDefaultConstraints(constraints);
  }

  /**
   * Selects a device.
   *
   * Note: This method is not supported in React Native
   * @param deviceId the device id to select.
   */
  async select(deviceId: string | undefined) {
    if (isReactNative()) {
      throw new Error(
        'This method is not supported in React Native. Please visit https://getstream.io/video/docs/reactnative/core/camera-and-microphone/#speaker-management for reference.',
      );
    }
    if (deviceId === this.state.selectedDevice) {
      return;
    }
    this.state.setDevice(deviceId);
    await this.applySettingsToStream();
  }

  /**
   * Disposes the manager.
   *
   * @internal
   */
  dispose = () => {
    this.subscriptions.forEach((s) => s());
  };

  protected async applySettingsToStream() {
    if (this.enabled) {
      await this.muteStream();
      await this.unmuteStream();
    }
  }

  protected abstract getDevices(): Observable<MediaDeviceInfo[]>;

  protected abstract getStream(constraints: C): Promise<MediaStream>;

  protected abstract publishStream(stream: MediaStream): Promise<void>;

  protected abstract stopPublishStream(stopTracks: boolean): Promise<void>;

  protected getTracks(): MediaStreamTrack[] {
    return this.state.mediaStream?.getTracks() ?? [];
  }

  protected async muteStream(stopTracks: boolean = true) {
    if (!this.state.mediaStream) return;
    this.logger('debug', `${stopTracks ? 'Stopping' : 'Disabling'} stream`);
    if (this.call.state.callingState === CallingState.JOINED) {
      await this.stopPublishStream(stopTracks);
    }
    this.muteLocalStream(stopTracks);
    const allEnded = this.getTracks().every((t) => t.readyState === 'ended');
    if (allEnded) {
      if (
        this.state.mediaStream &&
        // @ts-expect-error release() is present in react-native-webrtc
        typeof this.state.mediaStream.release === 'function'
      ) {
        // @ts-expect-error called to dispose the stream in RN
        this.state.mediaStream.release();
      }
      this.state.setMediaStream(undefined, undefined);
      this.filters.forEach((entry) => entry.stop?.());
    }
  }

  private muteTracks() {
    this.getTracks().forEach((track) => {
      if (track.enabled) track.enabled = false;
    });
  }

  private unmuteTracks() {
    this.getTracks().forEach((track) => {
      if (!track.enabled) track.enabled = true;
    });
  }

  private stopTracks() {
    this.getTracks().forEach((track) => {
      if (track.readyState === 'live') track.stop();
    });
  }

  private muteLocalStream(stopTracks: boolean) {
    if (!this.state.mediaStream) {
      return;
    }
    if (stopTracks) {
      this.stopTracks();
    } else {
      this.muteTracks();
    }
  }

  protected async unmuteStream() {
    this.logger('debug', 'Starting stream');
    let stream: MediaStream;
    let rootStream: Promise<MediaStream> | undefined;
    if (
      this.state.mediaStream &&
      this.getTracks().every((t) => t.readyState === 'live')
    ) {
      stream = this.state.mediaStream;
      this.unmuteTracks();
    } else {
      const defaultConstraints = this.state.defaultConstraints;
      const constraints: MediaTrackConstraints = {
        ...defaultConstraints,
        deviceId: this.state.selectedDevice,
      };

      /**
       * Chains two media streams together.
       *
       * In our case, filters MediaStreams are derived from their parent MediaStream.
       * However, once a child filter's track is stopped,
       * the tracks of the parent MediaStream aren't automatically stopped.
       * This leads to a situation where the camera indicator light is still on
       * even though the user stopped publishing video.
       *
       * This function works around this issue by stopping the parent MediaStream's tracks
       * as well once the child filter's tracks are stopped.
       *
       * It works by patching the stop() method of the child filter's tracks to also stop
       * the parent MediaStream's tracks of the same type. Here we assume that
       * the parent MediaStream has only one track of each type.
       *
       * @param parentStream the parent MediaStream. Omit for the root stream.
       */
      const chainWith =
        (parentStream?: Promise<MediaStream>) =>
        async (filterStream: MediaStream): Promise<MediaStream> => {
          if (!parentStream) return filterStream;
          // TODO OL: take care of track.enabled property as well
          const parent = await parentStream;
          filterStream.getTracks().forEach((track) => {
            const originalStop = track.stop;
            track.stop = function stop() {
              originalStop.call(track);
              parent.getTracks().forEach((parentTrack) => {
                if (parentTrack.kind === track.kind) {
                  parentTrack.stop();
                }
              });
            };
          });

          parent.getTracks().forEach((parentTrack) => {
            // When the parent stream abruptly ends, we propagate the event
            // to the filter stream.
            // This usually happens when the camera/microphone permissions
            // are revoked or when the device is disconnected.
            const handleParentTrackEnded = () => {
              filterStream.getTracks().forEach((track) => {
                if (parentTrack.kind !== track.kind) return;
                track.stop();
                track.dispatchEvent(new Event('ended')); // propagate the event
              });
            };
            parentTrack.addEventListener('ended', handleParentTrackEnded);
            this.subscriptions.push(() => {
              parentTrack.removeEventListener('ended', handleParentTrackEnded);
            });
          });

          return filterStream;
        };

      // the rootStream represents the stream coming from the actual device
      // e.g. camera or microphone stream
      rootStream = this.getStream(constraints as C);
      // we publish the last MediaStream of the chain
      stream = await this.filters.reduce(
        (parent, entry) =>
          parent
            .then((inputStream) => {
              const { stop, output } = entry.start(inputStream);
              entry.stop = stop;
              return output;
            })
            .then(chainWith(parent), (error) => {
              this.logger(
                'warn',
                'Filter failed to start and will be ignored',
                error,
              );
              return parent;
            }),
        rootStream,
      );
    }
    if (this.call.state.callingState === CallingState.JOINED) {
      await this.publishStream(stream);
    }
    if (this.state.mediaStream !== stream) {
      this.state.setMediaStream(stream, await rootStream);
      this.getTracks().forEach((track) => {
        track.addEventListener('ended', async () => {
          await this.statusChangeSettled();
          if (this.enabled) {
            this.isTrackStoppedDueToTrackEnd = true;
            setTimeout(() => {
              this.isTrackStoppedDueToTrackEnd = false;
            }, 2000);
            await this.disable();
          }
        });
      });
    }
  }

  private get mediaDeviceKind() {
    if (this.trackType === TrackType.AUDIO) {
      return 'audioinput';
    }
    if (this.trackType === TrackType.VIDEO) {
      return 'videoinput';
    }
    return '';
  }

  private handleDisconnectedOrReplacedDevices() {
    this.subscriptions.push(
      createSubscription(
        combineLatest([
          deviceIds$!.pipe(pairwise()),
          this.state.selectedDevice$,
        ]),
        async ([[prevDevices, currentDevices], deviceId]) => {
          try {
            if (!deviceId) return;
            await this.statusChangeSettled();

            let isDeviceDisconnected = false;
            let isDeviceReplaced = false;
            const currentDevice = this.findDeviceInList(
              currentDevices,
              deviceId,
            );
            const prevDevice = this.findDeviceInList(prevDevices, deviceId);
            if (!currentDevice && prevDevice) {
              isDeviceDisconnected = true;
            } else if (
              currentDevice &&
              prevDevice &&
              currentDevice.deviceId === prevDevice.deviceId &&
              currentDevice.groupId !== prevDevice.groupId
            ) {
              isDeviceReplaced = true;
            }

            if (isDeviceDisconnected) {
              await this.disable();
              await this.select(undefined);
            }
            if (isDeviceReplaced) {
              if (
                this.isTrackStoppedDueToTrackEnd &&
                this.state.status === 'disabled'
              ) {
                await this.enable();
                this.isTrackStoppedDueToTrackEnd = false;
              } else {
                await this.applySettingsToStream();
              }
            }
          } catch (err) {
            this.logger(
              'warn',
              'Unexpected error while handling disconnected or replaced device',
              err,
            );
          }
        },
      ),
    );
  }

  private findDeviceInList(devices: MediaDeviceInfo[], deviceId: string) {
    return devices.find(
      (d) => d.deviceId === deviceId && d.kind === this.mediaDeviceKind,
    );
  }
}
