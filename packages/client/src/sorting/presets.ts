import { StreamVideoParticipant, VisibilityState } from '../types';
import { combineComparators, conditional } from './comparator';
import {
  dominantSpeaker,
  pinned,
  publishingAudio,
  publishingVideo,
  reactionType,
  role,
  screenSharing,
  speaking,
} from './participants';

// a comparator decorator which applies the decorated comparator only if the
// participant is invisible.
// This ensures stable sorting when all participants are visible.
const ifInvisibleBy = conditional(
  (a: StreamVideoParticipant, b: StreamVideoParticipant) =>
    a.viewportVisibilityState?.videoTrack === VisibilityState.INVISIBLE ||
    b.viewportVisibilityState?.videoTrack === VisibilityState.INVISIBLE,
);

/**
 * The default sorting preset.
 */
export const defaultSortPreset = combineComparators(
  pinned,
  screenSharing,
  ifInvisibleBy(dominantSpeaker),
  ifInvisibleBy(speaking),
  ifInvisibleBy(reactionType('raised-hand')),
  ifInvisibleBy(publishingVideo),
  ifInvisibleBy(publishingAudio),
  // ifInvisibleBy(name),
);

/**
 * The sorting preset for speaker layout.
 */
export const speakerLayoutSortPreset = combineComparators(
  pinned,
  screenSharing,
  dominantSpeaker,
  ifInvisibleBy(speaking),
  ifInvisibleBy(reactionType('raised-hand')),
  ifInvisibleBy(publishingVideo),
  ifInvisibleBy(publishingAudio),
  // ifInvisibleBy(name),
);

/**
 * The sorting preset for livestreams and audio rooms.
 */
export const livestreamOrAudioRoomSortPreset = combineComparators(
  ifInvisibleBy(dominantSpeaker),
  ifInvisibleBy(speaking),
  ifInvisibleBy(reactionType('raised-hand')),
  ifInvisibleBy(publishingVideo),
  ifInvisibleBy(publishingAudio),
  role('admin', 'host', 'speaker'),
  // name,
);
