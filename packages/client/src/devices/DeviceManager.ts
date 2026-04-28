import {
  BehaviorSubject,
  combineLatest,
  firstValueFrom,
  map,
  Observable,
  pairwise,
} from 'rxjs';
import { Call } from '../Call';
import type { DeviceDisconnectedEvent } from '../coordinator/connection/types';
import { TrackPublishOptions } from '../rtc';
import { CallingState } from '../store';
import {
  createSubscription,
  getCurrentValue,
  setCurrentValue,
} from '../store/rxUtils';
import {
  DeviceManagerState,
  type InputDeviceStatus,
} from './DeviceManagerState';
import { isMobile } from '../helpers/compatibility';
import { isReactNative } from '../helpers/platforms';
import { ScopedLogger, videoLoggerSystem } from '../logger';
import { TrackType } from '../gen/video/sfu/models/models';
import { deviceIds$ } from './devices';
import {
  hasPending,
  settled,
  withCancellation,
  withoutConcurrency,
} from '../helpers/concurrency';
import {
  MediaStreamFilter,
  MediaStreamFilterEntry,
  MediaStreamFilterRegistrationResult,
} from './filters';
import {
  createSyntheticDevice,
  defaultDeviceId,
  DevicePersistenceOptions,
  DevicePreferenceKey,
  readPreferences,
  toPreferenceList,
  writePreferences,
} from './devicePersistence';
import {
  ActiveVirtualSession,
  VIRTUAL_DEVICE_PREFIX,
  VirtualDevice,
  VirtualDeviceEntry,
  VirtualDeviceHandle,
} from './VirtualDevice';
import { generateUUIDv4 } from '../coordinator/connection/utils';

export abstract class DeviceManager<
  S extends DeviceManagerState<C>,
  C = MediaTrackConstraints,
> {
  /**
   * if true, stops the media stream when call is left
   */
  stopOnLeave = true;
  logger: ScopedLogger;

  state: S;

  protected readonly call: Call;
  protected readonly trackType: TrackType;
  protected subscriptions: (() => void)[] = [];
  protected devicePersistence: Required<DevicePersistenceOptions>;
  protected areSubscriptionsSetUp = false;
  private isTrackStoppedDueToTrackEnd = false;
  private filters: MediaStreamFilterEntry[] = [];
  private virtualDevicesSubject = new BehaviorSubject<VirtualDeviceEntry<C>[]>(
    [],
  );
  private activeVirtualSession: ActiveVirtualSession | undefined;
  private virtualDeviceConcurrencyTag = Symbol('virtualDeviceConcurrencyTag');
  private statusChangeConcurrencyTag = Symbol('statusChangeConcurrencyTag');
  private filterRegistrationConcurrencyTag = Symbol(
    'filterRegistrationConcurrencyTag',
  );

  protected constructor(
    call: Call,
    state: S,
    trackType: TrackType,
    devicePersistence: Required<DevicePersistenceOptions>,
  ) {
    this.call = call;
    this.state = state;
    this.trackType = trackType;
    this.devicePersistence = devicePersistence;
    this.logger = videoLoggerSystem.getLogger(
      `${TrackType[trackType].toLowerCase()} manager`,
    );
    this.setup();
  }

  setup() {
    if (this.areSubscriptionsSetUp) return;
    this.areSubscriptionsSetUp = true;

    if (
      deviceIds$ &&
      !isReactNative() &&
      (this.trackType === TrackType.AUDIO || this.trackType === TrackType.VIDEO)
    ) {
      this.handleDisconnectedOrReplacedDevices();
    }

    if (this.devicePersistence.enabled) {
      this.subscriptions.push(
        createSubscription(
          combineLatest([
            this.state.selectedDevice$,
            this.state.status$,
            this.state.browserPermissionState$,
          ]),
          ([selectedDevice, status, browserPermissionState]) => {
            if (
              !status ||
              (this.isTrackStoppedDueToTrackEnd && status === 'disabled') ||
              browserPermissionState !== 'granted' ||
              selectedDevice?.startsWith(VIRTUAL_DEVICE_PREFIX)
            )
              return;

            this.persistPreference(selectedDevice, status);
          },
        ),
      );
    }
  }

  /**
   * Lists the available audio/video devices
   *
   * Note: It prompts the user for a permission to use devices (if not already granted)
   *
   * @returns an Observable that will be updated if a device is connected or disconnected
   */
  listDevices(): Observable<MediaDeviceInfo[]> {
    return combineLatest([this.getDevices(), this.virtualDevicesSubject]).pipe(
      map(([real, virtual]) => [
        ...real,
        ...virtual.map((d) =>
          createSyntheticDevice(d.deviceId, d.kind, d.label),
        ),
      ]),
    );
  }

  /**
   * Registers a virtual camera or microphone backed by a caller-supplied
   * stream factory. The device appears in `listDevices()` and can be selected
   * via `select()` like any real device.
   *
   * Web only. React Native is not supported.
   *
   * Only supported for camera and microphone managers; calling on any other
   * manager throws.
   */
  registerVirtualDevice(virtualDevice: VirtualDevice<C>): VirtualDeviceHandle {
    if (isReactNative()) {
      throw new Error('Virtual devices are not supported on React Native.');
    }
    if (
      this.trackType !== TrackType.AUDIO &&
      this.trackType !== TrackType.VIDEO
    ) {
      throw new Error(
        'Virtual devices are only supported for camera and microphone.',
      );
    }
    const deviceId = `${VIRTUAL_DEVICE_PREFIX}${generateUUIDv4()}`;
    const entry: VirtualDeviceEntry<C> = {
      deviceId,
      kind: this.mediaDeviceKind,
      ...virtualDevice,
    };

    setCurrentValue(this.virtualDevicesSubject, (current) => [
      ...current,
      entry,
    ]);

    return {
      deviceId: entry.deviceId,
      unregister: async () => {
        await withoutConcurrency(this.virtualDeviceConcurrencyTag, async () => {
          setCurrentValue(this.virtualDevicesSubject, (current) =>
            current.filter((d) => d !== entry),
          );
          if (this.activeVirtualSession?.deviceId === deviceId) {
            await this.stopActiveVirtualSession();
          }
        });

        if (this.state.selectedDevice === deviceId) {
          await this.statusChangeSettled();

          await this.disable({ forceStop: true });
          await this.select(undefined);
        }
      },
    };
  }

  protected sanitizeVirtualStream(stream: MediaStream): MediaStream {
    stream.getTracks().forEach((track) => {
      const originalGetSettings = track.getSettings.bind(track);
      track.getSettings = () => {
        const settings = originalGetSettings();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { deviceId, ...rest } = settings;
        return rest;
      };
    });

    return stream;
  }

  protected findVirtualDevice(deviceId: string | undefined) {
    if (!deviceId) return undefined;
    return getCurrentValue(this.virtualDevicesSubject).find(
      (d) => d.deviceId === deviceId,
    );
  }

  private async stopActiveVirtualSession() {
    const session = this.activeVirtualSession;
    this.activeVirtualSession = undefined;
    await session?.stop?.();
  }

  protected async getSelectedStream(constraints: C): Promise<MediaStream> {
    const deviceId = this.state.selectedDevice;
    if (!deviceId?.startsWith(VIRTUAL_DEVICE_PREFIX)) {
      return this.getStream(constraints);
    }

    return withoutConcurrency(this.virtualDeviceConcurrencyTag, async () => {
      const virtualDevice = this.findVirtualDevice(deviceId);
      if (!virtualDevice) {
        throw new Error(`Virtual device is not registered: ${deviceId}`);
      }

      await this.stopActiveVirtualSession();
      const { stream, stop } = await virtualDevice.getUserMedia(constraints);
      this.activeVirtualSession = { deviceId, stop };

      return this.sanitizeVirtualStream(stream);
    });
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
    this.state.prevStatus = this.state.optimisticStatus;
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
   */
  async disable(options: { forceStop?: boolean }): Promise<void>;
  async disable(forceStop?: boolean): Promise<void>;
  async disable(forceStopOrOptions?: boolean | { forceStop?: boolean }) {
    const forceStop =
      typeof forceStopOrOptions === 'boolean'
        ? forceStopOrOptions
        : (forceStopOrOptions?.forceStop ?? false);

    this.state.prevStatus = this.state.optimisticStatus;
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
      this.state.status !== 'enabled'
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
    this.call.tracer.trace(`registerFilter.${TrackType[this.trackType]}`, null);
    const registered = withoutConcurrency(
      this.filterRegistrationConcurrencyTag,
      async () => {
        await settled(this.statusChangeConcurrencyTag);
        this.filters.push(entry);
        await this.applySettingsToStream();
      },
    );

    return {
      registered,
      unregister: () =>
        withoutConcurrency(this.filterRegistrationConcurrencyTag, async () => {
          await settled(this.statusChangeConcurrencyTag);
          entry.stop?.();
          this.filters = this.filters.filter((f) => f !== entry);
          await this.applySettingsToStream();
          this.call.tracer.trace(
            `unregisterFilter.${TrackType[this.trackType]}`,
            null,
          );
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
      throw new Error('This method is not supported in React Native.');
    }
    const prevDeviceId = this.state.selectedDevice;
    if (deviceId === prevDeviceId) {
      return;
    }
    try {
      this.state.setDevice(deviceId);
      await this.applySettingsToStream();
    } catch (error) {
      this.state.setDevice(prevDeviceId);
      throw error;
    }
  }

  /**
   * Disposes the manager.
   *
   * @internal
   */
  dispose = () => {
    this.subscriptions.forEach((s) => s());
    this.subscriptions = [];
    this.areSubscriptionsSetUp = false;
    this.virtualDevicesSubject.next([]);
  };

  protected async applySettingsToStream() {
    await withCancellation(this.statusChangeConcurrencyTag, async (signal) => {
      if (this.enabled) {
        try {
          await this.muteStream();
          this.state.setStatus('disabled');

          if (signal.aborted) {
            return;
          }

          await this.unmuteStream();
          this.state.setStatus('enabled');
        } finally {
          if (!signal.aborted) {
            this.state.setPendingStatus(this.state.status);
          }
        }
      }
    });
  }

  protected abstract getDevices(): Observable<MediaDeviceInfo[]>;

  protected getResolvedConstraints(constraints: C): C {
    return constraints;
  }

  protected abstract getStream(constraints: C): Promise<MediaStream>;

  protected publishStream(
    stream: MediaStream,
    options?: TrackPublishOptions,
  ): Promise<void> {
    return this.call.publish(stream, this.trackType, options);
  }

  protected stopPublishStream(): Promise<void> {
    return this.call.stopPublish(this.trackType);
  }

  protected getTracks(): MediaStreamTrack[] {
    return this.state.mediaStream?.getTracks() ?? [];
  }

  protected async muteStream(stopTracks: boolean = true) {
    const mediaStream = this.state.mediaStream;
    if (!mediaStream) return;
    this.logger.debug(`${stopTracks ? 'Stopping' : 'Disabling'} stream`);
    if (this.call.state.callingState === CallingState.JOINED) {
      await this.stopPublishStream();
    }
    this.muteLocalStream(stopTracks);
    const allEnded = this.getTracks().every((t) => t.readyState === 'ended');
    if (allEnded) {
      await this.stopActiveVirtualSession();
      // @ts-expect-error release() is present in react-native-webrtc
      if (typeof mediaStream.release === 'function') {
        // @ts-expect-error called to dispose the stream in RN
        mediaStream.release();
      }
      this.state.setMediaStream(undefined, undefined);
      this.filters.forEach((entry) => entry.stop?.());
    }
  }

  private disableTracks() {
    this.getTracks().forEach((track) => {
      if (track.enabled) track.enabled = false;
    });
  }

  private enableTracks() {
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
      this.disableTracks();
    }
  }

  protected async unmuteStream() {
    this.logger.debug('Starting stream');
    let stream: MediaStream;
    let rootStream: Promise<MediaStream> | undefined;
    if (
      this.state.mediaStream &&
      this.getTracks().every((t) => t.readyState === 'live')
    ) {
      stream = this.state.mediaStream;
      this.enableTracks();
    } else {
      const defaultConstraints = this.state.defaultConstraints;
      const constraints = this.getResolvedConstraints({
        ...defaultConstraints,
        deviceId: this.state.selectedDevice
          ? { exact: this.state.selectedDevice }
          : undefined,
      } as C);

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

      rootStream = this.getSelectedStream(constraints);

      stream = await this.filters.reduce(
        (parent, entry) =>
          parent
            .then((inputStream) => {
              const { stop, output } = entry.start(inputStream);
              entry.stop = stop;
              return output;
            })
            .then(chainWith(parent), (error) => {
              this.logger.warn(
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
      const handleTrackEnded = async () => {
        await this.statusChangeSettled();
        if (this.enabled) {
          this.isTrackStoppedDueToTrackEnd = true;
          setTimeout(() => {
            this.isTrackStoppedDueToTrackEnd = false;
          }, 2000);
          await this.disable();
        }
      };
      const createTrackMuteHandler = (muted: boolean) => () => {
        if (!isMobile() || this.trackType !== TrackType.VIDEO) return;
        this.call.notifyTrackMuteState(muted, this.trackType).catch((err) => {
          this.logger.warn('Error while notifying track mute state', err);
        });
      };
      stream.getTracks().forEach((track) => {
        const muteHandler = createTrackMuteHandler(true);
        const unmuteHandler = createTrackMuteHandler(false);
        track.addEventListener('mute', muteHandler);
        track.addEventListener('unmute', unmuteHandler);
        track.addEventListener('ended', handleTrackEnded);
        this.subscriptions.push(() => {
          track.removeEventListener('mute', muteHandler);
          track.removeEventListener('unmute', unmuteHandler);
          track.removeEventListener('ended', handleTrackEnded);
        });
      });
    }
  }

  private get mediaDeviceKind(): 'audioinput' | 'videoinput' {
    if (this.trackType === TrackType.AUDIO) return 'audioinput';
    if (this.trackType === TrackType.VIDEO) return 'videoinput';
    throw new Error('Invalid track type');
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
            const currentDevice = this.findDevice(currentDevices, deviceId);
            const prevDevice = this.findDevice(prevDevices, deviceId);
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
              this.dispatchDeviceDisconnectedEvent(prevDevice!);
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
              } else if (!hasPending(this.statusChangeConcurrencyTag)) {
                await this.applySettingsToStream();
              }
            }
          } catch (err) {
            this.logger.warn(
              'Unexpected error while handling disconnected or replaced device',
              err,
            );
          }
        },
      ),
    );
  }

  protected findDevice(devices: MediaDeviceInfo[], deviceId: string) {
    const kind = this.mediaDeviceKind;
    return devices.find((d) => d.deviceId === deviceId && d.kind === kind);
  }

  private dispatchDeviceDisconnectedEvent(device: MediaDeviceInfo) {
    const event: DeviceDisconnectedEvent = {
      type: 'device.disconnected',
      call_cid: this.call.cid,
      status: this.isTrackStoppedDueToTrackEnd
        ? this.state.prevStatus
        : this.state.status,
      deviceId: device.deviceId,
      label: device.label,
      kind: device.kind,
    };

    this.call.tracer.trace('device.disconnected', event);
    this.call.streamClient.dispatchEvent(event);
  }

  private persistPreference(
    selectedDevice: string | undefined,
    status: InputDeviceStatus,
  ) {
    const deviceKind = this.mediaDeviceKind;
    const deviceKey = deviceKind === 'audioinput' ? 'microphone' : 'camera';
    const muted =
      status === 'disabled' ? true : status === 'enabled' ? false : undefined;

    const { storageKey } = this.devicePersistence;
    if (!selectedDevice) {
      writePreferences(undefined, deviceKey, muted, storageKey);
      return;
    }

    const devices = getCurrentValue(this.listDevices()) || [];
    const currentDevice =
      this.findDevice(devices, selectedDevice) ??
      createSyntheticDevice(selectedDevice, deviceKind);

    writePreferences(currentDevice, deviceKey, muted, storageKey);
  }

  protected async applyPersistedPreferences(enabledInCallType: boolean) {
    const deviceKey: DevicePreferenceKey =
      this.trackType === TrackType.AUDIO ? 'microphone' : 'camera';
    const preferences = readPreferences(this.devicePersistence.storageKey);
    const preferenceList = toPreferenceList(preferences[deviceKey]);

    if (preferenceList.length === 0) return false;

    let muted: boolean | undefined;
    let appliedDevice = false;
    let appliedMute = false;

    const devices = await firstValueFrom(this.listDevices());
    for (const preference of preferenceList) {
      muted ??= preference.muted;
      if (preference.selectedDeviceId === defaultDeviceId) break;

      const device =
        devices.find((d) => d.deviceId === preference.selectedDeviceId) ??
        devices.find((d) => d.label === preference.selectedDeviceLabel);

      if (device) {
        appliedDevice = true;
        if (!this.state.selectedDevice) {
          await this.select(device.deviceId);
        }
        muted = preference.muted;
        break;
      }
    }

    const canPublish = this.call.permissionsContext.canPublish(this.trackType);
    if (typeof muted === 'boolean' && enabledInCallType && canPublish) {
      await this.applyMutedState(muted);
      appliedMute = true;
    }

    return appliedDevice || appliedMute;
  }

  private async applyMutedState(muted: boolean) {
    if (this.state.status !== undefined) return;
    if (muted) {
      await this.disable();
    } else {
      await this.enable();
    }
  }
}
