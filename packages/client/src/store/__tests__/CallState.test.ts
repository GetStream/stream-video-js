import { describe, expect, it } from 'vitest';
import { StreamVideoParticipant, VisibilityState } from '../../types';
import { CallState } from '../CallState';
import {
  combineComparators,
  conditional,
  descending,
  dominantSpeaker,
  name,
  noopComparator,
  publishingAudio,
  publishingVideo,
  screenSharing,
} from '../../sorting';

import * as TestData from '../../sorting/__tests__/participant-data';

describe('CallState', () => {
  it('should emit sorted participants', () => {
    const state = new CallState(noopComparator());
    state.setParticipants(TestData.participants());

    // initial sort criteria
    const ps = state.participants;
    expect(ps.map((p) => p.name)).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);

    // update sort criteria
    state.setSortParticipantsBy(
      combineComparators(
        dominantSpeaker,
        publishingAudio,
        publishingVideo,
        screenSharing,
      ),
    );

    const ps2 = state.participants;
    expect(ps2.map((p) => p.name)).toEqual(['D', 'B', 'A', 'F', 'E', 'C']);
  });

  it('should be able to disable sorting', () => {
    const participants = TestData.participants();
    const state = new CallState();
    state.setParticipants(TestData.participants());
    // initial sort criteria
    const ps = state.participants;
    expect(ps.map((p) => p.name)).toEqual(['F', 'B', 'E', 'A', 'C', 'D']);

    // disable sorting
    state.setSortParticipantsBy(noopComparator());

    // update the dominant speaker -> in this case, no sorting should be applied
    const [A] = participants;
    state.updateParticipant(A.sessionId, {
      isDominantSpeaker: true,
    });

    const ps2 = state.participants;
    expect(ps2.map((p) => p.name)).toEqual(['F', 'B', 'E', 'A', 'C', 'D']);
  });

  it('should support custom sorting', () => {
    const state = new CallState();
    state.setSortParticipantsBy(descending(name));

    state.setParticipants(TestData.participants());
    const ps = state.participants;
    expect(ps.map((p) => p.name)).toEqual(['F', 'E', 'D', 'C', 'B', 'A']);
  });

  it('should consider participant visibility', () => {
    const [A, B, C, D] = TestData.participants();

    const state = new CallState();
    state.setSortParticipantsBy(name);
    state.setParticipants([A, B, C, D]);
    expect(state.participants).toEqual([A, B, C, D]);

    const Z = {
      ...A,
      name: 'Z',
    };

    // normal mode: Z is pushed to the end
    state.setParticipants([Z, B, C, D]);
    expect(state.participants).toEqual([B, C, D, Z]);

    const ifInvisibleBy = conditional(
      (a: StreamVideoParticipant, b: StreamVideoParticipant) =>
        a.viewportVisibilityState === VisibilityState.INVISIBLE ||
        b.viewportVisibilityState === VisibilityState.INVISIBLE,
    );
    state.setSortParticipantsBy(ifInvisibleBy(name));

    // Z is visible, so it is kept in the same position
    state.setParticipants([Z, B, C, D]);
    expect(state.participants).toEqual([Z, B, C, D]);

    // Z is invisible, so, the normal sorting is applied and Z is pushed to the end
    Z.viewportVisibilityState = VisibilityState.INVISIBLE;
    state.setParticipants([Z, B, C, D]);
    expect(state.participants).toEqual([B, C, D, Z]);
  });
});
