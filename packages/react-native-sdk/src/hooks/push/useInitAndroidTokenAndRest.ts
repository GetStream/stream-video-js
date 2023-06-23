import {
  useConnectedUser,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { useEffect } from 'react';
import { StreamVideoRN } from '../../utils';
import { initAndroidPushToken } from '../../utils/push/android';

/**
 * This hook is used to initialize the push token for Android and ask notification permissions.
 */
export const useInitAndroidTokenAndRest = () => {
  const client = useStreamVideoClient();
  const connectedUserId = useConnectedUser()?.id;
  useEffect(() => {
    const pushConfig = StreamVideoRN.getConfig().push;
    // NOTE: we need to wait for user to be connected before we can send the push token
    if (!client || !connectedUserId || !pushConfig) {
      return;
    }
    initAndroidPushToken(client, pushConfig);
  }, [client, connectedUserId]);
};
