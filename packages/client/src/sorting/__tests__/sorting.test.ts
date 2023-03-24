import { describe, expect, it } from 'vitest';
import {
  audio,
  combineComparators,
  dominantSpeaker,
  pinned,
  screenSharing,
  video,
} from '../index';
import ParticipantDataTest from './participant-data';

describe('Sorting', () => {
  it('presenter, dominant speaker, video, audio, mute', () => {
    const comparator = combineComparators(
      screenSharing,
      dominantSpeaker,
      video,
      audio,
    );
    const sorted = [...ParticipantDataTest].sort(comparator);
    expect(sorted.map((p) => p.name)).toEqual(['B', 'E', 'D', 'A', 'F', 'C']);
  });

  it('pinned, dominant speaker, audio, video, mute, screenshare', () => {
    const comparator = combineComparators(
      pinned,
      dominantSpeaker,
      audio,
      video,
      screenSharing,
    );
    const sorted = [...ParticipantDataTest].sort(comparator);
    expect(sorted.map((p) => p.name)).toEqual(['F', 'D', 'B', 'A', 'E', 'C']);
  });
});
