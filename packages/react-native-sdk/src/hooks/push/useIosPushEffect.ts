import { useEffect } from 'react';
import { getVoipPushNotificationLib } from '../../utils/push/libs';

import { Platform } from 'react-native';
import { StreamVideoRN } from '../../utils';
import { useStreamVideoClient } from '@stream-io/video-react-bindings';
import { voipPushNotificationCallCId$ } from '../../utils/push/rxSubjects';

/**
 * This hook is used to do the initial setup of listeners
 * for ios voip push notifications.
 */
export const useIosPushEffect = () => {
  const client = useStreamVideoClient();
  useEffect(() => {
    const pushConfig = StreamVideoRN.getConfig().push;
    if (Platform.OS !== 'ios' || !pushConfig || !client) {
      return;
    }
    const voipPushNotification = getVoipPushNotificationLib();

    const onTokenReceived = (token: string) => {
      // send token to stream
      const push_provider_name = pushConfig.ios.pushProviderName;
      client.addVoipDevice(token, 'apn', push_provider_name).catch((err) => {
        console.warn('Failed to send voip token to stream', err);
      });
    };
    // fired when PushKit give us the latest token
    voipPushNotification.addEventListener('register', (token) => {
      onTokenReceived(token);
    });

    // this will fire when there are events occured before js bridge initialized
    voipPushNotification.addEventListener('didLoadWithEvents', (events) => {
      if (!events || !Array.isArray(events) || events.length < 1) {
        return;
      }
      for (let voipPushEvent of events) {
        let { name, data } = voipPushEvent;
        if (name === 'RNVoipPushRemoteNotificationsRegisteredEvent') {
          onTokenReceived(data);
        } else if (name === 'RNVoipPushRemoteNotificationReceivedEvent') {
          onNotificationReceived(data);
        }
      }
    });
    return () => {
      voipPushNotification.removeEventListener('didLoadWithEvents');
      voipPushNotification.removeEventListener('register');
    };
  }, [client]);

  useEffect(() => {
    const pushConfig = StreamVideoRN.getConfig().push;
    if (Platform.OS !== 'ios' || !pushConfig) {
      return;
    }
    const voipPushNotification = getVoipPushNotificationLib();
    // fired when we received a voip push notification
    voipPushNotification.addEventListener('notification', (notification) => {
      onNotificationReceived(notification);
    });
    return () => {
      voipPushNotification.removeEventListener('notification');
    };
  }, []);
};

const onNotificationReceived = (notification: any) => {
  console.log(JSON.stringify(notification));
  const sender = notification?.stream?.sender;
  // do not process any other notifications other than stream.video
  if (sender !== 'stream.video') {
    return;
  }
  const call_cid = notification?.stream?.call_cid;
  if (call_cid) {
    voipPushNotificationCallCId$.next(call_cid);
  }
};
