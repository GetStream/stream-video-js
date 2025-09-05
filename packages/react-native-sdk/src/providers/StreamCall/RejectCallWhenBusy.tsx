import { useEffect } from 'react';
import {
  useCall,
  useCalls,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { CallingState, getLogger } from '@stream-io/video-client';
import { StreamVideoRN } from '../../utils';
import { Platform } from 'react-native';

const BUSY_TONE_DURATION_IN_MS = 3000;

/**
 * This is a renderless component to reject calls when the user is busy.
 */
export const RejectCallWhenBusy = () => {
  const client = useStreamVideoClient();
  const calls = useCalls();
  const call = useCall();

  useEffect(() => {
    if (!client) return;
    return client?.on('call.rejected', async (event) => {
      const isCallCreatedByMe =
        event.call.created_by.id === client.state.connectedUser?.id;
      const isCalleeBusy = isCallCreatedByMe && event.reason === 'busy';

      if (isCalleeBusy) {
        StreamVideoRN.playBusyTone();

        setTimeout(() => {
          StreamVideoRN.stopBusyTone();
        }, BUSY_TONE_DURATION_IN_MS);
      }
    });
  }, [client]);

  const pushConfig = StreamVideoRN.getConfig().push;
  const shouldRejectCallWhenBusy = pushConfig?.shouldRejectCallWhenBusy;

  useEffect(() => {
    if (!client) return;
    client.setShouldRejectCallWhenBusy(shouldRejectCallWhenBusy ?? false);
  }, [client, shouldRejectCallWhenBusy]);

  useEffect(() => {
    // android rejection is done in android's firebaseDataHandler
    if (Platform.OS === 'android') return;
    if (!shouldRejectCallWhenBusy) return;

    const ringingCallsInProgress = calls.filter(
      (c) =>
        c.ringing &&
        c.state.callingState !== CallingState.IDLE &&
        c.state.callingState !== CallingState.LEFT &&
        c.state.callingState !== CallingState.RECONNECTING_FAILED,
    );

    const alreadyInAnotherRingingCall = ringingCallsInProgress.length > 0;
    if (!alreadyInAnotherRingingCall) {
      return;
    }

    const callsForRejection = calls.filter(
      (c) =>
        c.ringing &&
        c.cid !== ringingCallsInProgress[0]?.cid &&
        c.state.callingState === CallingState.RINGING,
    );

    if (callsForRejection.length > 0) {
      callsForRejection.forEach((c) => {
        c.reject('busy').catch((err) => {
          const logger = getLogger(['RejectCallWhenBusy']);
          logger('error', 'Error rejecting Call when busy', err);
        });
      });
    }
  }, [call, calls, shouldRejectCallWhenBusy]);

  return null;
};
