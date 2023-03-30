import { combineComparators } from './comparator';
import {
  audio,
  dominantSpeaker,
  name,
  pinned,
  reactionType,
  role,
  screenSharing,
  talking,
  video,
} from './participants';

/**
 * The default sorting preset.
 */
export const defaultSortPreset = combineComparators(
  pinned,
  screenSharing,
  dominantSpeaker,
  talking,
  reactionType('raised-hand'),
  video,
  audio,
  name,
);

/**
 * The sorting preset for livestreams and audio rooms.
 */
export const livestreamOrAudioRoomSortPreset = combineComparators(
  dominantSpeaker,
  talking,
  reactionType('raised-hand'),
  video,
  audio,
  role('admin', 'host', 'speaker'),
  name,
);
