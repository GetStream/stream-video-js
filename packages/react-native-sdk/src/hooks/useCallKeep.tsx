import {
  useActiveRingCall,
  useActiveRingCallDetails,
} from '@stream-io/video-react-bindings';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import RNCallKeep from 'react-native-callkeep';
import { useStreamVideoStoreValue } from '../contexts';
import { generateCallTitle } from '../utils';

export const useCallKeep = () => {
  const activeRingCall = useActiveRingCall();
  const activeRingCallDetails = useActiveRingCallDetails();
  const callKeepOptions = useStreamVideoStoreValue(
    (store) => store.callKeepOptions,
  );

  useEffect(() => {
    if (callKeepOptions) {
      try {
        RNCallKeep.setup(callKeepOptions).then((accepted) => {
          console.log('RNCallKeep initialized');
        });
      } catch (error) {
        console.log(error);
      }
    }
  });

  const callTitle = generateCallTitle(
    activeRingCallDetails?.memberUserIds || [],
  );

  const startCall = async () => {
    if (Platform.OS === 'ios' && activeRingCall) {
      await RNCallKeep.startCall(
        activeRingCall.id,
        callTitle,
        activeRingCallDetails?.memberUserIds.join(','),
        'generic',
      );
    }
  };

  const endCall = async () => {
    if (Platform.OS === 'ios' && activeRingCall) {
      await RNCallKeep.endCall(activeRingCall.id);
    }
  };

  return { startCall, endCall };
};
