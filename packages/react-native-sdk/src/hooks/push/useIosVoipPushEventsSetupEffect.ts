import { useEffect } from 'react';
import { getVoipPushNotificationLib } from '../../utils/push/libs';

import { Platform } from 'react-native';
import { StreamVideoRN } from '../../utils';
import { useStreamVideoClient } from '@stream-io/video-react-bindings';
import { voipPushNotificationCallCId$ } from '../../utils/push/rxSubjects';
import { setPushLogoutCallback } from '../../utils/internal/pushLogoutCallback';

let lastVoipToken: string | undefined = '';

/**
 * This hook is used to do the initial setup of listeners
 * for ios voip push notifications.
 */
export const useIosVoipPushEventsSetupEffect = () => {
  const client = useStreamVideoClient();
  useEffect(() => {
    const pushConfig = StreamVideoRN.getConfig().push;
    if (Platform.OS !== 'ios' || !pushConfig || !client) {
      return;
    }
    if (lastVoipToken) {
      // send token to stream (userId might have switched on the same device)
      const push_provider_name = pushConfig.ios.pushProviderName;
      client
        .addVoipDevice(lastVoipToken, 'apn', push_provider_name)
        .catch((err) => {
          console.warn('Failed to send voip token to stream', err);
        });
    }
    const voipPushNotification = getVoipPushNotificationLib();
    const onTokenReceived = (token: string) => {
      // send token to stream
      lastVoipToken = token;
      const push_provider_name = pushConfig.ios.pushProviderName;
      client.addVoipDevice(token, 'apn', push_provider_name).catch((err) => {
        console.warn('Failed to send voip token to stream', err);
      });
      // set the logout callback
      setPushLogoutCallback(() => {
        client.removeDevice(token).catch((err) => {
          console.warn('Failed to remove voip token from stream', err);
        });
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
  /* --- Example payload ---
  {
    "aps": {
      "alert": {
        "body": "",
        "title": "Vishal Narkhede is calling you"
      },
      "badge": 0,
      "category": "stream.video",
      "mutable-content": 1
    },
    "stream": {
      "call_cid": "default:ixbm7y0k74pbjnq",
      "call_display_name": "",
      "created_by_display_name": "Vishal Narkhede",
      "created_by_id": "vishalexpo",
      "receiver_id": "santhoshexpo",
      "sender": "stream.video",
      "type": "call.ring",
      "version": "v2"
    }
  } */
  const sender = notification?.stream?.sender;
  const type = notification?.stream?.type;
  // do not process any other notifications other than stream.video or ringing
  if (sender !== 'stream.video' && type !== 'call.ring') {
    return;
  }
  const call_cid = notification?.stream?.call_cid;
  if (call_cid) {
    // send the info to this subject, it is listened by callkeep events
    // callkeep events will then accept/reject the call
    voipPushNotificationCallCId$.next(call_cid);
  }
};
