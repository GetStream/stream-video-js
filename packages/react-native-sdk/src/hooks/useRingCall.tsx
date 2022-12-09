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

  const activeRingCall = useActiveCall();
  const incomingRingCalls = useIncomingCalls();
  const { endCall } = useCallKeep();
  const currentIncomingRingCall =
    incomingRingCalls[incomingRingCalls.length - 1];
  const isCallCreatedByUserLocalParticipant =
    activeRingCall?.data?.call?.createdByUserId === localParticipant?.userId;

  const answerCall = async () => {
    if (!client || !currentIncomingRingCall.call) {
      return;
    }
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
      await client.acceptCall(currentIncomingRingCall.call.callCid);
    }
  };

  const rejectCall = useCallback(async () => {
    if (!client || !currentIncomingRingCall.call?.callCid) {
      return;
    }
    await client.rejectCall(currentIncomingRingCall.call.callCid);
  }, [client, currentIncomingRingCall]);

  const cancelCall = useCallback(async () => {
    if (
      !client ||
      !activeRingCall ||
      !activeRingCall.data.call ||
      !isCallCreatedByUserLocalParticipant
    ) {
      return;
    }
    endCall();
    await client.cancelCall(activeRingCall.data.call.callCid);
  }, [activeRingCall, client, endCall, isCallCreatedByUserLocalParticipant]);

  return { answerCall, rejectCall, cancelCall };
};
