import InCallManager from 'react-native-incall-manager';
import { useCallback } from 'react';
import { useActiveCall } from '@stream-io/video-react-bindings';

/**
 * A hook which provides a list of all participants that have joined an active call.
 */
export const useHangupCall = () => {
  const activeCall = useActiveCall();

  const hangupCall = useCallback(async () => {
    if (!activeCall) {
      console.warn('Failed to leave call: call is undefined');
      return;
    }
    try {
      activeCall?.leave();
      InCallManager.stop();
    } catch (error) {
      console.warn('failed to leave call', error);
    }
  }, [activeCall]);

  return { hangupCall };
};
