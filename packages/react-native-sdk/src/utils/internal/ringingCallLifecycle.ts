import {
  CallingState,
  videoLoggerSystem,
  type Call,
} from '@stream-io/video-client';
import type { RingingCallLifecycleHooks } from '../StreamVideoRN/types';

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

/**
 * How to release what a call's setup hook installed.
 *
 * Kept per call rather than in a single current-call slot: an abandoned call's
 * hook can still finish after the next call has joined, and it has to release
 * its own manager rather than whatever is current. An entry exists only for a
 * call whose setup hook actually ran.
 */
const cleanups = new WeakMap<Call, () => void>();

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

/** Releases what the setup hook installed, at most once. */
const requestRelease = (call: Call): void => {
  const cleanup = cleanups.get(call);
  if (!cleanup) return;
  // Dropped before it runs: that is what makes a failed join followed by a
  // leave release exactly once.
  cleanups.delete(call);
  cleanup();
};

/**
 * Runs the app's pre-join setup, bounded by the deadline.
 *
 * Rejecting fails the join closed - joining without whatever this installs would
 * publish unencrypted media on a call the user believes is private.
 */
export const beforeJoin = (call: Call): Promise<void> => {
  const hook = hooks?.onBeforeCallJoin;
  if (!hook) return Promise.resolve();

  // Invoked synchronously - a caller expects its hook to start now - but a
  // synchronous throw becomes a rejection so it cannot escape the bookkeeping.
  let started: Promise<void>;
  try {
    started = Promise.resolve(hook(call));
  } catch (error) {
    started = Promise.reject(error);
  }

  // Cleanup tracks the hook's own promise, never the bounded wait below. The
  // deadline ends this join's wait but cannot cancel the app's work, so a
  // manager the hook creates late still has an owner waiting to release it.
  const settled = started.catch(() => {});
  cleanups.set(call, () => void settled.then(() => fireRelease(call)));

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

  return Promise.race([started, expiry]).finally(() => clearTimeout(timeout));
};

/**
 * The join failed and will not be retried on this call.
 *
 * Ends the ringing flow rather than leaving the call sitting in `RINGING`: one
 * `Call` is one call flow, so the accept button must not be able to offer this
 * instance again. Never rejects, so the original join error survives.
 */
export const onJoinFailed = async (call: Call): Promise<void> => {
  if (call.state.callingState !== CallingState.LEFT) {
    try {
      // Takes the call out of the client's list, which unmounts the ringing UI.
      // `reject: false`: the join failed locally, so this is not the callee
      // declining, and the native call has already been ended with 'error'.
      await call.leave({ reject: false });
    } catch (error) {
      logger.warn(`failed to leave after a failed join: ${call.cid}`, error);
    }
  }
  // The leave above notifies {@link onLeave}, which consumes the cleanup. This
  // covers what it could not: a call already left, or a leave that itself failed.
  requestRelease(call);
};

/**
 * The call has ended.
 *
 * Releases what the setup hook installed, once the hook has actually settled -
 * a hook still running may yet install something, and releasing before it
 * finishes would strand that.
 */
export const onLeave = (call: Call): void => {
  // A release-only registration has nothing to pair with, so its hook belongs to
  // the call ending rather than to a join: it is owed for every ringing call
  // that ends, including one declined without ever joining.
  if (!hooks?.onBeforeCallJoin) {
    fireRelease(call);
    return;
  }
  requestRelease(call);
};
