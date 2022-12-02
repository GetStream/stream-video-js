import {
  useActiveRingCall,
  useActiveRingCallDetails,
} from '@stream-io/video-react-bindings';
import { Platform } from 'react-native';
import RNCallKeep from 'react-native-callkeep';
import { generateCallTitle } from '../utils';

export const useCallKeep = () => {
  const activeRingCall = useActiveRingCall();
  const activeRingCallDetails = useActiveRingCallDetails();

  const callTitle = generateCallTitle(
    activeRingCallDetails?.memberUserIds || [],
  );

  const startCall = async () => {
    if (Platform.OS === 'ios' && activeRingCall) {
      await RNCallKeep.startCall(
        activeRingCall.id,
        callTitle,
        activeRingCall.createdByUserId,
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
