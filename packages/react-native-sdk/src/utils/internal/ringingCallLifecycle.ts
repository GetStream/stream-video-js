import { videoLoggerSystem, type Call } from '@stream-io/video-client';
import type { RingingCallLifecycleHooks } from '../StreamVideoRN/types';
import { endCallingxCall } from './callingx/callingx';

const logger = videoLoggerSystem.getLogger('ringingCallLifecycle');

/**
 * How long `onBeforeCallJoin` may take before the join gives up on it.
 *
 * The hook runs inside the CallKit accept, which iOS gives a hard deadline of
 * roughly 30s before killing the app. Failing well short of that leaves room to
 * report the failure and end the native call cleanly, and a hook that legitimately
 * needs longer than this does not belong on the accept path at all.
 */
const ON_BEFORE_CALL_JOIN_TIMEOUT_MS = 5_000;

/**
 * Thrown when a ringing call is asked to join again while its previous attempt
 * is still settling. Callers may retry once that attempt finishes.
 */
export class RingingJoinBusyError extends Error {
  constructor(cid: string) {
    super(
      `A previous ringing join for ${cid} is still settling; retry once it finishes.`,
    );
    this.name = 'RingingJoinBusyError';
  }
}

/**
 * The registered hooks.
 *
 * Held here rather than on `StreamVideoRN.config` so the push internals and the
 * globals bridge can both reach them without importing the `StreamVideoRN`
 * class, which would close an import cycle through the push setup modules.
 */
let hooks: RingingCallLifecycleHooks | undefined;

export const setRingingCallLifecycleHooks = (
  next: RingingCallLifecycleHooks,
) => {
  hooks = next;
};

export const getRingingCallLifecycleHooks = () => hooks;

/**
 * The one join a ringing call may have in progress.
 *
 * Only one exists per call at a time, which is what keeps the rest of this file
 * small: with no overlapping attempt there is never a second owner competing for
 * the same manager or the same native cid, so cleanup needs no ownership test.
 *
 * `hookSettled` is tracked apart from `operation` because the timeout can end
 * the caller's wait while the app's hook is still running. The hook cannot be
 * cancelled, so this entry outlives the join until it settles - and until then
 * a retry is refused rather than being allowed to race it.
 */
type RingingJoin = {
  operation: Promise<void>;
  hookSettled: boolean;
  operationDone: boolean;
  /** No further join may start until this one settles and is cleaned up. */
  closed: boolean;
  /** Setup ran, so a release is owed once the lifecycle ends. */
  setupRan: boolean;
  releaseOwed: boolean;
};

const joins = new WeakMap<Call, RingingJoin>();

/** Invokes the release hook, swallowing whatever it throws. */
const fireRelease = (call: Call): void => {
  const hook = hooks?.onAfterCallLeave;
  if (!hook) return;
  try {
    Promise.resolve(hook(call)).catch((e) => {
      logger.warn(`onAfterCallLeave failed for callCid: ${call.cid}`, e);
    });
  } catch (e) {
    logger.warn(`onAfterCallLeave threw for callCid: ${call.cid}`, e);
  }
};

/**
 * Runs the app's hook, bounded by the deadline.
 *
 * Resolves the *hook's* own promise separately from the bounded wait, so a late
 * completion still has an owner: whatever it installs is released by
 * {@link settle} rather than stranded.
 */
const runHook = (call: Call, entry: RingingJoin): Promise<void> => {
  const hook = hooks?.onBeforeCallJoin;
  if (!hook) {
    entry.hookSettled = true;
    return Promise.resolve();
  }
  // Invoked synchronously - a caller expects its hook to start now - but a
  // synchronous throw becomes a rejection so it cannot escape the bookkeeping.
  let started: Promise<void>;
  try {
    started = Promise.resolve(hook(call));
  } catch (e) {
    started = Promise.reject(e);
  }

  const settled = started
    .catch(() => {})
    .then(() => {
      entry.hookSettled = true;
      settle(call, entry);
    });

  let timeout: ReturnType<typeof setTimeout> | undefined;
  const expiry = new Promise<never>((_, reject) => {
    timeout = setTimeout(
      () =>
        reject(
          new Error(
            `onBeforeCallJoin did not settle within ${ON_BEFORE_CALL_JOIN_TIMEOUT_MS}ms`,
          ),
        ),
      ON_BEFORE_CALL_JOIN_TIMEOUT_MS,
    );
  });

  return Promise.race([started, expiry]).finally(() => {
    clearTimeout(timeout);
    void settled;
  });
};

/**
 * Retires the join once both the operation and the app's hook have finished,
 * releasing anything the hook installed if the join did not succeed.
 *
 * Both conditions matter: retiring early would let a retry start while the old
 * hook is still working, which is the overlap this design exists to avoid.
 */
const settle = (call: Call, entry: RingingJoin): void => {
  if (!entry.hookSettled || !entry.operationDone) return;
  // A join that succeeded keeps its record: it owns the live call's setup until
  // something actually ends the call, and a duplicate trigger must find it here
  // rather than starting a second setup that would dispose the live manager.
  if (!entry.releaseOwed) return;
  if (joins.get(call) === entry) joins.delete(call);
  entry.releaseOwed = false;
  if (entry.setupRan) fireRelease(call);
};

/**
 * Runs one ringing join: the app's setup hook, then the join itself.
 *
 * A second trigger for the same live attempt joins it rather than starting
 * another, so a double tap or a push racing an in-app accept cannot produce two
 * setups or two native registrations. A trigger arriving after cancellation is
 * refused with {@link RingingJoinBusyError} until the previous attempt settles;
 * it does not queue, and it does not run alongside.
 */
export const runJoin = async (
  call: Call,
  proceed: () => Promise<void>,
): Promise<void> => {
  const existing = joins.get(call);
  if (existing) {
    // Closed means the previous attempt is cancelled, or failed with its hook
    // still running. Either way it may still be holding the manager or the
    // native registration, so a retry is refused rather than run alongside.
    if (existing.closed) throw new RingingJoinBusyError(call.cid);
    // Otherwise this is a duplicate trigger for a live or already-successful
    // join: hand back the same operation. Never a second hook, and never a
    // release that would dispose the manager the call is still using.
    return existing.operation;
  }

  const entry: RingingJoin = {
    operation: undefined as unknown as Promise<void>,
    hookSettled: false,
    operationDone: false,
    closed: false,
    setupRan: false,
    releaseOwed: false,
  };
  joins.set(call, entry);

  entry.operation = (async () => {
    try {
      if (hooks?.onBeforeCallJoin) entry.setupRan = true;
      await runHook(call, entry);
      await proceed();
    } catch (error) {
      // Fail closed. The native side may already be showing this call as
      // answered - the push path reports the accept before the join - so end it
      // rather than leaving it on screen with nothing behind it.
      await endCallingxCall(call, 'error').catch(() => {});
      if (entry.hookSettled) {
        // Nothing else can still be installed: release now and let a retry start.
        entry.releaseOwed = true;
      } else {
        // The hook is still running and may yet install something. Hold the
        // lifecycle closed until it settles, then release.
        entry.closed = true;
        entry.releaseOwed = true;
      }
      throw error;
    } finally {
      entry.operationDone = true;
      settle(call, entry);
    }
  })();

  return entry.operation;
};

/**
 * The call has ended.
 *
 * Marks any attempt still in flight as cancelled, so a retry is refused until it
 * finishes rather than racing it, and releases what the hook installed once it
 * has settled.
 */
export const onLeave = (call: Call): void => {
  const entry = joins.get(call);
  if (!entry) {
    // No join ever ran for this call - a ringing call declined without being
    // accepted, say. With a setup hook configured there is nothing paired to
    // release; a release-only registration is still called, as documented.
    if (!hooks?.onBeforeCallJoin) fireRelease(call);
    return;
  }
  entry.closed = true;
  entry.releaseOwed = true;
  settle(call, entry);
};
