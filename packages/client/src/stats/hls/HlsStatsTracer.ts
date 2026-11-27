import { Tracer } from '../rtc/Tracer';
import type { TraceSlice } from '../rtc/types';
import type { HLSPlaybackStats } from '../../gen/shims';
import type { HlsPlaybackState } from '../../hls/types';

/** The totals the tracer counts. */
export type HlsPlaybackTotals = Pick<
  HLSPlaybackStats,
  | 'watch_duration_ms'
  | 'stall_count'
  | 'stall_duration_ms'
  | 'max_stall_duration_ms'
>;

/**
 * Counts what the HLS stats reports need from the player's states: the
 * totals (watch time, stalls) and the events since the last report. The HLS
 * counterpart of the WebRTC `StatsTracer`.
 *
 * A stall is waiting for data while playing: it ends when
 * playback resumes, or on a pause or a seek. Watch time counts playing only.
 * Durations use the monotonic clock, so a system clock change can't skew them.
 */
export class HlsStatsTracer {
  private readonly events = new Tracer(null, 100);

  private onFirstPlay: (() => void) | undefined;
  private state: HlsPlaybackState = 'loading';
  private stateSince = performance.now();
  private watchMs = 0;
  private stallCount = 0;
  private stallMs = 0;
  private maxStallMs = 0;
  private isStalled = false;
  private isStopped = false;

  /** Whether the stream has started playing. */
  hasPlayed = false;

  /**
   * Starts counting.
   *
   * @param onFirstPlay called once, when the stream starts playing.
   */
  start = (onFirstPlay?: () => void) => {
    this.onFirstPlay = onFirstPlay;
  };

  /** Applies a state change of the player. */
  onState = (state: HlsPlaybackState) => {
    if (this.isStopped || state === this.state) return;
    this.closeSpan();
    if (state === 'buffering' && this.state === 'playing') {
      this.isStalled = true;
      this.stallCount++;
      this.events.trace('stall_start', null);
    }
    if (state === 'ended') this.events.trace('stream_ended', null);
    this.state = state;
    if (state === 'playing' && !this.hasPlayed) {
      this.hasPlayed = true;
      this.onFirstPlay?.();
    }
  };

  /** Stops counting; later states are ignored. */
  stop = () => {
    if (this.isStopped) return;
    this.closeSpan();
    this.isStopped = true;
  };

  /** The totals so far. */
  sample = (): HlsPlaybackTotals => {
    const open = this.isStopped ? 0 : performance.now() - this.stateSince;
    const stalled = this.isStalled ? open : 0;
    // the monotonic clock has fractions of a millisecond; reports take integers
    return {
      watch_duration_ms: Math.round(
        this.watchMs + (this.state === 'playing' && !this.isStopped ? open : 0),
      ),
      stall_count: this.stallCount,
      stall_duration_ms: Math.round(this.stallMs + stalled),
      max_stall_duration_ms: Math.round(Math.max(this.maxStallMs, stalled)),
    };
  };

  /** Records an `error` event; also after `stop()`, for the final report. */
  traceError = (code: string) => {
    this.events.trace('error', { code });
  };

  /** The events since the last report; roll them back if it fails. */
  take = (): TraceSlice => this.events.take();

  /** Adds the time spent in the current state to its total; ends a stall. */
  private closeSpan = () => {
    const now = performance.now();
    const elapsed = now - this.stateSince;
    this.stateSince = now;
    if (this.state === 'playing') this.watchMs += elapsed;
    if (this.isStalled) {
      this.isStalled = false;
      this.stallMs += elapsed;
      this.maxStallMs = Math.max(this.maxStallMs, elapsed);
      this.events.trace('stall_end', { duration_ms: Math.round(elapsed) });
    }
  };
}
