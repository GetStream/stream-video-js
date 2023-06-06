import { useEffect } from 'react';
import PushLibs, {
  voipPushNotificationIsInstalled,
} from '../../utils/push/optionalLibs';

import { Platform } from 'react-native';
import { StreamVideoClient } from '@stream-io/video-client';
const { voipPushNotification } = PushLibs;

/**
 * This hook is used to do the initial setup of listeners
 * for ios voip push notifications.
 */
export const useIosPushEffect = (client: StreamVideoClient) => {
  useEffect(() => {
    if (
      Platform.OS !== 'ios' ||
      !voipPushNotificationIsInstalled(voipPushNotification)
    ) {
      return;
    }
    const onTokenReceived = (token: string) => {
      // send token to stream
      const push_provider_name = 'prod-voip-apn-ios';
      client.addVoipDevice(token, 'apn', push_provider_name);
    };
    voipPushNotification.addEventListener('register', (token) => {
      onTokenReceived(token);
    });

    // ===== Step 2: subscribe `notification` event =====
    // --- this.onvoipPushNotificationReceived
    voipPushNotification.addEventListener('notification', (notification) => {
      // --- when receive remote voip push, register your VoIP client, show local notification ... etc
      console.log({ notification });

      // --- optionally, if you `addCompletionHandler` from the native side, once you have done the js jobs to initiate a call, call `completion()`
      // voipPushNotification.onVoipNotificationCompleted(notification.uuid);
    });

    // ===== Step 3: subscribe `didLoadWithEvents` event =====
    voipPushNotification.addEventListener('didLoadWithEvents', (events) => {
      // --- this will fire when there are events occured before js bridge initialized
      // --- use this event to execute your event handler manually by event type

      if (!events || !Array.isArray(events) || events.length < 1) {
        return;
      }
      for (let voipPushEvent of events) {
        let { name, data } = voipPushEvent;
        console.log({ voipPushEvent });
        if (name === 'RNVoipPushRemoteNotificationsRegisteredEvent') {
          onTokenReceived(data);
        } else if (name === 'RNVoipPushRemoteNotificationReceivedEvent') {
          console.log('RNVoipPushRemoteNotificationReceivedEvent', { data });
          // voipPushNotification.onVoipNotificationCompleted(data.uuid);
        }
      }
    });
    return () => {
      voipPushNotification.removeEventListener('didLoadWithEvents');
      voipPushNotification.removeEventListener('register');
      voipPushNotification.removeEventListener('notification');
    };
  }, [client]);
};
