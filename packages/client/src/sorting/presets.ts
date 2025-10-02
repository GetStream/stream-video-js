import { StreamVideoParticipant, VisibilityState } from '../types';
import { combineComparators, conditional } from './comparator';
import { ParticipantSource } from '../gen/video/sfu/models/models';
import {
  dominantSpeaker,
  pinned,
  publishingAudio,
  publishingVideo,
  reactionType,
  role,
  screenSharing,
  speaking,
  withParticipantSource,
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
 * A comparator that prioritizes participants with video ingress sources.
 */
const withVideoIngressSource = withParticipantSource(
  ParticipantSource.RTMP,
  ParticipantSource.SRT,
  ParticipantSource.WHIP,
  ParticipantSource.RTSP,
);

/**
 * The default sorting preset.
 */
export const defaultSortPreset = combineComparators(
  screenSharing,
  pinned,
  ifInvisibleBy(
    combineComparators(
      dominantSpeaker,
      speaking,
      reactionType('raised-hand'),
      publishingVideo,
      publishingAudio,
    ),
  ),
);

/**
 * The sorting preset for speaker layout.
 */
export const speakerLayoutSortPreset = combineComparators(
  screenSharing,
  pinned,
  dominantSpeaker,
  ifInvisibleBy(
    combineComparators(
      speaking,
      reactionType('raised-hand'),
      withVideoIngressSource,
      publishingVideo,
      publishingAudio,
    ),
  ),
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
      withVideoIngressSource,
      publishingVideo,
      publishingAudio,
    ),
  ),
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
      withVideoIngressSource,
      publishingVideo,
      publishingAudio,
    ),
  ),
  role('admin', 'host', 'speaker'),
);
