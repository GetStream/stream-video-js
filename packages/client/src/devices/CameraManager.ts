import { firstValueFrom, Observable } from 'rxjs';
import { Call } from '../Call';
import { CameraDirection, CameraManagerState } from './CameraManagerState';
import { DeviceManager } from './DeviceManager';
import { getVideoDevices, getVideoStream } from './devices';
import { VideoSettingsResponse } from '../gen/coordinator';
import { TrackType } from '../gen/video/sfu/models/models';
import { isMobile } from '../helpers/compatibility';
import { isReactNative } from '../helpers/platforms';
import { CallingState } from '../store';
import { DevicePersistenceOptions } from './devicePersistence';

export class CameraManager extends DeviceManager<CameraManagerState> {
  private targetResolution = {
    width: 1280,
    height: 720,
  };

  /**
   * Constructs a new CameraManager.
   *
   * @param call the call instance.
   * @param devicePersistence the device persistence preferences to use.
   */
  constructor(
    call: Call,
    devicePersistence: Required<DevicePersistenceOptions>,
  ) {
    super(
      call,
      new CameraManagerState(call.tracer),
      TrackType.VIDEO,
      devicePersistence,
    );
  }

  private isDirectionSupportedByDevice() {
    return isReactNative() || isMobile();
  }

  /**
   * Select the camera direction.
   *
   * @param direction the direction of the camera to select.
   * @param options additional direction selection options.
   */
  async selectDirection(
    direction: Exclude<CameraDirection, undefined>,
    options: { enableCamera?: boolean } = {},
  ) {
    if (!this.isDirectionSupportedByDevice()) {
      this.logger.warn('Setting direction is not supported on this device');
      return;
    }

    if (isReactNative()) {
      const videoTrack = this.getTracks()[0] as MediaStreamTrack | undefined;
      await videoTrack?.applyConstraints({
        facingMode: direction === 'front' ? 'user' : 'environment',
      });
    }
    // providing both device id and direction doesn't work, so we deselect the device
    this.state.setDirection(direction);
    this.state.setDevice(undefined);

    const { enableCamera = true } = options;
    if (isReactNative() || !enableCamera) return;

    this.getTracks().forEach((track) => track.stop());
    try {
      await this.unmuteStream();
    } catch (error) {
      if (error instanceof Error && error.name === 'NotReadableError') {
        // the camera is already in use, and the device can't use it unless it's released.
        // in that case, we need to stop the stream and start it again.
        await this.muteStream();
        await this.unmuteStream();
      }
      throw error;
    }
  }

  /**
   * Flips the camera direction: if it's front it will change to back, if it's back, it will change to front.
   *
   * Note: if there is no available camera with the desired direction, this method will do nothing.
   * @returns
   */
  async flip() {
    const newDirection = this.state.direction === 'front' ? 'back' : 'front';
    await this.selectDirection(newDirection);
  }

  /**
   * @internal
   */
  async selectTargetResolution(resolution: { width: number; height: number }) {
    // normalize target resolution to landscape format.
    // on mobile devices, the device itself adjusts the resolution to portrait or landscape
    // depending on the orientation of the device. using portrait resolution
    // will result in falling back to the default resolution (640x480).
    let { width, height } = resolution;
    if (width < height) [width, height] = [height, width];
    this.targetResolution.height = height;
    this.targetResolution.width = width;

    if (this.state.optimisticStatus === 'enabled') {
      try {
        await this.statusChangeSettled();
      } catch (error) {
        // couldn't enable device, target resolution will be applied the next time user attempts to start the device
        this.logger.warn('could not apply target resolution', error);
      }
    }
    if (this.enabled && this.state.mediaStream) {
      const [videoTrack] = this.state.mediaStream.getVideoTracks();
      if (!videoTrack) return;
      const { width: w, height: h } = videoTrack.getSettings();
      if (w !== width || h !== height) {
        await this.applySettingsToStream();
        this.logger.debug(
          `${width}x${height} target resolution applied to media stream`,
        );
      }
    }
  }

  override enable(): Promise<void> {
    if (
      isReactNative() &&
      this.call.state.callingState !== CallingState.JOINED
    ) {
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
    if (
      isReactNative() &&
      this.call.state.callingState !== CallingState.JOINED
    ) {
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
    if (
      isReactNative() &&
      this.call.state.callingState !== CallingState.JOINED
    ) {
      this.state.setPendingStatus(
        this.state.optimisticStatus === 'enabled' ? 'disabled' : 'enabled',
      );
      return Promise.resolve();
    }

    return super.toggle();
  }

  /**
   * Applies the video settings to the camera.
   *
   * @param settings the video settings to apply.
   * @param publish whether to publish the stream after applying the settings.
   */
  async apply(settings: VideoSettingsResponse, publish: boolean) {
    // Wait for any in progress camera operation
    await this.statusChangeSettled();
    await this.selectTargetResolution(settings.target_resolution);

    const enabledInCallType = settings.enabled ?? true;
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
      persistedPreferencesApplied =
        await this.applyPersistedPreferences(enabledInCallType);
    }

    // apply a direction and enable the camera only if in "pristine" state,
    // and there are no persisted preferences
    const canPublish = this.call.permissionsContext.canPublish(this.trackType);
    if (shouldApplyDefaults && !persistedPreferencesApplied) {
      if (!this.state.direction && !this.state.selectedDevice) {
        const direction = settings.camera_facing === 'front' ? 'front' : 'back';
        await this.selectDirection(direction, { enableCamera: false });
      }

      if (canPublish && settings.camera_default_on && enabledInCallType) {
        await this.enable();
      }
    }

    if (isReactNative() && publish && canPublish) {
      // On RN the camera is enabled/disabled optimistically before JOINED. Reconcile now
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
    return getVideoDevices(this.call.tracer);
  }

  protected override getResolvedConstraints(
    constraints: MediaTrackConstraints,
  ): MediaTrackConstraints {
    constraints.width = this.targetResolution.width;
    constraints.height = this.targetResolution.height;
    // We can't set both device id and facing mode
    // Device id has higher priority

    if (
      !constraints.deviceId &&
      this.state.direction &&
      this.isDirectionSupportedByDevice()
    ) {
      constraints.facingMode =
        this.state.direction === 'front' ? 'user' : 'environment';
    }

    return constraints;
  }

  protected override async getStream(
    constraints: MediaTrackConstraints,
  ): Promise<MediaStream> {
    // Ensure the call's media factory exists before capture so the resulting
    // track is owned by it (the WebRTC globals resolve to the live factory).
    await this.call.ensureMediaFactory();
    return getVideoStream(constraints, this.call.tracer);
  }
}
