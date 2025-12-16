import { Comparator } from './';
import { StreamVideoParticipant } from '../types';
import { ParticipantSource } from '../gen/video/sfu/models/models';
import {
  hasAudio,
  hasScreenShare,
  hasVideo,
} from '../helpers/participantUtils';

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
  const hasA = hasScreenShare(a);
  const hasB = hasScreenShare(b);
  if (hasA && !hasB) return -1;
  if (!hasA && hasB) return 1;
  return 0;
};

/**
 * A comparator which sorts participants by video status.
 *
 * @param a the first participant.
 * @param b the second participant.
 */
export const publishingVideo: Comparator<StreamVideoParticipant> = (a, b) => {
  const hasA = hasVideo(a);
  const hasB = hasVideo(b);
  if (hasA && !hasB) return -1;
  if (!hasA && hasB) return 1;
  return 0;
};

/**
 * A comparator which sorts participants by audio status.
 *
 * @param a the first participant.
 * @param b the second participant.
 */
export const publishingAudio: Comparator<StreamVideoParticipant> = (a, b) => {
  const hasA = hasAudio(a);
  const hasB = hasAudio(b);
  if (hasA && !hasB) return -1;
  if (!hasA && hasB) return 1;
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
 * participants who are from a specific source (e.g., WebRTC, RTMP, WHIP...).
 *
 * The priority of a source is determined by the order of the sources passed in.
 * e.g. [SRT, RTMP, WHIP] will prioritize SRT sources first, then RTMP, then WHIP.
 *
 * @param sources the sources to prioritize.
 */
export const withParticipantSource = (
  ...sources: ParticipantSource[]
): Comparator<StreamVideoParticipant> => {
  const priority = (i: number) => (i === -1 ? Number.MAX_SAFE_INTEGER : i);
  return (a, b) => {
    const priorityA = priority(sources.indexOf(a.source));
    const priorityB = priority(sources.indexOf(b.source));
    if (priorityA < priorityB) return -1;
    if (priorityA > priorityB) return 1;
    return 0;
  };
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
    const hasA = hasAnyRole(a, roles);
    const hasB = hasAnyRole(b, roles);
    if (hasA && !hasB) return -1;
    if (!hasA && hasB) return 1;
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
