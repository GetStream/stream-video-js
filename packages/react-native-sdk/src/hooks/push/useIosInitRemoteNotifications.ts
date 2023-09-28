import {
  useConnectedUser,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { useEffect } from 'react';
import { StreamVideoRN } from '../../utils';
import { initIosNonVoipToken } from '../../utils/push/ios';

/**
 * This hook is used to initialize the push token for iOS.
 */
export const useIosInitRemoteNotifications = () => {
  const client = useStreamVideoClient();
  const connectedUserId = useConnectedUser()?.id;
  useEffect(() => {
    const pushConfig = StreamVideoRN.getConfig().push;
    // NOTE: we need to wait for user to be connected before we can send the push token
    if (!client || !connectedUserId || !pushConfig) {
      return;
    }
    let unsubscribe = () => {};
    initIosNonVoipToken(client, pushConfig, (unsubscribeListener) => {
      unsubscribe = unsubscribeListener;
    });
    return () => {
      unsubscribe();
    };
  }, [client, connectedUserId]);
};
