import { Comparator } from './';
import { TrackType } from '../gen/video/sfu/models/models';
import { StreamVideoParticipant } from '../rtc/types';

/**
 * A comparator which sorts participants by the fact that they are the dominant speaker or not.
 *
 * @param a the first participant.
 * @param b the second participant.
 */
export const dominantSpeaker: Comparator<StreamVideoParticipant> = (a, b) => {
  if (a.isDominantSpeaker && !b.isDominantSpeaker) return -1;
  if (!a.isDominantSpeaker && b.isDominantSpeaker) return 1;
  return 0;
};

/**
 * A comparator which sorts participants by screen sharing status.
 *
 * @param a the first participant.
 * @param b the second participant.
 */
export const screenSharing: Comparator<StreamVideoParticipant> = (a, b) => {
  if (hasScreenShare(a) && !hasScreenShare(b)) return -1;
  if (!hasScreenShare(a) && hasScreenShare(b)) return 1;
  return 0;
};

/**
 * A comparator which sorts participants by video status.
 *
 * @param a the first participant.
 * @param b the second participant.
 */
export const video: Comparator<StreamVideoParticipant> = (a, b) => {
  if (hasVideo(a) && !hasVideo(b)) return -1;
  if (!hasVideo(a) && hasVideo(b)) return 1;
  return 0;
};

/**
 * A comparator which sorts participants by audio status.
 *
 * @param a the first participant.
 * @param b the second participant.
 */
export const audio: Comparator<StreamVideoParticipant> = (a, b) => {
  if (hasAudio(a) && !hasAudio(b)) return -1;
  if (!hasAudio(a) && hasAudio(b)) return 1;
  return 0;
};

/**
 * A comparator which prioritizes participants who are pinned.
 *
 * @param a the first participant.
 * @param b the second participant.
 */
export const pinned: Comparator<StreamVideoParticipant> = (a, b) => {
  if (a.isPinned && !b.isPinned) return -1;
  if (!a.isPinned && b.isPinned) return 1;
  return 0;
};

const hasScreenShare = (p: StreamVideoParticipant) =>
  p.publishedTracks.includes(TrackType.SCREEN_SHARE);

const hasVideo = (p: StreamVideoParticipant) =>
  p.publishedTracks.includes(TrackType.VIDEO);

const hasAudio = (p: StreamVideoParticipant) =>
  p.publishedTracks.includes(TrackType.AUDIO);
