import { CallSettingsResponse, OwnCapability } from '../gen/coordinator';
import { TrackType } from '../gen/video/sfu/models/models';
import { ensureExhausted } from '../helpers/ensureExhausted';

/**
 * Stores the permissions for the current user and exposes
 * a few helper methods which make it easier to work with permissions.
 *
 * This is an internal class meant to be used in combination with
 * a {@link Call} instance.
 *
 * @internal
 */
export class PermissionsContext {
  private permissions: OwnCapability[] = [];
  private settings?: CallSettingsResponse;

  /**
   * Sets the permissions for the current user.
   *
   * @param permissions the permissions to set.
   */
  setPermissions = (permissions: OwnCapability[]) => {
    this.permissions = permissions || [];
  };

  /**
   * Sets the settings for the bound call.
   * @param settings
   */
  setCallSettings = (settings: CallSettingsResponse) => {
    this.settings = settings;
  };

  /**
   * Checks if the current user has a specific permission.
   *
   * @param permission the permission to check for.
   */
  hasPermission = (permission: OwnCapability) => {
    return this.permissions.includes(permission);
  };

  /**
   * Helper method that checks whether the current user has the permission
   * to publish the given track type.
   */
  canPublish = (trackType: TrackType) => {
    switch (trackType) {
      case TrackType.AUDIO:
        return this.hasPermission(OwnCapability.SEND_AUDIO);
      case TrackType.VIDEO:
        return this.hasPermission(OwnCapability.SEND_VIDEO);
      case TrackType.SCREEN_SHARE:
      case TrackType.SCREEN_SHARE_AUDIO:
        return this.hasPermission(OwnCapability.SCREENSHARE);
      case TrackType.UNSPECIFIED:
        return false;
      default:
        ensureExhausted(trackType, 'Unknown track type');
    }
  };

  /**
   * Checks if the current user can request a specific permission
   * within the call.
   *
   * @param permission the permission to check for.
   * @param settings the call settings to check against (optional).
   */
  canRequest = (
    permission: OwnCapability,
    settings: CallSettingsResponse | undefined = this.settings,
  ) => {
    if (!settings) return false;

    const { audio, video, screensharing } = settings;
    switch (permission) {
      case OwnCapability.SEND_AUDIO:
        return audio.access_request_enabled;
      case OwnCapability.SEND_VIDEO:
        return video.access_request_enabled;
      case OwnCapability.SCREENSHARE:
        return screensharing.access_request_enabled;
      default:
        return false;
    }
  };
}
