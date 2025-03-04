import { Observable } from 'rxjs';
import { Call } from '../Call';
import { CameraDirection, CameraManagerState } from './CameraManagerState';
import { InputMediaDeviceManager } from './InputMediaDeviceManager';
import { getVideoDevices, getVideoStream } from './devices';
import { OwnCapability, VideoSettingsResponse } from '../gen/coordinator';
import { TrackType } from '../gen/video/sfu/models/models';
import { isMobile } from '../helpers/compatibility';
import { isReactNative } from '../helpers/platforms';

export class CameraManager extends InputMediaDeviceManager<CameraManagerState> {
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
    if (this.isDirectionSupportedByDevice()) {
      if (isReactNative()) {
        const videoTrack = this.getTracks()[0];
        if (!videoTrack) {
          this.logger('warn', 'No video track found to do direction selection');
          return;
        }
        await videoTrack.applyConstraints({
          facingMode: direction === 'front' ? 'user' : 'environment',
        });
        this.state.setDirection(direction);
        this.state.setDevice(undefined);
      } else {
        // web mobile
        this.state.setDirection(direction);
        // Providing both device id and direction doesn't work, so we deselect the device
        this.state.setDevice(undefined);
        this.getTracks().forEach((track) => {
          track.stop();
        });
        await this.unmuteStream();
      }
    } else {
      this.logger('warn', 'Camera direction ignored for desktop devices');
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
    this.targetResolution.height = resolution.height;
    this.targetResolution.width = resolution.width;
    if (this.state.optimisticStatus === 'enabled') {
      try {
        await this.statusChangeSettled();
      } catch (error) {
        // couldn't enable device, target resolution will be applied the next time user attempts to start the device
        this.logger('warn', 'could not apply target resolution', error);
      }
    }
    if (this.enabled && this.state.mediaStream) {
      const [videoTrack] = this.state.mediaStream.getVideoTracks();
      if (!videoTrack) return;
      const { width, height } = videoTrack.getSettings();
      if (
        width !== this.targetResolution.width ||
        height !== this.targetResolution.height
      ) {
        await this.applySettingsToStream();
        this.logger(
          'debug',
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
    const hasPublishedVideo = !!this.call.state.localParticipant?.videoStream;
    const hasPermission = this.call.permissionsContext.hasPermission(
      OwnCapability.SEND_AUDIO,
    );
    if (hasPublishedVideo || !hasPermission) return;

    // Wait for any in progress camera operation
    await this.statusChangeSettled();

    const { target_resolution, camera_facing, camera_default_on } = settings;
    await this.selectTargetResolution(target_resolution);

    // Set camera direction if it's not yet set
    if (!this.state.direction && !this.state.selectedDevice) {
      this.state.setDirection(camera_facing === 'front' ? 'front' : 'back');
    }

    if (!publish) return;

    const { mediaStream } = this.state;
    if (this.enabled && mediaStream) {
      // The camera is already enabled (e.g. lobby screen). Publish the stream
      await this.publishStream(mediaStream);
    } else if (this.state.status === undefined && camera_default_on) {
      // Start camera if backend config specifies, and there is no local setting
      await this.enable();
    }
  }

  protected getDevices(): Observable<MediaDeviceInfo[]> {
    return getVideoDevices();
  }

  protected getStream(
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
    return getVideoStream(constraints);
  }
}
