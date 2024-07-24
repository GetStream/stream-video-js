import { TrackType } from '../../gen/video/sfu/models/models';
import { TrackMuteType } from '../../types';
import { ensureExhausted } from '../../helpers/ensureExhausted';

export const trackTypeToParticipantStreamKey = (
  trackType: TrackType,
):
  | 'audioStream'
  | 'videoStream'
  | 'screenShareStream'
  | 'screenShareAudioStream'
  | undefined => {
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
      ensureExhausted(trackType, 'Unknown track type');
  }
};

export const muteTypeToTrackType = (
  muteType: TrackMuteType,
): TrackType | undefined => {
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
      ensureExhausted(muteType, 'Unknown mute type');
  }
};

export const toTrackType = (trackType: string): TrackType | undefined => {
  switch (trackType) {
    case 'TRACK_TYPE_AUDIO':
      return TrackType.AUDIO;
    case 'TRACK_TYPE_VIDEO':
      return TrackType.VIDEO;
    case 'TRACK_TYPE_SCREEN_SHARE':
      return TrackType.SCREEN_SHARE;
    case 'TRACK_TYPE_SCREEN_SHARE_AUDIO':
      return TrackType.SCREEN_SHARE_AUDIO;
    default:
      return undefined;
  }
};
