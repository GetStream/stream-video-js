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
 * A comparator that applies the decorated comparator when a participant is
 * either invisible or its visibility state isn't known.
 * For visible participants, it ensures stable sorting.
 */
const ifInvisibleOrUnknownBy = conditional(
  (a: StreamVideoParticipant, b: StreamVideoParticipant) =>
    a.viewportVisibilityState?.videoTrack === VisibilityState.INVISIBLE ||
    a.viewportVisibilityState?.videoTrack === VisibilityState.UNKNOWN ||
    b.viewportVisibilityState?.videoTrack === VisibilityState.INVISIBLE ||
    b.viewportVisibilityState?.videoTrack === VisibilityState.UNKNOWN,
);

/**
 * The default sorting preset.
 */
export const defaultSortPreset = combineComparators(
  pinned,
  screenSharing,
  ifInvisibleBy(
    combineComparators(
      dominantSpeaker,
      speaking,
      reactionType('raised-hand'),
      publishingVideo,
      publishingAudio,
    ),
  ),
  // ifInvisibleBy(name),
);

/**
 * The sorting preset for speaker layout.
 */
export const speakerLayoutSortPreset = combineComparators(
  pinned,
  screenSharing,
  dominantSpeaker,
  ifInvisibleBy(
    combineComparators(
      speaking,
      reactionType('raised-hand'),
      publishingVideo,
      publishingAudio,
    ),
  ),
  // ifInvisibleBy(name),
);

/**
 * The sorting preset for layouts that don't render all participants but
 * instead, render them in pages.
 */
export const paginatedLayoutSortPreset = combineComparators(
  pinned,
  ifInvisibleOrUnknownBy(
    combineComparators(
      dominantSpeaker,
      speaking,
      reactionType('raised-hand'),
      publishingVideo,
      publishingAudio,
    ),
  ),
  // ifInvisibleOrUnknownBy(name),
);

/**
 * The sorting preset for livestreams and audio rooms.
 */
export const livestreamOrAudioRoomSortPreset = combineComparators(
  ifInvisibleBy(
    combineComparators(
      dominantSpeaker,
      speaking,
      reactionType('raised-hand'),
      publishingVideo,
      publishingAudio,
    ),
  ),
  role('admin', 'host', 'speaker'),
  // name,
);
