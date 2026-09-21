import { describe, expect, it } from 'vitest';
import { fromPartial } from '@total-typescript/shoehorn';
import { CallState } from '../CallState';
import type { CallResponse } from '../../gen/coordinator';
import { dateToNs } from '../../helpers/time';

/**
 * Guards the one failure mode the type system cannot see.
 *
 * Server-sent dates are unix-**nanosecond** numbers. `new Date(ns)` is out of
 * range, so it yields an `Invalid Date` rather than throwing - `getTime()` is
 * `NaN` and `toISOString()` throws a `RangeError` somewhere far away, usually
 * mid-render. Nothing about `new Date(someNumber)` is a type error, which is
 * exactly why this needs a test rather than a compiler.
 */
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
