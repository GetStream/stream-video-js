import { CallingState } from '../store';
import type { CallSessionResponse } from '../gen/coordinator';

export type OwnRingOutcome = {
  /**
   * Whether the current user accepted or rejected the ring, on this device or
   * on another one. Either way the ring no longer needs to time out.
   */
  settledByMe: boolean;

  /**
   * Set when this device should stop ringing and leave, carrying the reason to
   * report to the native call UI.
   */
  leaveReason?: 'answeredElsewhere' | 'rejected';
};

export type OwnRingOutcomeInput = {
  /** The call session to read the accept and reject maps from. */
  session: CallSessionResponse | undefined;
  /** The connected user, or `undefined` when there is none. */
  currentUserId: string | undefined;
  /** The current calling state. */
  callingState: CallingState;
};

/**
 * Decides what a ringing call should do about the current user's own accept or
 * reject, which may have happened on another device.
 *
 * Accepting on *this* device also lands in `accepted_by`, so an acceptance only
 * means another device took the call when this one is still ringing.
 *
 * Only meaningful for a ringing call; the caller checks that.
 */
export const resolveOwnRingOutcome = ({
  session,
  currentUserId,
  callingState,
}: OwnRingOutcomeInput): OwnRingOutcome => {
  if (!currentUserId) return { settledByMe: false };

  const acceptedByMe = Boolean(session?.accepted_by[currentUserId]);
  const rejectedByMe = Boolean(session?.rejected_by[currentUserId]);
  if (!acceptedByMe && !rejectedByMe) return { settledByMe: false };

  const answeredElsewhere =
    acceptedByMe && callingState === CallingState.RINGING;

  return {
    settledByMe: true,
    leaveReason: answeredElsewhere
      ? 'answeredElsewhere'
      : rejectedByMe
        ? 'rejected'
        : undefined,
  };
};
