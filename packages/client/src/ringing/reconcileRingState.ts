import type { Call } from '../Call';
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
 * @returns whether the ring reached a terminal state.
 */
export const reconcileRingState = async (call: Call): Promise<boolean> => {
  if (call.state.callingState !== CallingState.RINGING) return true;
  return call.isCreatedByMe ? reconcileAsCaller(call) : reconcileAsCallee(call);
};

const reconcileAsCaller = async (call: Call): Promise<boolean> => {
  const { session, members, endedAt } = call.state;
  const currentUserId = call.currentUserId;

  // checked before `accepted_by`: an ended session cannot be joined
  if (endedAt || session?.ended_at) {
    call.logger.info('ring: the call has ended, leaving');
    globalThis.streamRNVideoSDK?.callingX?.endCall(call, 'remote');
    await leave(call, { reject: false, message: 'ring: call ended' });
    return true;
  }

  const acceptedBy = session?.accepted_by ?? {};
  if (Object.keys(acceptedBy).some((userId) => userId !== currentUserId)) {
    call.logger.info('ring: the call was accepted, joining');
    await call.join().catch((err) => {
      call.logger.error('Failed to join an accepted call', err);
    });
    return true;
  }

  const otherMembers = members
    .filter((member) => member.user_id !== currentUserId)
    .map((member) => member.user_id);
  if (otherMembers.length === 0) return false;

  const rejectedBy = session?.rejected_by ?? {};
  if (otherMembers.every((userId) => rejectedBy[userId])) {
    call.logger.info('ring: everyone rejected, leaving');
    await leave(call, {
      reject: true,
      reason: 'cancel',
      message: 'ring: everyone rejected',
    });
    return true;
  }

  const missedBy = session?.missed_by ?? {};
  if (otherMembers.every((userId) => rejectedBy[userId] || missedBy[userId])) {
    call.logger.info('ring: no one accepted, leaving');
    await leave(call, {
      reject: true,
      reason: 'timeout',
      message: 'ring: no one accepted',
    });
    return true;
  }

  return false;
};

// accepted or rejected on another device is handled by the `session$` effect in
// `Call.registerEffects`, and `call.ended` by `watchCallEnded`.
const reconcileAsCallee = async (call: Call): Promise<boolean> => {
  const createdById = call.state.createdBy?.id;
  const rejectedBy = call.state.session?.rejected_by ?? {};
  if (createdById && rejectedBy[createdById]) {
    call.logger.info('ring: the caller cancelled, leaving');
    globalThis.streamRNVideoSDK?.callingX?.endCall(call, 'remote');
    await leave(call, { message: 'ring: creator rejected' });
    return true;
  }
  return false;
};

const leave = async (call: Call, options: CallLeaveOptions) => {
  await call.leave(options).catch((err) => {
    call.logger.error('Failed to leave a ringing call', err);
  });
};
