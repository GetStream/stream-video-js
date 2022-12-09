import {
  useActiveCall,
  useIncomingCalls,
  useLocalParticipant,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { useCallback } from 'react';
import InCallManager from 'react-native-incall-manager';
import { useCallKeep } from './useCallKeep';

export const useRingCall = () => {
  const client = useStreamVideoClient();
  const localParticipant = useLocalParticipant();
  const activeCall = useActiveCall();
  const activeCallMeta = activeCall?.data.call;

  const incomingCalls = useIncomingCalls();
  const { endCall } = useCallKeep();
  const currentIncomingRingCall = incomingCalls[incomingCalls.length - 1];
  const isCallCreatedByUserLocalParticipant =
    activeCallMeta?.createdByUserId === localParticipant?.userId;

  const answerCall = async () => {
    if (!client || !currentIncomingRingCall.call) {
      return;
    }
    await client.acceptCall(currentIncomingRingCall.call.callCid);
    const call = await client.joinCall({
      id: currentIncomingRingCall.call.id,
      type: 'default',
      datacenterId: '',
      input: {
        ring: true,
        members: [],
      },
    });
    if (!call) {
      throw new Error(
        `Failed to join a call with id: ${currentIncomingRingCall.call.id}`,
      );
    } else {
      InCallManager.start({ media: 'video' });
      InCallManager.setForceSpeakerphoneOn(true);
      await call.join();
    }
  };

  const rejectCall = useCallback(async () => {
    if (!client || !currentIncomingRingCall.call?.callCid) {
      return;
    }
    await client.rejectCall(currentIncomingRingCall.call.callCid);
  }, [client, currentIncomingRingCall]);

  const cancelCall = useCallback(async () => {
    if (!client || !activeCallMeta || !isCallCreatedByUserLocalParticipant) {
      return;
    }
    endCall();
    await client.cancelCall(activeCallMeta.callCid);
  }, [activeCallMeta, client, endCall, isCallCreatedByUserLocalParticipant]);

  return { answerCall, rejectCall, cancelCall };
};
