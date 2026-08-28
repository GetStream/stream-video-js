import { describe, expect, it } from 'vitest';
import { fromPartial } from '@total-typescript/shoehorn';
import {
  type OwnRingOutcomeInput,
  resolveOwnRingOutcome,
} from '../resolveOwnRingOutcome';
import { CallingState } from '../../store';
import { CallSessionResponse } from '../../gen/coordinator';

const ME = 'm1';
const timestamp = () => new Date().toISOString();

describe('resolveOwnRingOutcome', () => {
  const resolve = (overrides: Partial<OwnRingOutcomeInput> = {}) =>
    resolveOwnRingOutcome({
      currentUserId: ME,
      callingState: CallingState.RINGING,
      ...overrides,
      session: fromPartial<CallSessionResponse>({
        accepted_by: {},
        rejected_by: {},
        missed_by: {},
        ...overrides.session,
      }),
    });

  it('reports nothing while nobody has acted', () => {
    expect(resolve()).toEqual({ settledByMe: false });
  });

  it('reports nothing for another user accepting or rejecting', () => {
    const outcome = resolve({
      session: fromPartial({
        accepted_by: { m2: timestamp() },
        rejected_by: { m3: timestamp() },
      }),
    });

    expect(outcome).toEqual({ settledByMe: false });
  });

  it('leaves when the ring was answered on another device', () => {
    const outcome = resolve({
      session: fromPartial({ accepted_by: { [ME]: timestamp() } }),
    });

    expect(outcome).toEqual({
      settledByMe: true,
      leaveReason: 'answeredElsewhere',
    });
  });

  it('does not leave when this device is the one that accepted', () => {
    const outcome = resolve({
      callingState: CallingState.JOINING,
      session: fromPartial({ accepted_by: { [ME]: timestamp() } }),
    });

    // the drop no longer has to fire, but this device is joining, not leaving
    expect(outcome).toEqual({ settledByMe: true, leaveReason: undefined });
  });

  it('leaves when the current user rejected', () => {
    const outcome = resolve({
      session: fromPartial({ rejected_by: { [ME]: timestamp() } }),
    });

    expect(outcome).toEqual({ settledByMe: true, leaveReason: 'rejected' });
  });

  it('prefers the answered-elsewhere reason over a rejection', () => {
    const outcome = resolve({
      session: fromPartial({
        accepted_by: { [ME]: timestamp() },
        rejected_by: { [ME]: timestamp() },
      }),
    });

    expect(outcome).toEqual({
      settledByMe: true,
      leaveReason: 'answeredElsewhere',
    });
  });

  it('reports nothing without a connected user', () => {
    const outcome = resolve({
      currentUserId: undefined,
      session: fromPartial({ rejected_by: { [ME]: timestamp() } }),
    });

    expect(outcome).toEqual({ settledByMe: false });
  });

  it('reports nothing without a session', () => {
    expect(
      resolveOwnRingOutcome({
        session: undefined,
        currentUserId: ME,
        callingState: CallingState.RINGING,
      }),
    ).toEqual({ settledByMe: false });
  });
});
