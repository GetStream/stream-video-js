import {
  useConnectedUser,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { useEffect } from 'react';
import { StreamVideoRN } from '../../utils';
import { initAndroidPushTokenAndRest } from '../../utils/push/utils';

export const useInitAndroidTokenAndRest = () => {
  const client = useStreamVideoClient();
  const connectedUserId = useConnectedUser()?.id;
  useEffect(() => {
    const pushConfig = StreamVideoRN.getConfig().push;
    // NOTE: we need to wait for user to be connected before we can send the push token
    if (
      !client ||
      !connectedUserId ||
      client.user?.id !== connectedUserId ||
      !pushConfig
    ) {
      return;
    }
    initAndroidPushTokenAndRest(client, pushConfig);
  }, [client, connectedUserId]);
};
