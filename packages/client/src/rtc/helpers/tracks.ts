import { TrackType } from '../../gen/video/sfu/models/models';
import type {
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
} from '../../types';

export const trackTypeToParticipantStreamKey = (
  trackType: TrackType,
): keyof StreamVideoParticipant => {
  switch (trackType) {
    case TrackType.SCREEN_SHARE:
      return 'screenShareStream';
    case TrackType.VIDEO:
      return 'videoStream';
    case TrackType.AUDIO:
      return 'audioStream';
    default:
      throw new Error(`Unknown track type: ${trackType}`);
  }
};

export const trackTypeToDeviceIdKey = (
  trackType: TrackType,
): keyof StreamVideoLocalParticipant | undefined => {
  switch (trackType) {
    case TrackType.AUDIO:
      return 'audioDeviceId';
    case TrackType.VIDEO:
      return 'videoDeviceId';
    case TrackType.SCREEN_SHARE:
      return undefined;
    default:
      throw new Error(`Unknown track type: ${trackType}`);
  }
};

export const muteTypeToTrackType = (
  muteType: 'audio' | 'video' | 'screenshare',
): TrackType => {
  switch (muteType) {
    case 'audio':
      return TrackType.AUDIO;
    case 'video':
      return TrackType.VIDEO;
    case 'screenshare':
      return TrackType.SCREEN_SHARE;
    default:
      throw new Error(`Unknown mute type: ${muteType}`);
  }
};
