/***
 * Internal utils for callingx library usage from video-client.
 * See @./registerSDKGlobals.ts for more usage details.
 */
import { NativeModules, Platform } from 'react-native';
import type { EndCallReason } from '@stream-io/react-native-callingx';
import { getCallingxLibIfAvailable } from '../../push/libs/callingx';
import { waitForAudioSessionActivation } from './audioSessionPromise';
import type {
  Call,
  MemberResponse,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import { CallingState, videoLoggerSystem } from '@stream-io/video-client';

const CallingxModule = getCallingxLibIfAvailable();

/**
 * Fallback when Telecom registration fails/times out on Android: no component would own audio
 * (Telecom never took over), so re-establish StreamInCallManager in its classic (non-telecom)
 * mode to keep the call audible. No-op on iOS and when Telecom is not the intended owner.
 */
function recoverAudioToClassicMode() {
  if (Platform.OS !== 'android') {
    return;
  }
  if (!CallingxModule?.isSetup || !CallingxModule.isTelecomBacked) {
    return;
  }
  const StreamInCallManagerNativeModule = NativeModules.StreamInCallManager;
  if (!StreamInCallManagerNativeModule) {
    return;
  }
  const logger = videoLoggerSystem.getLogger('callingx');
  logger.warn(
    'Telecom registration failed; falling back to classic StreamInCallManager audio',
  );
  try {
    StreamInCallManagerNativeModule.stop();
    StreamInCallManagerNativeModule.setTelecomManagedMode(false);
    StreamInCallManagerNativeModule.setup();
    StreamInCallManagerNativeModule.start();
  } catch (error) {
    logger.error('recoverAudioToClassicMode: failed to recover audio', error);
  }
}

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
        ?.name ?? 'Call',
    ];
  }

  return names.sort().join(', ');
}

function getCallDisplayNameFromCall(call: Call): string {
  return (
    call.state.custom?.display_name ??
    getCallDisplayName(
      call.state.members,
      call.state.participants,
      call.currentUserId,
    )
  );
}

export async function registerOutgoingCall(call: Call) {
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
    const callDisplayName = getCallDisplayNameFromCall(call);
    await CallingxModule.startCall(
      call.cid, // unique id for call
      call.state.createdBy?.id ?? callDisplayName, // handle for native call UI (prefer createdBy user id, fallback to call display name)
      callDisplayName, // display name for display in call screen
      call.state.settings?.video?.enabled ?? false, // is video call?
    );
  } catch (error) {
    logger.error(
      `registerOutgoingCall: Error registering outgoing call in callingx: ${call.cid}`,
      error,
    );
    recoverAudioToClassicMode();
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

  const startCallInCallingx = async () => {
    logger.debug(`joinCallingxCall: Joining call ${call.cid}`);
    const callDisplayName = getCallDisplayNameFromCall(call);
    await CallingxModule.startCall(
      call.cid, // unique id for call
      call.state.createdBy?.id ?? callDisplayName, // handle for native call UI (prefer createdBy user id, fallback to call display name)
      callDisplayName, // display name for display in call screen
      call.state.settings?.video?.enabled ?? false, // is video call?
    );
    if (Platform.OS === 'ios') {
      await waitForAudioSessionActivation();
    }
  };

  if (
    isOutcomingCall ||
    (!call.ringing && CallingxModule.isOngoingCallsEnabled)
  ) {
    try {
      await startCallInCallingx();
    } catch (error) {
      logger.error(
        `startCallingxCall: Error starting call in callingx: ${call.cid}`,
        error,
      );
      recoverAudioToClassicMode();
    }
  } else if (isIncomingCall) {
    logger.debug(`joinCallingxCall: Joining incoming call ${call.cid}`);

    try {
      // Leave any existing active ringing calls before joining a new ringing call
      const activeCallsToLeave = activeCalls.filter(
        (c) =>
          c.cid !== call.cid &&
          c.ringing &&
          c.state.callingState !== CallingState.LEFT,
      );
      for (const activeCall of activeCallsToLeave) {
        logger.debug(
          `leaving active call ${activeCall.cid} before joining ${call.cid}`,
        );
        await activeCall.leave({ reason: 'cancel' }).catch((e) => {
          logger.error(`failed to leave active call ${activeCall.cid}`, e);
        });
      }
      // Awaits native CallKit/Telecom registration before answering.
      // Safe to call even if the call is already registered (e.g. from VoIP push) --
      // iOS early-returns with no error, Android sends the registered broadcast.
      const callDisplayName = getCallDisplayNameFromCall(call);
      await CallingxModule.displayIncomingCall(
        call.cid, // unique id for call
        call.state.createdBy?.id ?? callDisplayName, // handle for native call UI (prefer createdBy user id, fallback to call display name)
        callDisplayName, // display name for display in call screen
        call.state.settings?.video?.enabled ?? false, // is video call?
      );

      await CallingxModule.answerIncomingCall(call.cid);

      if (Platform.OS === 'ios') {
        await waitForAudioSessionActivation();
      }
    } catch (error) {
      logger.error(
        `Error joining incoming call in callingx: ${call.cid}`,
        error,
      );
      recoverAudioToClassicMode();
    }
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
