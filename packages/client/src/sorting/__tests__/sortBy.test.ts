import { describe, expect, it } from 'vitest';
import { ParticipantComparators, sortBy } from '../index';
import ParticipantDataTest from './participant-data';

describe('Sorting', () => {
  it('presenter, dominant speaker, video, audio, mute', () => {
    const { audio, video, screenSharing, dominantSpeaker } =
      ParticipantComparators;
    const sorted = sortBy(
      screenSharing,
      dominantSpeaker,
      video,
      audio,
    )(ParticipantDataTest);
    expect(sorted.map((p) => p.name)).toEqual(['B', 'E', 'D', 'A', 'F', 'C']);
  });

  it('pinned, dominant speaker, audio, video, mute, screenshare', () => {
    const { audio, video, screenSharing, dominantSpeaker, pinned } =
      ParticipantComparators;
    const sorted = sortBy(
      pinned,
      dominantSpeaker,
      audio,
      video,
      screenSharing,
    )(ParticipantDataTest);
    expect(sorted.map((p) => p.name)).toEqual(['F', 'D', 'B', 'A', 'E', 'C']);
  });
});
