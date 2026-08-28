import type { Call } from '../Call';
import { reconcileRingState } from './reconcileRingState';
import { CallingState } from '../store';
import { createSubscription } from '../store/rxUtils';
import { getTimers } from '../timers';
import {
  ErrorFromResponse,
  type RingStatePollingOptions,
} from '../coordinator/connection/types';
import { videoLoggerSystem } from '../logger';

/**
 * Polls the coordinator for the outcome of a ring the current user started.
 *
 * `call.accepted`, `call.rejected` and `call.missed` are delivered best-effort,
 * with no store-and-forward, so a caller that drops one is left on a ringing
 * screen while the callee is already in the call. After a quiet period this
 * reads the ring state until a terminal outcome or the end of the ring window.
 */
export class RingStatePoller {
  private readonly logger = videoLoggerSystem.getLogger('RingStatePoller');
  private readonly call: Call;
  private readonly startAfterMs: number;
  private readonly intervalMs: number;
  private sessionId: string | undefined;
  private deadlineAt: number = 0;
  private idleTimeoutId: number | undefined;
  private intervalId: number | undefined;
  private stopped: boolean = false;
  private inFlight: boolean = false;
  private unsubscribe: Array<() => void> = [];

  constructor(call: Call, options: RingStatePollingOptions = {}) {
    this.call = call;
    this.startAfterMs = options.startAfterMs ?? 15_000;
    this.intervalMs = options.intervalMs ?? 5_000;
  }

  /**
   * Starts polling. Does nothing when the call has no session yet.
   */
  start = () => {
    if (this.stopped || this.sessionId) return;
    if (this.call.state.callingState !== CallingState.RINGING) return;

    // captured once: `call.ended` clears the call's current session
    const sessionId = this.call.state.session?.id;
    if (!sessionId) {
      this.logger.warn('the call has no session');
      return;
    }
    this.sessionId = sessionId;

    const ring = this.call.state.settings?.ring;
    const maxDurationMs =
      ring?.auto_cancel_timeout_ms || ring?.missed_call_timeout_ms || 30_000;
    this.deadlineAt = Date.now() + maxDurationMs;

    // an incoming event proves the socket is alive, so the quiet period starts
    // over: in a group ring a single rejection does not settle the ring.
    this.unsubscribe.push(
      this.call.on('call.accepted', () => this.armIdleWindow()),
      this.call.on('call.rejected', () => this.armIdleWindow()),
      this.call.on('call.missed', () => this.armIdleWindow()),
      // the ring is over, whichever way it went. Joining an accepted call
      // never goes through `leave`, so this is the only signal for it.
      createSubscription(this.call.state.callingState$, (callingState) => {
        if (callingState !== CallingState.RINGING) this.stop();
      }),
    );

    this.armIdleWindow();
  };

  /**
   * Stops polling. The poller cannot be restarted.
   */
  stop = () => {
    if (this.stopped) return;
    this.stopped = true;
    const timers = getTimers();
    timers.clearTimeout(this.idleTimeoutId);
    timers.clearInterval(this.intervalId);
    this.idleTimeoutId = undefined;
    this.intervalId = undefined;
    this.unsubscribe.forEach((off) => off());
    this.unsubscribe = [];
  };

  private armIdleWindow = () => {
    if (this.stopped) return;
    const timers = getTimers();
    timers.clearTimeout(this.idleTimeoutId);
    timers.clearInterval(this.intervalId);
    this.intervalId = undefined;
    this.idleTimeoutId = timers.setTimeout(() => {
      this.idleTimeoutId = undefined;
      if (this.stopped) return;
      this.intervalId = timers.setInterval(this.runTick, this.intervalMs);
      this.runTick();
    }, this.startAfterMs);
  };

  private runTick = () => {
    this.tick().catch((err) => {
      this.logger.warn('Failed to poll the ring state', err);
    });
  };

  private tick = async () => {
    if (this.stopped || this.inFlight || !this.sessionId) return;
    if (
      this.call.state.callingState !== CallingState.RINGING ||
      Date.now() >= this.deadlineAt
    ) {
      this.stop();
      return;
    }

    this.inFlight = true;
    try {
      const ringState = await this.call.getRingState(this.sessionId);
      if (this.stopped) return;
      this.call.state.updateFromRingState(ringState);
      if (await reconcileRingState(this.call)) this.stop();
    } catch (err) {
      // a missing session, or one of another call, will never resolve
      const status = err instanceof ErrorFromResponse ? err.status : undefined;
      if (status === 400 || status === 404) {
        this.logger.warn('Stopped polling the ring state', err);
        this.stop();
      } else {
        this.logger.debug('Failed to poll the ring state', err);
      }
    } finally {
      this.inFlight = false;
    }
  };
}
