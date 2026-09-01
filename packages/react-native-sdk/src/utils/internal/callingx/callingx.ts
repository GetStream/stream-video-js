/***
 * Internal utils for callingx library usage from video-client.
 * See @./registerSDKGlobals.ts for more usage details.
 */
import { Platform } from 'react-native';
import type { EndCallReason } from '@stream-io/react-native-callingx';
import { getCallingxLibIfAvailable } from '../../push/libs/callingx';
import type {
  Call,
  MemberResponse,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import { CallingState, videoLoggerSystem } from '@stream-io/video-client';

const CallingxModule = getCallingxLibIfAvailable();

/**
 * Gets the call display name. To be used for display in native call screen.
 */
export function getCallDisplayName(
  callMembers: MemberResponse[] | undefined,
  participants: StreamVideoParticipant[] | undefined,
  currentUserId: string | undefined,
): string {
  if (!callMembers || !participants || !currentUserId) {
    return 'Call';
  }

  let names: string[] = [];

  if (callMembers.length > 0) {
    // for ringing calls, members array contains all call members from the very early state and participants array is empty in the beginning
    names = callMembers.flatMap((member) =>
      member.user.id !== currentUserId && member.user.name
        ? [member.user.name]
        : [],
    );
  } else if (participants.length > 0) {
    // for non-ringing calls, members array is empty and we rely on participants array there
    names = participants.flatMap((participant) =>
      participant.userId !== currentUserId && participant.name
        ? [participant.name]
        : [],
    );
  }

  // if no names are found, we use the name of the current user
  if (names.length === 0) {
    names = [
      participants.find((participant) => participant.userId === currentUserId)
        ?.name || 'Call',
    ];
  }

  return names.sort().join(', ');
}

/**
 * Args shared by the callingx call registration APIs:
 * `(callId, phoneNumber, callerName, hasVideo)`.
 */
function getCallingxCallArgs(call: Call): [string, string, string, boolean] {
  const callDisplayName =
    call.state.custom?.display_name ||
    getCallDisplayName(
      call.state.members,
      call.state.participants,
      call.currentUserId,
    );
  return [
    call.cid, // unique id for call
    call.state.createdBy?.id ?? callDisplayName, // handle for native call UI (prefer createdBy user id, fallback to call display name)
    callDisplayName, // display name for display in call screen
    call.state.settings?.video?.enabled ?? false, // is video call?
  ];
}

/**
 * Non-ringing calls are only registered in the callingx library
 * when ongoing calls are enabled.
 */
function isOngoingCall(call: Call): boolean {
  return !call.ringing && !!CallingxModule?.isOngoingCallsEnabled;
}

/**
 * Leaves the other calls that are registered in the callingx library before the
 * given call gets registered, so that only one call is registered at a time.
 */
async function leaveOtherActiveCalls(call: Call, activeCalls: Call[]) {
  const logger = videoLoggerSystem.getLogger('callingx');
  const activeCallsToLeave = activeCalls.filter(
    (c) =>
      c.cid !== call.cid &&
      (c.ringing || isOngoingCall(c)) &&
      c.state.callingState !== CallingState.LEFT,
  );
  for (const activeCall of activeCallsToLeave) {
    logger.debug(
      `leaving currently-active-call:${activeCall.cid} before registering the call:${call.cid}`,
    );
    await activeCall.leave({ reason: 'cancel' }).catch((e) => {
      logger.error(`failed to leave active call ${activeCall.cid}`, e);
    });
  }
}

export async function registerOutgoingCall(call: Call, activeCalls: Call[]) {
  if (
    !CallingxModule ||
    !CallingxModule.isSetup ||
    call.isOwnTracksLoopbackAllowed
  ) {
    return;
  }

  const isOutcomingCall = call.ringing && call.isCreatedByMe;
  if (!isOutcomingCall) {
    return;
  }

  const logger = videoLoggerSystem.getLogger('callingx');

  try {
    logger.debug(`registerOutgoingCall: Registering outgoing call ${call.cid}`);
    await leaveOtherActiveCalls(call, activeCalls);
    await CallingxModule.startCall(...getCallingxCallArgs(call));
  } catch (error) {
    logger.error(
      `registerOutgoingCall: Error registering outgoing call in callingx: ${call.cid}`,
      error,
    );
  }
}

/**
 * Starts the call in the callingx library.
 * It is done by client on every join
 * Does either of the following:
 * 1. Sets the state for outgoing calls in the callingx library
 * 2. Displays the incoming call in the callingx library
 * 3. Optionally for non-ringing calls also when ongoing calls are enabled.
 */
export async function joinCallingxCall(call: Call, activeCalls: Call[]) {
  if (
    !CallingxModule ||
    !CallingxModule.isSetup ||
    call.isOwnTracksLoopbackAllowed
  ) {
    return;
  }

  const logger = videoLoggerSystem.getLogger('callingx');
  const isOutcomingCall = call.ringing && call.isCreatedByMe;
  const isIncomingCall = call.ringing && !call.isCreatedByMe;

  if (!isIncomingCall && !isOutcomingCall && !isOngoingCall(call)) {
    return;
  }

  try {
    await leaveOtherActiveCalls(call, activeCalls);
    logger.debug(
      `joinCallingxCall: Joining call ${call.cid} isIncoming: ${isIncomingCall} isOutgoing: ${isOutcomingCall}`,
    );
    const callArgs = getCallingxCallArgs(call);
    if (isIncomingCall) {
      await CallingxModule.displayIncomingCall(...callArgs);
      await CallingxModule.answerIncomingCall(call.cid);
    } else {
      await CallingxModule.startCall(...callArgs);
    }
  } catch (error) {
    logger.error(
      `startCallingxCall: Error starting call in callingx: ${call.cid} isIncoming: ${isIncomingCall} isOutgoing: ${isOutcomingCall}`,
      error,
    );
  }
}

export async function endCallingxCall(call: Call, reason?: EndCallReason) {
  if (
    !CallingxModule ||
    !CallingxModule.isSetup ||
    !CallingxModule.isCallTracked(call.cid)
  ) {
    return;
  }

  const logger = videoLoggerSystem.getLogger('callingx');
  try {
    logger.debug(`endCallingxCall: Ending call ${call.cid}`);
    await CallingxModule.endCallWithReason(call.cid, reason ?? 'local');
  } catch (error) {
    logger.error(
      `endCallingxCall: Error ending call in callingx: ${call.cid}`,
      error,
    );
  }
}

export async function wireAudioEngineSubscription() {
  if (!CallingxModule || !CallingxModule.isSetup || Platform.OS !== 'ios') {
    return;
  }
  const logger = videoLoggerSystem.getLogger('callingx');

  try {
    logger.debug('wireEngineSubscription: Wiring engine subscription');
    CallingxModule.wireAudioEngineSubscription();
  } catch (error) {
    logger.error(
      'wireAudioEngineSubscription: Error wiring engine subscription',
      error,
    );
  }
}

export function unwireAudioEngineSubscription() {
  if (!CallingxModule || !CallingxModule.isSetup || Platform.OS !== 'ios') {
    return;
  }
  const logger = videoLoggerSystem.getLogger('callingx');

  try {
    logger.debug('unwireEngineSubscription: Cancelling engine subscription');
    CallingxModule.unwireAudioEngineSubscription();
  } catch (error) {
    logger.error(
      'unwireAudioEngineSubscription: Error cancelling engine subscription',
      error,
    );
  }
}
