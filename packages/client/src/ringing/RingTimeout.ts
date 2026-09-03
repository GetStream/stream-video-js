import type { Call } from '../Call';
import { CallingState } from '../store';
import { getTimers } from '../timers';
import { videoLoggerSystem } from '../logger';

/**
 * Drops a call that has been ringing for too long: the caller cancels after
 * `auto_cancel_timeout_ms`, a callee after `incoming_call_timeout_ms`.
 *
 * Either timeout being `0` means the call rings until something else settles it.
 */
export class RingTimeout {
  private readonly call: Call;
  private timeoutId: number | undefined;
  private stopped: boolean = false;

  constructor(call: Call) {
    this.call = call;
  }

  /**
   * Schedules an auto-drop timeout based on the call settings.
   * Applicable only for ringing calls.
   */
  start = () => {
    if (this.stopped || this.timeoutId) return;
    // ignore if the call is not ringing
    if (this.call.state.callingState !== CallingState.RINGING) return;

    const ring = this.call.state.settings?.ring;
    if (!ring) return;

    const isCaller = this.call.isCreatedByMe;
    const timeoutMs = isCaller
      ? ring.auto_cancel_timeout_ms
      : ring.incoming_call_timeout_ms;
    // 0 means no auto-drop
    if (timeoutMs <= 0) return;

    const timers = getTimers();
    this.timeoutId = timers.setTimeout(() => {
      this.timeoutId = undefined;
      if (this.stopped) return;
      // the call might have stopped ringing by this point, e.g. it was already
      // accepted and joined
      if (this.call.state.callingState !== CallingState.RINGING) return;
      this.call
        .leave({
          reject: true,
          reason: 'timeout',
          message: `ringing timeout - ${
            isCaller
              ? 'no one accepted'
              : `user didn't interact with incoming call screen`
          }`,
        })
        .catch((err) => {
          videoLoggerSystem
            .getLogger('RingTimeout')
            .error('Failed to drop the call', err);
        });
    }, timeoutMs);
  };

  /**
   * Cancels a scheduled auto-drop timeout. It cannot be armed again.
   */
  stop = () => {
    if (this.stopped) return;
    this.stopped = true;
    getTimers().clearTimeout(this.timeoutId);
    this.timeoutId = undefined;
  };
}
