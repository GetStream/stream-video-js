import { useEffect } from 'react';
import {
  getCallKeepLib,
  getVoipPushNotificationLib,
} from '../../utils/push/libs';

import { AppState, Platform } from 'react-native';
import { StreamVideoRN } from '../../utils';
import { useStreamVideoClient } from '@stream-io/video-react-bindings';
import {
  voipCallkeepAcceptedCallOnNativeDialerMap$,
  voipPushNotificationCallCId$,
} from '../../utils/push/rxSubjects';
import { setPushLogoutCallback } from '../../utils/internal/pushLogoutCallback';
import { NativeModules } from 'react-native';
import { shouldCallBeEnded } from '../../utils/push/utils';
import { RxUtils } from '@stream-io/video-client';

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
      if (!push_provider_name) {
        return;
      }
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
      if (!push_provider_name) {
        return;
      }
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

const onNotificationReceived = async (notification: any) => {
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
  const pushConfig = StreamVideoRN.getConfig().push;
  if (!call_cid || Platform.OS !== 'ios' || !pushConfig) {
    return;
  }
  const client = await pushConfig.createStreamVideoClient();
  if (!client) {
    return;
  }
  const callFromPush = await client.onRingingCall(call_cid);
  // const response = await callFromPush.get();
  // response.call.
  let uuid = '';
  try {
    uuid = await NativeModules?.StreamVideoReactNative?.getIncomingCallUUid(
      call_cid,
    );
  } catch (error) {
    console.log('Error in getting call uuid', error);
  }
  if (!uuid) {
    return;
  }
  const created_by_id = notification?.stream?.created_by_id;
  const receiver_id = notification?.stream?.receiver_id;
  function closeCallIfNecessary() {
    const { mustEndCall, callkeepReason } = shouldCallBeEnded(
      callFromPush,
      created_by_id,
      receiver_id,
    );
    if (mustEndCall) {
      const callkeep = getCallKeepLib();
      callkeep.isCallActive(uuid).then((isActive): void => {
        if (isActive) {
          callkeep.reportEndCallWithUUID(uuid, callkeepReason);
        }
      });
      return true;
    }
    return false;
  }
  const closed = closeCallIfNecessary();
  if (!closed) {
    const unsubscribe = callFromPush.on('all', (event) => {
      const currently_processed_call_cid = RxUtils.getCurrentValue(
        voipPushNotificationCallCId$,
      ); // when we rejected through callkeep this will be undefined
      const acceptedcallkeepMap = RxUtils.getCurrentValue(
        voipCallkeepAcceptedCallOnNativeDialerMap$,
      ); // when accepted through callkeep this will be defined
      console.log({
        eventType: event.type,
        currently_processed_call_cid,
        acceptedcallkeepMap,
        subbed: voipCallkeepAcceptedCallOnNativeDialerMap$.observed,
      });
      // if (
      //   acceptedcallkeepMap?.cid === call_cid ||
      //   currently_processed_call_cid !== call_cid
      // ) {
      //   console.log("unsubscribing from call's events");
      //   unsubscribe();
      // } else {
      const _closed = closeCallIfNecessary();
      if (_closed) {
        unsubscribe();
      }
      // }
    });
  }
  const voipPushNotification = getVoipPushNotificationLib();
  voipPushNotification.onVoipNotificationCompleted(uuid);
};
