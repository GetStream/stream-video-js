import { useActiveCall } from '@stream-io/video-react-bindings';
import InCallManager from 'react-native-incall-manager';
import { useCallback } from 'react';
import { useRingCall } from './useRingCall';

export const useCall = () => {
  const activeCall = useActiveCall();
  const { cancelCall } = useRingCall();

  const hangupCall = useCallback(async () => {
    if (!activeCall) {
      console.warn('Failed to leave call: call is undefined');
      return;
    }
    try {
      await cancelCall();
      activeCall.leave();
      InCallManager.stop();
    } catch (error) {
      console.warn('failed to leave call', error);
    }
  }, [activeCall, cancelCall]);

  return { hangupCall };
};
