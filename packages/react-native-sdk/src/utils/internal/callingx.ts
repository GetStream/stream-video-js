/***
 * Internal utils for callingx library usage from video-client.
 * See @./registerSDKGlobals.ts for more usage details.
 */
import { Platform } from 'react-native';
import { getCallingxLibIfAvailable } from '../push/libs/callingx';
import {
  Call,
  MemberResponse,
  StreamVideoParticipant,
  videoLoggerSystem,
} from '@stream-io/video-client';
import { waitForAudioSessionActivation } from './audioSessionPromise';

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
export async function startCallingxCall(call: Call) {
  if (!CallingxModule || !CallingxModule.isSetup) {
    return;
  }

  const isOutcomingCall = call.ringing && call.isCreatedByMe;
  const isIncomingCall = call.ringing && !call.isCreatedByMe;

  const callDisplayName = getCallDisplayName(
    call.state.members,
    call.state.participants,
    call.currentUserId,
  );

  if (
    !CallingxModule.isCallRegistered(call.cid) &&
    (isOutcomingCall || (!call.ringing && CallingxModule.isOngoingCallsEnabled))
  ) {
    try {
      await CallingxModule.startCall(
        call.cid, // unique id for call
        call.id, // phone number for display in dialer (we use call id as phone number)
        callDisplayName, // display name for display in call screen
        call.state.settings?.video?.enabled ?? false, // is video call?
      );

      // Wait for audio session activation on iOS only
      if (Platform.OS === 'ios') {
        await waitForAudioSessionActivation();
      }

      CallingxModule.setCurrentCallActive(call.cid);
    } catch (error) {
      videoLoggerSystem
        .getLogger('startCallingxCall')
        .error(`Error starting call in callingx: ${call.cid}`, error);
    }
  } else if (isIncomingCall) {
    if (!CallingxModule.isCallRegistered(call.cid)) {
      await CallingxModule.displayIncomingCall(
        call.cid, // unique id for call
        call.id, // phone number for display in dialer (we use call id as phone number)
        callDisplayName, // display name for display in call screen
        call.state.settings?.video?.enabled ?? false, // is video call?
      );

      await waitForDisplayIncomingCall(call.cid);
    } else {
      await CallingxModule.answerIncomingCall(call.cid);
    }

    if (Platform.OS === 'ios') {
      await waitForAudioSessionActivation();
    }
  }
}

export async function endCallingxCall(call: Call) {
  if (
    !CallingxModule ||
    !CallingxModule.isSetup ||
    !CallingxModule.isCallRegistered(call.cid)
  ) {
    return;
  }

  try {
    await CallingxModule.endCallWithReason(call.cid, 'local');
  } catch (error) {
    videoLoggerSystem
      .getLogger('endCallingxCall')
      .error(`Error ending call in callingx: ${call.cid}`, error);
  }
}

const waitForDisplayIncomingCall = (
  callId: string,
  timeoutMs: number = 5000,
): Promise<void> => {
  if (!CallingxModule) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;
    let subscription:
      | ReturnType<typeof CallingxModule.addEventListener>
      | undefined = undefined;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      subscription?.remove();
    };

    subscription = CallingxModule.addEventListener(
      'didDisplayIncomingCall',
      async (params) => {
        videoLoggerSystem
          .getLogger('waitForDisplayIncomingCall')
          .debug('didDisplayIncomingCall', params);
        cleanup();

        try {
          await CallingxModule.answerIncomingCall(callId);
          resolve();
        } catch (error) {
          reject(error);
        }
      },
    );

    timeoutId = setTimeout(() => {
      cleanup();
      reject(
        new Error(
          `Timeout waiting for didDisplayIncomingCall after ${timeoutMs}ms`,
        ),
      );
    }, timeoutMs);
  });
};
