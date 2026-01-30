import { getCallingxLibIfAvailable } from '../push/libs/callingx';
import {
  Call,
  MemberResponse,
  StreamVideoParticipant,
} from '@stream-io/video-client';

const CallingxModule = getCallingxLibIfAvailable();

/**
 * Gets the call display name. To be used for display in native call screen.
 */
export function getCallDisplayName(
  callMembers: MemberResponse[] | undefined,
  participants: StreamVideoParticipant[] | undefined,
  currentUserId: string | undefined,
) {
  if (!callMembers || !participants || !currentUserId) {
    return 'Call';
  }

  let names: string[] = [];

  if (callMembers.length > 0) {
    // for ringing calls, members array contains all call members from the very early state and participants array is empty in the beginning
    names = callMembers
      .filter((member) => member.user.id !== currentUserId)
      .map((member) => member.user.name)
      .filter((name): name is string => name !== undefined);
  } else if (participants.length > 0) {
    // for non-ringing calls, members array is empty and we rely on participants array there
    names = participants
      .filter((participant) => participant.userId !== currentUserId)
      .map((participant) => participant.name)
      .filter(Boolean);
  }

  // if no names are found, we use the name of the current user
  if (names.length === 0) {
    names = [
      participants.find((participant) => participant.userId === currentUserId)
        ?.name ?? 'Call',
    ];
  }

  return names.sort().join(', ');
}

/**
 * Starts the call in the callingx library.
 * Must be called for all outgoing calls
 * and optionally for non-ringing calls when ongoing calls are enabled.
 */
export const startCallingxCall = (call: Call) => {
  if (!CallingxModule || CallingxModule.isCallRegistered(call.id)) {
    return;
  }
  const isOutcomingCall = call.ringing && call.isCreatedByMe;
  if (isOutcomingCall || CallingxModule.isOngoingCallsEnabled) {
    const callDisplayName = getCallDisplayName(
      call.state.members,
      call.state.participants,
      call.currentUserId,
    );
    CallingxModule?.startCall(
      call.id, // unique id for call
      call.id, // phone number for display in dialer (we use call id as phone number)
      callDisplayName, // display name for display in call screen
      call.state.settings?.video?.enabled ?? false, // is video call?
    );
  }
};
