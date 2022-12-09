import { useActiveCall } from '@stream-io/video-react-bindings';
import { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import RNCallKeep from 'react-native-callkeep';
import { useStreamVideoStoreValue } from '../contexts';
import { generateCallTitle } from '../utils';

export const useCallKeep = () => {
  const activeCall = useActiveCall();
  const callKeepOptions = useStreamVideoStoreValue(
    (store) => store.callKeepOptions,
  );

  useEffect(() => {
    if (callKeepOptions) {
      RNCallKeep.setup(callKeepOptions)
        .then((accepted) => {
          console.log('RNCallKeep initialized');
        })
        .catch((error) => {
          console.log(error);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const callTitle = generateCallTitle(
    activeCall?.data.details?.memberUserIds || [],
  );

  const startCall = useCallback(async () => {
    if (Platform.OS === 'ios' && activeCall && activeCall.data.call) {
      await RNCallKeep.startCall(
        activeCall.data.call?.id,
        callTitle,
        activeCall.data.details?.memberUserIds.join(','),
        'generic',
      );
    }
  }, [activeCall, callTitle]);

  const endCall = useCallback(async () => {
    if (Platform.OS === 'ios' && activeCall?.data.call) {
      await RNCallKeep.endCall(activeCall.data.call.id);
    }
  }, [activeCall]);

  return { startCall, endCall };
};
