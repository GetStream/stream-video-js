import VoipPushNotification from 'react-native-voip-push-notification';
import { useEffect } from 'react';

export const useIosPushEffect = () => {
  useEffect(() => {
    const onTokenReceived = (token: string) => {
      // TODO: send token to stream
      console.log({ token });
    };
    VoipPushNotification.addEventListener('register', (token) => {
      onTokenReceived(token);
    });

    // ===== Step 2: subscribe `notification` event =====
    // --- this.onVoipPushNotificationReceived
    VoipPushNotification.addEventListener('notification', (notification) => {
      // --- when receive remote voip push, register your VoIP client, show local notification ... etc
      console.log({ notification });

      // --- optionally, if you `addCompletionHandler` from the native side, once you have done the js jobs to initiate a call, call `completion()`
      // VoipPushNotification.onVoipNotificationCompleted(notification.uuid);
    });

    // ===== Step 3: subscribe `didLoadWithEvents` event =====
    VoipPushNotification.addEventListener('didLoadWithEvents', (events) => {
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
          // VoipPushNotification.onVoipNotificationCompleted(data.uuid);
        }
      }
    });
    return () => {
      VoipPushNotification.removeEventListener('didLoadWithEvents');
      VoipPushNotification.removeEventListener('register');
      VoipPushNotification.removeEventListener('notification');
    };
  }, []);
};
