import { Comparator } from './';
import { TrackType } from '../gen/video/sfu/models/models';
import { StreamVideoParticipant } from '../types';

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
 * A comparator which sorts participants by the fact that they are speaking or not.
 *
 * @param a the first participant.
 * @param b the second participant.
 */
export const speaking: Comparator<StreamVideoParticipant> = (a, b) => {
  if (a.isSpeaking && !b.isSpeaking) return -1;
  if (!a.isSpeaking && b.isSpeaking) return 1;
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
export const publishingVideo: Comparator<StreamVideoParticipant> = (a, b) => {
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
export const publishingAudio: Comparator<StreamVideoParticipant> = (a, b) => {
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
  if (a.pin && b.pin) {
    if (!a.pin.isLocalPin && b.pin.isLocalPin) return -1;
    if (a.pin.isLocalPin && !b.pin.isLocalPin) return 1;
    if (a.pin.pinnedAt > b.pin.pinnedAt) return -1;
    if (a.pin.pinnedAt < b.pin.pinnedAt) return 1;
  }

  if (a.pin && !b.pin) return -1;
  if (!a.pin && b.pin) return 1;

  return 0;
};

/**
 * A comparator creator which will set up a comparator which prioritizes
 * participants who have a specific reaction.
 *
 * @param type the reaction type.
 */
export const reactionType = (
  type: string,
): Comparator<StreamVideoParticipant> => {
  return (a, b) => {
    if (a.reaction?.type === type && b.reaction?.type !== type) return -1;
    if (a.reaction?.type !== type && b.reaction?.type === type) return 1;
    return 0;
  };
};

/**
 * A comparator creator which will set up a comparator which prioritizes
 * participants who have a specific role.
 *
 * @param roles the roles to prioritize.
 */
export const role =
  (...roles: string[]): Comparator<StreamVideoParticipant> =>
  (a, b) => {
    if (hasAnyRole(a, roles) && !hasAnyRole(b, roles)) return -1;
    if (!hasAnyRole(a, roles) && hasAnyRole(b, roles)) return 1;
    return 0;
  };

/**
 * A comparator which sorts participants by name.
 *
 * @param a the first participant.
 * @param b the second participant.
 */
export const name: Comparator<StreamVideoParticipant> = (a, b) => {
  if (a.name < b.name) return -1;
  if (a.name > b.name) return 1;
  return 0;
};

const hasAnyRole = (p: StreamVideoParticipant, roles: string[]) =>
  (p.roles || []).some((r) => roles.includes(r));

const hasScreenShare = (p: StreamVideoParticipant) =>
  p.publishedTracks.includes(TrackType.SCREEN_SHARE);

const hasVideo = (p: StreamVideoParticipant) =>
  p.publishedTracks.includes(TrackType.VIDEO);

const hasAudio = (p: StreamVideoParticipant) =>
  p.publishedTracks.includes(TrackType.AUDIO);
