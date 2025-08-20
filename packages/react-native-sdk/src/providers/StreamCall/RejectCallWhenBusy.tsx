import { useEffect } from 'react';
import {
  useCall,
  useCalls,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { CallingState, getLogger } from '@stream-io/video-client';
import InCallManager from 'react-native-incall-manager';
import { StreamVideoRN } from '../../utils';
import { Platform } from 'react-native';

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
      // Workaround needed for the busy tone:
      // This is because the call was rejected without even starting,
      // before calling the stop method with busy tone we need to start the call first.
      InCallManager.start({ media: 'audio' });

      const isCallCreatedByMe =
        event.call.created_by.id === client.state.connectedUser?.id;
      const isCalleeBusy = isCallCreatedByMe && event.reason === 'busy';

      if (isCalleeBusy) {
        InCallManager.stop({ busytone: '_DTMF_' });
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
