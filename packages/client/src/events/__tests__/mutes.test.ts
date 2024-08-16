import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Call } from '../../Call';
import {
  TrackType,
  TrackUnpublishReason,
} from '../../gen/video/sfu/models/models';
import { StreamClient } from '../../coordinator/connection/client';
import { handleRemoteSoftMute } from '../mutes';
import type { CallEventListener } from '../../coordinator/connection/types';

describe('mutes', () => {
  describe('soft mute', () => {
    let handler: CallEventListener<'trackUnpublished'>;
    let call: Call;

    beforeEach(() => {
      // @ts-expect-error
      call = new Call({
        type: 'test',
        id: 'test',
        streamClient: new StreamClient('api-key'),
      });
      // disable all event handlers
      call['dispatcher'].offAll();

      // @ts-expect-error partial data
      call.publisher = vi.fn();
      // @ts-expect-error partial data
      call.publisher.isPublishing = vi.fn().mockReturnValue(true);

      vi.spyOn(call.camera, 'disable').mockResolvedValue(undefined);
      vi.spyOn(call.microphone, 'disable').mockResolvedValue(undefined);
      vi.spyOn(call.screenShare, 'disable').mockResolvedValue(undefined);

      // @ts-ignore
      call.on = (event: string, h) => {
        if (event === 'trackUnpublished') {
          // @ts-ignore
          handler = h;
        }
      };

      handleRemoteSoftMute(call);

      // @ts-expect-error partial data
      call.state.updateOrAddParticipant('session-id', {
        userId: 'user-id',
        sessionId: 'session-id',
        isLocalParticipant: true,
        publishedTracks: [
          TrackType.VIDEO,
          TrackType.AUDIO,
          TrackType.SCREEN_SHARE,
          TrackType.SCREEN_SHARE_AUDIO,
        ],
      });
    });

    it('should automatically mute only when cause is moderation', () => {
      handler!({
        cause: TrackUnpublishReason.PERMISSION_REVOKED,
        type: TrackType.VIDEO,
        sessionId: 'session-id',
        userId: 'user-id',
      });
      expect(call.camera.disable).not.toHaveBeenCalled();
    });

    it('should handle remote soft video mute', () => {
      handler!({
        cause: TrackUnpublishReason.MODERATION,
        type: TrackType.VIDEO,
        sessionId: 'session-id',
        userId: 'user-id',
      });
      expect(call.camera.disable).toHaveBeenCalled();
    });

    it('should handle remote soft audio mute', () => {
      handler!({
        cause: TrackUnpublishReason.MODERATION,
        type: TrackType.AUDIO,
        sessionId: 'session-id',
        userId: 'user-id',
      });
      expect(call.microphone.disable).toHaveBeenCalled();
    });

    it('should handle remote soft screenshare mute', () => {
      handler!({
        cause: TrackUnpublishReason.MODERATION,
        type: TrackType.SCREEN_SHARE,
        sessionId: 'session-id',
        userId: 'user-id',
      });
      expect(call.camera.disable).not.toHaveBeenCalled();
      expect(call.microphone.disable).not.toHaveBeenCalled();
      expect(call.screenShare.disable).toHaveBeenCalled();
    });
  });
});
