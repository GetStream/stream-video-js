import { describe, expect, it } from 'vitest';
import { CallState } from '../CallState';
import {
  audio,
  combineComparators,
  descending,
  dominantSpeaker,
  name,
  noopComparator,
  screenSharing,
  video,
} from '../../sorting';

import ParticipantDataTest from '../../sorting/__tests__/participant-data';

describe('CallState', () => {
  it('should emit sorted participants', () => {
    const state = new CallState();
    state.setCurrentValue(state.participantsSubject, ParticipantDataTest);

    // initial sort criteria
    const ps = state.getCurrentValue(state.participants$);
    expect(ps.map((p) => p.name)).toEqual(['F', 'B', 'E', 'D', 'A', 'C']);

    // update sort criteria
    state.setSortParticipantsBy(
      combineComparators(dominantSpeaker, audio, video, screenSharing),
    );

    const ps2 = state.getCurrentValue(state.participants$);
    expect(ps2.map((p) => p.name)).toEqual(['D', 'B', 'A', 'F', 'E', 'C']);
  });

  it('should be able to disable sorting', () => {
    const state = new CallState();
    state.setCurrentValue(state.participantsSubject, ParticipantDataTest);

    // initial sort criteria
    const ps = state.getCurrentValue(state.participants$);
    expect(ps.map((p) => p.name)).toEqual(['F', 'B', 'E', 'D', 'A', 'C']);

    // disable sorting
    state.setSortParticipantsBy(noopComparator());

    const ps2 = state.getCurrentValue(state.participants$);
    expect(ps2.map((p) => p.name)).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
  });

  it('should support custom sorting', () => {
    const state = new CallState();
    state.setSortParticipantsBy(descending(name));

    state.setCurrentValue(state.participantsSubject, ParticipantDataTest);
    const ps = state.getCurrentValue(state.participants$);
    expect(ps.map((p) => p.name)).toEqual(['F', 'E', 'D', 'C', 'B', 'A']);
  });
});
