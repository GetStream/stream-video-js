import { Observable } from 'rxjs';
import { Call } from '../Call';
import { CameraDirection, CameraManagerState } from './CameraManagerState';
import { DeviceManager } from './DeviceManager';
import { getVideoDevices, getVideoStream } from './devices';
import { VideoSettingsResponse } from '../gen/coordinator';
import { TrackType } from '../gen/video/sfu/models/models';
import { isMobile } from '../helpers/compatibility';
import { isReactNative } from '../helpers/platforms';

export class CameraManager extends DeviceManager<CameraManagerState> {
  private targetResolution = {
    width: 1280,
    height: 720,
  };

  /**
   * Constructs a new CameraManager.
   *
   * @param call the call instance.
   */
  constructor(call: Call) {
    super(call, new CameraManagerState(), TrackType.VIDEO);
  }

  private isDirectionSupportedByDevice() {
    return isReactNative() || isMobile();
  }

  /**
   * Select the camera direction.
   *
   * @param direction the direction of the camera to select.
   */
  async selectDirection(direction: Exclude<CameraDirection, undefined>) {
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
    if (isReactNative()) {
      return;
    }
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

    // apply a direction and enable the camera only if in "pristine" state
    // and server defaults are not deferred to application code
    const canPublish = this.call.permissionsContext.canPublish(this.trackType);
    if (this.state.status === undefined && !this.deferServerDefaults) {
      if (!this.state.direction && !this.state.selectedDevice) {
        const direction = settings.camera_facing === 'front' ? 'front' : 'back';
        await this.selectDirection(direction);
      }

      if (canPublish && settings.camera_default_on && settings.enabled) {
        await this.enable();
      }
    }

    const { mediaStream } = this.state;
    if (canPublish && publish && this.enabled && mediaStream) {
      await this.publishStream(mediaStream);
    }
  }

  protected override getDevices(): Observable<MediaDeviceInfo[]> {
    return getVideoDevices(this.call.tracer);
  }

  protected override getStream(
    constraints: MediaTrackConstraints,
  ): Promise<MediaStream> {
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
    return getVideoStream(constraints, this.call.tracer);
  }
}
