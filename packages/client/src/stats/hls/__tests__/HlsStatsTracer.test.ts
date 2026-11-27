import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HlsStatsTracer } from '../HlsStatsTracer';
import type { HlsPlaybackState } from '../../../hls/types';

/** A started tracer; the clock starts at 0. */
const setup = () => {
  const onFirstPlay = vi.fn();
  const tracer = new HlsStatsTracer();
  tracer.start(onFirstPlay);
  let now = 0;
  const advanceTo = (ms: number) => {
    vi.advanceTimersByTime(ms - now);
    now = ms;
  };
  const at = (ms: number, state: HlsPlaybackState) => {
    advanceTo(ms);
    tracer.onState(state);
  };
  const events = () =>
    tracer.take().snapshot.map(([type, , data]) => ({ type, data }));
  const sample = (ms: number) => {
    advanceTo(ms);
    return tracer.sample();
  };
  return { tracer, at, advanceTo, events, sample, onFirstPlay };
};

describe('HlsStatsTracer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts a stall until playback resumes', () => {
    const { at, events, sample } = setup();
    at(0, 'playing');
    at(10_000, 'buffering');
    at(12_000, 'playing');

    expect(sample(20_000)).toMatchObject({
      watch_duration_ms: 18_000,
      stall_count: 1,
      stall_duration_ms: 2_000,
      max_stall_duration_ms: 2_000,
    });
    expect(events()).toEqual([
      { type: 'stall_start', data: null },
      { type: 'stall_end', data: { duration_ms: 2_000 } },
    ]);
  });

  it('ends a stall on a seek', () => {
    const { at, events, sample } = setup();
    at(0, 'playing');
    at(1_000, 'buffering');
    at(25_000, 'seeking'); // e.g. hls.js jumps to the live edge
    at(25_100, 'buffering');
    at(27_000, 'playing');

    expect(sample(30_000)).toMatchObject({
      watch_duration_ms: 4_000,
      stall_count: 1,
      stall_duration_ms: 24_000,
    });
    expect(events()).toEqual([
      { type: 'stall_start', data: null },
      { type: 'stall_end', data: { duration_ms: 24_000 } },
    ]);
  });

  it('ends a stall on a pause', () => {
    const { at, sample } = setup();
    at(0, 'playing');
    at(10_000, 'buffering');
    at(13_000, 'paused');

    expect(sample(20_000)).toMatchObject({
      watch_duration_ms: 10_000,
      stall_count: 1,
      stall_duration_ms: 3_000,
    });
  });

  it('does not count loading or a seek as a stall', () => {
    const { at, events, sample } = setup();
    at(5_000, 'playing');
    at(10_000, 'seeking');
    at(10_100, 'buffering');
    at(11_000, 'playing');

    expect(sample(20_000)).toMatchObject({
      watch_duration_ms: 14_000,
      stall_count: 0,
    });
    expect(events()).toEqual([]);
  });

  it('reports the first play once, and the end of the stream', () => {
    const { at, events, onFirstPlay, tracer } = setup();
    at(0, 'playing');
    at(1_000, 'paused');
    at(2_000, 'playing');
    at(3_000, 'ended');

    expect(onFirstPlay).toHaveBeenCalledTimes(1);
    expect(tracer.hasPlayed).toBe(true);
    expect(events()).toEqual([{ type: 'stream_ended', data: null }]);
  });

  it('ignores a system clock change', () => {
    const { at, sample } = setup();
    at(0, 'playing');
    vi.setSystemTime(Date.now() - 3_600_000); // the clock goes back an hour

    expect(sample(10_000)).toMatchObject({ watch_duration_ms: 10_000 });
  });

  it('reports whole milliseconds', () => {
    const now = vi.spyOn(performance, 'now').mockReturnValue(0.2);
    const tracer = new HlsStatsTracer();
    tracer.onState('playing');
    now.mockReturnValue(100.4);
    tracer.onState('buffering');
    now.mockReturnValue(300.7);

    expect(tracer.sample()).toEqual({
      watch_duration_ms: 100,
      stall_count: 1,
      stall_duration_ms: 200,
      max_stall_duration_ms: 200,
    });
  });

  it('ignores states once stopped', () => {
    const { at, advanceTo, sample, tracer } = setup();
    at(0, 'playing');
    advanceTo(5_000);
    tracer.stop();
    at(6_000, 'buffering');

    expect(sample(30_000)).toMatchObject({
      watch_duration_ms: 5_000,
      stall_count: 0,
    });
  });
});
