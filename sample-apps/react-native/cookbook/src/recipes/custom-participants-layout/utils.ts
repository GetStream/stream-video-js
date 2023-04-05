import {
  SfuModels,
  StreamVideoParticipant,
} from '@stream-io/video-react-native-sdk';

export const hasScreenShare = (p: StreamVideoParticipant) =>
  p.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE);

export const hasVideo = (p: StreamVideoParticipant) =>
  p.publishedTracks.includes(SfuModels.TrackType.VIDEO);

export const hasAudio = (p: StreamVideoParticipant) =>
  p.publishedTracks.includes(SfuModels.TrackType.AUDIO);
