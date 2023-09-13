import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Call } from '../../Call';
import {
  TrackType,
  TrackUnpublishReason,
} from '../../gen/video/sfu/models/models';
import { SfuEvent } from '../../gen/video/sfu/event/events';
import { StreamClient } from '../../coordinator/connection/client';
import { handleRemoteSoftMute } from '../mutes';
import { SfuEventListener } from '../../rtc';

describe('mutes', () => {
  describe('soft mute', () => {
    let handler: SfuEventListener;
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

      vi.spyOn(call, 'stopPublish').mockResolvedValue(undefined);
      vi.spyOn(call.camera, 'disable').mockResolvedValue(undefined);
      vi.spyOn(call.microphone, 'disable').mockResolvedValue(undefined);

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

    it('should automatically mute only when cause is moderation', async () => {
      const event: SfuEvent = {
        eventPayload: {
          oneofKind: 'trackUnpublished',
          trackUnpublished: {
            cause: TrackUnpublishReason.PERMISSION_REVOKED,
            type: TrackType.VIDEO,
            sessionId: 'session-id',
            userId: 'user-id',
          },
        },
      };

      await handler!(event);
      expect(call.camera.disable).not.toHaveBeenCalled();
      expect(call.stopPublish).not.toHaveBeenCalledWith(TrackType.VIDEO);
    });

    it('should handle remote soft video mute', async () => {
      const event: SfuEvent = {
        eventPayload: {
          oneofKind: 'trackUnpublished',
          trackUnpublished: {
            cause: TrackUnpublishReason.MODERATION,
            type: TrackType.VIDEO,
            sessionId: 'session-id',
            userId: 'user-id',
          },
        },
      };

      await handler!(event);
      expect(call.camera.disable).toHaveBeenCalled();
      expect(call.stopPublish).toHaveBeenCalledWith(TrackType.VIDEO);
    });

    it('should handle remote soft audio mute', async () => {
      const event: SfuEvent = {
        eventPayload: {
          oneofKind: 'trackUnpublished',
          trackUnpublished: {
            cause: TrackUnpublishReason.MODERATION,
            type: TrackType.AUDIO,
            sessionId: 'session-id',
            userId: 'user-id',
          },
        },
      };

      await handler!(event);
      expect(call.microphone.disable).toHaveBeenCalled();
      expect(call.stopPublish).toHaveBeenCalledWith(TrackType.AUDIO);
    });

    it('should handle remote soft screenshare mute', async () => {
      const event: SfuEvent = {
        eventPayload: {
          oneofKind: 'trackUnpublished',
          trackUnpublished: {
            cause: TrackUnpublishReason.MODERATION,
            type: TrackType.SCREEN_SHARE,
            sessionId: 'session-id',
            userId: 'user-id',
          },
        },
      };

      await handler!(event);
      expect(call.camera.disable).not.toHaveBeenCalled();
      expect(call.microphone.disable).not.toHaveBeenCalled();
      expect(call.stopPublish).toHaveBeenCalledWith(TrackType.SCREEN_SHARE);
    });
  });
});
