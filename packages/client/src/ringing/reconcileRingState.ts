import type { Call } from '../Call';
import type { JoinSource } from '../reporting';
import { CallingState } from '../store';
import type { CallLeaveOptions } from '../types';

/**
 * Decides what a ringing call should do next, based on the current call state.
 *
 * The `call.accepted`, `call.rejected` and `call.missed` handlers and the ring
 * state poller both run this. They differ only in how the state got there: the
 * handlers rely on `CallState.updateFromEvent`, which runs before them, and the
 * poller applies the polled ring state itself.
 *
 * @param call the call to reconcile.
 * @param joinSource which of the two triggered this run, reported on the
 * caller's join: `ring-ws` for the event handlers, `ring-poll-api` for the
 * poller.
 * @returns whether the ring reached a terminal state. A failed join is not
 * terminal: the caller should keep trying while the ring is open.
 */
export const reconcileRingState = async (
  call: Call,
  joinSource: JoinSource,
): Promise<boolean> => {
  if (call.state.callingState !== CallingState.RINGING) return true;
  return call.isCreatedByMe
    ? reconcileAsCaller(call, joinSource)
    : reconcileAsCallee(call);
};

const reconcileAsCaller = async (
  call: Call,
  joinSource: JoinSource,
): Promise<boolean> => {
  const { session, members, endedAt } = call.state;
  const currentUserId = call.currentUserId;

  // checked before `accepted_by`: an ended session cannot be joined
  if (endedAt || session?.ended_at) {
    call.logger.info('ring: the call has ended, leaving');
    // `leave` reports the remote end to callingx off `reason: 'ended'`
    return leave(call, {
      reject: false,
      reason: 'ended',
      message: 'ring: call ended',
    });
  }

  const acceptedBy = session?.accepted_by ?? {};
  if (Object.keys(acceptedBy).some((userId) => userId !== currentUserId)) {
    call.logger.info('ring: the call was accepted, joining');
    try {
      await call.join({ joinSource });
    } catch (err) {
      // `doJoin` restores the ringing state when a join fails, so the ring is
      // still open. Report it unsettled and let the next poll retry.
      call.logger.error('Failed to join an accepted call', err);
      return false;
    }
    return true;
  }

  const otherMembers = members
    .filter((member) => member.user_id !== currentUserId)
    .map((member) => member.user_id);
  if (otherMembers.length === 0) return false;

  const rejectedBy = session?.rejected_by ?? {};
  if (otherMembers.every((userId) => rejectedBy[userId])) {
    call.logger.info('ring: everyone rejected, leaving');
    return leave(call, {
      reject: true,
      reason: 'cancel',
      message: 'ring: everyone rejected',
    });
  }

  return false;
};

// the current user's own accept or reject, on this or another device, is
// handled by `resolveOwnRingOutcome`, and `call.ended` by `watchCallEnded`.
const reconcileAsCallee = async (call: Call): Promise<boolean> => {
  const createdById = call.state.createdBy?.id;
  const rejectedBy = call.state.session?.rejected_by ?? {};
  if (createdById && rejectedBy[createdById]) {
    call.logger.info('ring: the caller cancelled, leaving');
    return leave(call, {
      reason: 'ended',
      message: 'ring: creator rejected',
    });
  }
  return false;
};

// `false` when the call could not be left, so the ring stays open for a retry.
const leave = async (
  call: Call,
  options: CallLeaveOptions,
): Promise<boolean> => {
  try {
    await call.leave(options);
    return true;
  } catch (err) {
    call.logger.error('Failed to leave a ringing call', err);
    return false;
  }
};
