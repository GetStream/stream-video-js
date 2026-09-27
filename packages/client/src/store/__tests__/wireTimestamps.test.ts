import { describe, expect, it } from 'vitest';
import { fromPartial } from '@total-typescript/shoehorn';
import { CallState } from '../CallState';
import type { CallResponse } from '../../gen/coordinator';
import { dateToNs } from '../../helpers/time';

describe('wire timestamps reaching CallState', () => {
  const at = (iso: string) => dateToNs(new Date(iso));

  const callResponse = (overrides: Partial<CallResponse> = {}) =>
    fromPartial<CallResponse>({
      created_at: at('2026-01-02T03:04:05Z'),
      updated_at: at('2026-01-02T03:04:06Z'),
      egress: { rtmps: [] },
      custom: {},
      ...overrides,
    });

  it('converts created_at and updated_at into valid Dates', () => {
    const state = new CallState();
    state.updateFromCallResponse(callResponse());

    expect(state.createdAt).toBeInstanceOf(Date);
    expect(state.createdAt.getTime()).not.toBeNaN();
    expect(state.createdAt.toISOString()).toBe('2026-01-02T03:04:05.000Z');
    expect(state.updatedAt.toISOString()).toBe('2026-01-02T03:04:06.000Z');
  });

  it('converts the optional starts_at and ended_at', () => {
    const state = new CallState();
    state.updateFromCallResponse(
      callResponse({
        starts_at: at('2026-01-02T04:00:00Z'),
        ended_at: at('2026-01-02T05:00:00Z'),
      }),
    );

    expect(state.startsAt?.toISOString()).toBe('2026-01-02T04:00:00.000Z');
    expect(state.endedAt?.toISOString()).toBe('2026-01-02T05:00:00.000Z');
  });

  it('leaves the optional dates undefined when absent', () => {
    const state = new CallState();
    state.updateFromCallResponse(callResponse());

    expect(state.startsAt).toBeUndefined();
    expect(state.endedAt).toBeUndefined();
  });
});
