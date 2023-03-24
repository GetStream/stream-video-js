import { combineComparators } from './index';
import {
  audio,
  dominantSpeaker,
  name,
  pinned,
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
  video,
  audio,
  role('admin', 'host', 'speaker'),
  name,
);
