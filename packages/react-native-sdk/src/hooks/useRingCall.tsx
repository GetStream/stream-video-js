import {
  useIncomingRingCalls,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import InCallManager from 'react-native-incall-manager';
import RNCallKeep from 'react-native-callkeep';
import { useStreamVideoStoreValue } from '../contexts/StreamVideoContext';
import { Platform } from 'react-native';

export const useRingCall = () => {
  const client = useStreamVideoClient();
  const localMediaStream = useStreamVideoStoreValue(
    (store) => store.localMediaStream,
  );
  const incomingRingCalls = useIncomingRingCalls();
  const currentIncomingRingCall =
    incomingRingCalls[incomingRingCalls.length - 1];

  const answerCall = async () => {
    if (!client) {
      return;
    }
    const call = await client.joinCall({
      id: currentIncomingRingCall.id,
      type: 'default',
      datacenterId: '',
      input: {
        ring: true,
        members: [],
      },
    });
    if (!call) {
      throw new Error(
        `Failed to join a call with id: ${currentIncomingRingCall.id}`,
      );
    } else {
      InCallManager.start({ media: 'video' });
      InCallManager.setForceSpeakerphoneOn(true);
      await call.join(localMediaStream, localMediaStream);
      await call.publishMediaStreams(localMediaStream, localMediaStream);
      await client.acceptCall(currentIncomingRingCall.callCid);
      if (Platform.OS === 'ios') {
        RNCallKeep.startCall(
          currentIncomingRingCall.id,
          '',
          currentIncomingRingCall.createdByUserId,
          'generic',
        );
      }
    }
  };

  const rejectCall = async () => {
    if (!client) {
      return;
    }
    await client.rejectCall(currentIncomingRingCall.callCid);
  };

  return { answerCall, rejectCall };
};
