import { describe, expect, it } from 'vitest';
import { CallState } from '../CallState';
import {
  audio,
  combineComparators,
  conditional,
  descending,
  dominantSpeaker,
  name,
  noopComparator,
  screenSharing,
  video,
} from '../../sorting';

import * as TestData from '../../sorting/__tests__/participant-data';
import { StreamVideoParticipant, VisibilityState } from '../../rtc/types';

const ParticipantDataTest = TestData.participants as StreamVideoParticipant[];

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

  it('should consider participant visibility', () => {
    const [A, B, C, D] = ParticipantDataTest;

    const state = new CallState();
    state.setSortParticipantsBy(name);
    state.setCurrentValue(state.participantsSubject, [A, B, C, D]);
    expect(state.getCurrentValue(state.participants$)).toEqual([A, B, C, D]);

    const Z = {
      ...A,
      name: 'Z',
    };

    // normal mode: Z is pushed to the end
    state.setCurrentValue(state.participantsSubject, [Z, B, C, D]);
    expect(state.getCurrentValue(state.participants$)).toEqual([B, C, D, Z]);

    const ifInvisibleBy = conditional(
      (a: StreamVideoParticipant, b: StreamVideoParticipant) =>
        a.viewportVisibilityState === VisibilityState.INVISIBLE ||
        b.viewportVisibilityState === VisibilityState.INVISIBLE,
    );
    state.setSortParticipantsBy(ifInvisibleBy(name));

    // Z is visible, so it is kept in the same position
    state.setCurrentValue(state.participantsSubject, [Z, B, C, D]);
    expect(state.getCurrentValue(state.participants$)).toEqual([Z, B, C, D]);

    // Z is invisible, so, the normal sorting is applied and Z is pushed to the end
    Z.viewportVisibilityState = VisibilityState.INVISIBLE;
    state.setCurrentValue(state.participantsSubject, [Z, B, C, D]);
    expect(state.getCurrentValue(state.participants$)).toEqual([B, C, D, Z]);
  });
});
