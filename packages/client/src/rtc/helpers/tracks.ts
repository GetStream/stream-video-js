import { TrackType } from '../../gen/video/sfu/models/models';
import type { StreamVideoParticipant } from '../../types';
import { TrackMuteType } from '../../types';

export const trackTypeToParticipantStreamKey = (
  trackType: TrackType,
): keyof StreamVideoParticipant => {
  switch (trackType) {
    case TrackType.SCREEN_SHARE:
      return 'screenShareStream';
    case TrackType.SCREEN_SHARE_AUDIO:
      return 'screenShareAudioStream';
    case TrackType.VIDEO:
      return 'videoStream';
    case TrackType.AUDIO:
      return 'audioStream';
    case TrackType.UNSPECIFIED:
      throw new Error('Track type is unspecified');
    default:
      const exhaustiveTrackTypeCheck: never = trackType;
      throw new Error(`Unknown track type: ${exhaustiveTrackTypeCheck}`);
  }
};

export const muteTypeToTrackType = (muteType: TrackMuteType): TrackType => {
  switch (muteType) {
    case 'audio':
      return TrackType.AUDIO;
    case 'video':
      return TrackType.VIDEO;
    case 'screenshare':
      return TrackType.SCREEN_SHARE;
    case 'screenshare_audio':
      return TrackType.SCREEN_SHARE_AUDIO;
    default:
      const exhaustiveMuteTypeCheck: never = muteType;
      throw new Error(`Unknown mute type: ${exhaustiveMuteTypeCheck}`);
  }
};
