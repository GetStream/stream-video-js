import { useEffect } from 'react';
import {
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

  useEffect(() => {
    if (!client) return;
    return client?.on('call.rejected', async (event) => {
      // Workaround needed for the busy tone:
      // This is because the call was rejected without even starting,
      // before calling the stop method with busy tone we need to start the call first.
      InCallManager.start({ media: 'audio' });

      const callCid = event.call_cid;
      const callId = callCid.split(':')[1];
      if (!callId) return;

      const rejectedCall = client?.call(event.call.type, callId);
      await rejectedCall?.getOrCreate();

      const isCalleeBusy =
        rejectedCall && rejectedCall.isCreatedByMe && event.reason === 'busy';

      if (isCalleeBusy) {
        InCallManager.stop({ busytone: '_DTMF_' });
      }
    });
  }, [client]);

  const pushConfig = StreamVideoRN.getConfig().push;
  const shouldRejectCallWhenBusy = pushConfig?.shouldRejectCallWhenBusy;

  useEffect(() => {
    if (!client) return;
    client.setShouldRejectWhenBusy(shouldRejectCallWhenBusy ?? false);
  }, [client, shouldRejectCallWhenBusy]);

  useEffect(() => {
    // android rejection is done in android's firebaseDataHandler
    if (Platform.OS === 'android') return;
    if (!shouldRejectCallWhenBusy) return;

    const ringingCallsInProgress = calls.filter(
      (c) => c.ringing && c.state.callingState === CallingState.JOINED,
    );
    const callsForRejection = calls.filter(
      (c) => c.ringing && c.state.callingState === CallingState.RINGING,
    );
    const alreadyInAnotherRingingCall = ringingCallsInProgress.length > 0;
    if (callsForRejection.length > 0 && alreadyInAnotherRingingCall) {
      callsForRejection.forEach((c) => {
        c.leave({ reject: true, reason: 'busy' }).catch((err) => {
          const logger = getLogger(['RejectCallWhenBusy']);
          logger('error', 'Error rejecting Call when busy', err);
        });
      });
    }
  }, [calls, shouldRejectCallWhenBusy]);

  return null;
};
