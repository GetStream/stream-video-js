import { useActiveRingCall } from '@stream-io/video-react-bindings';
import { Platform } from 'react-native';
import RNCallKeep from 'react-native-callkeep';

export const useCallKeep = () => {
  const activeRingCall = useActiveRingCall();

  const startCall = async () => {
    if (Platform.OS === 'ios' && activeRingCall) {
      await RNCallKeep.startCall(
        activeRingCall.id,
        '',
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
