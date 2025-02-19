import { MutableRefObject, useEffect, useRef, useState } from 'react';
import {
  getCallKeepLib,
  getVoipPushNotificationLib,
} from '../../utils/push/libs';

import { AppState, Platform } from 'react-native';
import { StreamVideoRN } from '../../utils';
import {
  useConnectedUser,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { setPushLogoutCallback } from '../../utils/internal/pushLogoutCallback';
import { NativeModules } from 'react-native';
import {
  canAddPushWSSubscriptionsRef,
  shouldCallBeEnded,
} from '../../utils/push/internal/utils';
import {
  pushUnsubscriptionCallbacks$,
  voipPushNotificationCallCId$,
} from '../../utils/push/internal/rxSubjects';
import { RxUtils, StreamVideoClient, getLogger } from '@stream-io/video-client';

const logger = getLogger(['useIosVoipPushEventsSetupEffect']);

/* VoipPushNotificationLib has support for only one listener type at a time
 hence to support login and logout scenario of multiple users we keep of the last count of the listener that was added
 This helps in not removing the listeners when a new user logs in and overrides the last listener
*/
let lastListener = { count: 0 };

function setLogoutCallback(
  client: StreamVideoClient,
  token: string,
  lastVoipTokenRef: MutableRefObject<{ token: string; userId: string }>
) {
  setPushLogoutCallback(async () => {
    lastVoipTokenRef.current = { token: '', userId: '' };
    try {
      await client.removeDevice(token);
    } catch (err) {
      logger(
        'warn',
        'PushLogoutCallback - Failed to remove voip token from stream',
        err
      );
    }
  });
}

/**
 * This hook is used to do the initial setup of listeners
 * for ios voip push notifications.
 */
export const useIosVoipPushEventsSetupEffect = () => {
  const client = useStreamVideoClient();
  const connectedUserId = useConnectedUser()?.id;
  const lastVoipTokenRef = useRef({ token: '', userId: '' });
  const [unsentToken, setUnsentToken] = useState<string>();

  useEffect(() => {
    const pushConfig = StreamVideoRN.getConfig().push;
    //  we need to wait for user to be connected before we can send the push token
    if (
      !pushConfig?.ios.pushProviderName ||
      !client ||
      !connectedUserId ||
      !unsentToken
    ) {
      return;
    }
    logger(
      'debug',
      'Sending unsent voip token to stream as user logged in after token was received, token: ' +
        unsentToken
    );
    client
      .addVoipDevice(unsentToken, 'apn', pushConfig.ios.pushProviderName)
      .then(() => {
        setLogoutCallback(client, unsentToken, lastVoipTokenRef);
        logger(
          'debug',
          'Sent unsent voip token to stream - token: ' + unsentToken
        );
        lastVoipTokenRef.current = {
          token: unsentToken,
          userId: connectedUserId,
        };
        setUnsentToken(undefined);
      })
      .catch((error) => {
        logger('warn', 'Error in sending unsent voip token to stream', error);
      });
  }, [client, connectedUserId, unsentToken]);

  useEffect(() => {
    const pushConfig = StreamVideoRN.getConfig().push;
    if (Platform.OS !== 'ios' || !pushConfig || !client) {
      return;
    }
    const voipPushNotification = getVoipPushNotificationLib();

    // even though we do this natively, we have to still register here again
    // natively this will make sure "register" event for JS is sent with the last push token
    // Necessary if client changed before we got the event here or user logged out and logged in again
    voipPushNotification.registerVoipToken();

    const onTokenReceived = (token: string) => {
      const userId = client.streamClient._user?.id ?? '';
      if (!userId) {
        logger(
          'debug',
          `Skipped sending voip token to stream no user id was present - token: ${token}`
        );
        setUnsentToken(token);
        return;
      }
      const lastVoipToken = lastVoipTokenRef.current;
      if (lastVoipToken.token === token && lastVoipToken.userId === userId) {
        logger(
          'debug',
          `Skipped sending voip token to stream as it is same as last token - token: ${token}, userId: ${userId}`
        );
        return;
      }
      const push_provider_name = pushConfig.ios.pushProviderName;
      if (!push_provider_name) {
        return;
      }
      logger(
        'debug',
        `Sending voip token to stream, token: ${token} userId: ${userId}`
      );
      client
        .addVoipDevice(token, 'apn', push_provider_name)
        .then(() => {
          logger(
            'debug',
            `Sent voip token to stream, token: ${token} userId: ${userId}`
          );
          setLogoutCallback(client, token, lastVoipTokenRef);
          lastVoipTokenRef.current = { token, userId };
        })
        .catch((err) => {
          setUnsentToken(token);
          logger('warn', 'Failed to send voip token to stream', err);
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
    lastListener.count += 1;
    const currentListenerCount = lastListener.count;

    return () => {
      const userId = client.streamClient._user?.id;
      if (currentListenerCount !== lastListener.count) {
        logger(
          'debug',
          'Skipped removing voip event listeners for user: ' + userId
        );
        return;
      }
      logger('debug', 'Voip event listeners are removed for user: ' + userId);
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
  const pushConfig = StreamVideoRN.getConfig().push;
  if (!call_cid || Platform.OS !== 'ios' || !pushConfig) {
    return;
  }
  const client = await pushConfig.createStreamVideoClient();
  if (!client) {
    return;
  }
  const callFromPush = await client.onRingingCall(call_cid);
  let uuid = '';
  try {
    uuid =
      await NativeModules?.StreamVideoReactNative?.getIncomingCallUUid(
        call_cid
      );
  } catch (error) {
    logger('error', 'Error in getting call uuid from native module', error);
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
      receiver_id
    );
    if (mustEndCall) {
      const callkeep = getCallKeepLib();
      logger(
        'debug',
        `callkeep.reportEndCallWithUUID for uuid: ${uuid}, call_cid: ${call_cid}, reason: ${callkeepReason}`
      );
      callkeep.reportEndCallWithUUID(uuid, callkeepReason);
      const voipPushNotification = getVoipPushNotificationLib();
      voipPushNotification.onVoipNotificationCompleted(uuid);
      return true;
    }
    return false;
  }
  const closed = closeCallIfNecessary();
  const canListenToWS = () =>
    canAddPushWSSubscriptionsRef.current && AppState.currentState !== 'active';
  if (!closed && canListenToWS()) {
    const unsubscribe = callFromPush.on('all', (event) => {
      const _canListenToWS = canListenToWS();
      if (!_canListenToWS) {
        logger(
          'debug',
          `unsubscribe due to event callCid: ${call_cid} canListenToWS: ${_canListenToWS}`,
          event
        );
        unsubscribe();
        return;
      }
      const _closed = closeCallIfNecessary();
      if (_closed) {
        logger(
          'debug',
          `unsubscribe due to event callCid: ${call_cid} canListenToWS: ${_canListenToWS} shouldCallBeClosed: ${_closed}`,
          event
        );
        unsubscribe();
      }
    });
    const unsubscriptionCallbacks =
      RxUtils.getCurrentValue(pushUnsubscriptionCallbacks$) ?? [];
    pushUnsubscriptionCallbacks$.next([
      ...unsubscriptionCallbacks,
      unsubscribe,
    ]);
  }
  // send the info to this subject, it is listened by callkeep events
  // callkeep events will then accept/reject the call
  voipPushNotificationCallCId$.next(call_cid);
};
