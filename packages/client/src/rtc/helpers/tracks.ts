import { TrackType } from '../../gen/video/sfu/models/models';
import type { StreamVideoParticipant } from '../types';

export const trackTypeToParticipantStreamKey = (
  trackType: TrackType,
): keyof StreamVideoParticipant | undefined => {
  switch (trackType) {
    case TrackType.SCREEN_SHARE:
      return 'screenShareStream';
    case TrackType.VIDEO:
      return 'videoStream';
    case TrackType.AUDIO:
      return 'audioStream';
    default:
      console.error(`Unknown track type: ${trackType}`);
      return undefined;
  }
};
