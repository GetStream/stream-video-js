import { describe, expect, it } from 'vitest';
import { TrackType } from '../../gen/video/sfu/models/models';
import { CallSettingsResponse, OwnCapability } from '../../gen/coordinator';
import { PermissionsContext } from '../PermissionsContext';

describe('PermissionsContext', () => {
  it('should set permissions', () => {
    const ctx = new PermissionsContext();
    ctx.setPermissions([OwnCapability.SEND_AUDIO]);
    expect(ctx.hasPermission(OwnCapability.SEND_AUDIO)).toBe(true);
    expect(ctx.hasPermission(OwnCapability.SEND_VIDEO)).toBe(false);
  });

  it('should set call settings', () => {
    const ctx = new PermissionsContext();
    const settings: CallSettingsResponse = {
      // @ts-expect-error incomplete settings
      audio: { access_request_enabled: true },
      // @ts-expect-error incomplete settings
      video: { access_request_enabled: false },
      // @ts-expect-error incomplete settings
      screensharing: { access_request_enabled: false },
    };
    ctx.setCallSettings(settings);
    expect(ctx.canRequest(OwnCapability.SEND_AUDIO)).toBe(true);
    expect(ctx.canRequest(OwnCapability.SEND_VIDEO)).toBe(false);
    expect(ctx.canRequest(OwnCapability.SCREENSHARE)).toBe(false);
    expect(ctx.canRequest(OwnCapability.BLOCK_USERS)).toBe(false);
  });

  it('should check if user can publish', () => {
    const ctx = new PermissionsContext();
    ctx.setPermissions([OwnCapability.SEND_AUDIO]);
    expect(ctx.canPublish(TrackType.AUDIO)).toBe(true);
    expect(ctx.canPublish(TrackType.VIDEO)).toBe(false);
    expect(ctx.canPublish(TrackType.SCREEN_SHARE)).toBe(false);
    expect(ctx.canPublish(TrackType.SCREEN_SHARE_AUDIO)).toBe(false);
    expect(ctx.canPublish(TrackType.UNSPECIFIED)).toBe(false);
  });
});
