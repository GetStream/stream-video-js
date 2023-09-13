import { Call } from '../Call';
import {
  TrackType,
  TrackUnpublishReason,
} from '../gen/video/sfu/models/models';

/**
 * An event handler that handles soft mutes.
 *
 * @param call the call.
 */
export const handleRemoteSoftMute = (call: Call) => {
  return call.on('trackUnpublished', async (event) => {
    if (event.eventPayload.oneofKind !== 'trackUnpublished') return;
    const {
      trackUnpublished: { cause, type, sessionId },
    } = event.eventPayload;
    const { localParticipant } = call.state;
    if (
      cause === TrackUnpublishReason.MODERATION &&
      sessionId === localParticipant?.sessionId
    ) {
      const logger = call.logger;
      logger(
        'info',
        `Local participant's ${TrackType[type]} track is muted remotely`,
      );
      try {
        if (type === TrackType.VIDEO) {
          await call.camera.disable();
        } else if (type === TrackType.AUDIO) {
          await call.microphone.disable();
        } else {
          logger(
            'warn',
            'Unsupported track type to soft mute',
            TrackType[type],
          );
        }
        if (call.publisher?.isPublishing(type)) {
          await call.stopPublish(type);
        }
      } catch (error) {
        logger('error', 'Failed to stop publishing', error);
      }
    }
  });
};
