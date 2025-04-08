import { type MutableRefObject, useEffect, useRef, useState } from 'react';
import { getVoipPushNotificationLib } from '../../utils/push/libs';

import { Platform } from 'react-native';
import { StreamVideoRN } from '../../utils';
import { onVoipNotificationReceived } from '../../utils/push/internal/ios';
import {
  useConnectedUser,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { setPushLogoutCallback } from '../../utils/internal/pushLogoutCallback';
import { getLogger, StreamVideoClient } from '@stream-io/video-client';

const logger = getLogger(['useIosVoipPushEventsSetupEffect']);

/* VoipPushNotificationLib has support for only one listener type at a time
 hence to support login and logout scenario of multiple users we keep of the last count of the listener that was added
 This helps in not removing the listeners when a new user logs in and overrides the last listener
*/
const lastListener = { count: 0 };

function setLogoutCallback(
  client: StreamVideoClient,
  token: string,
  lastVoipTokenRef: MutableRefObject<{ token: string; userId: string }>,
) {
  setPushLogoutCallback(async () => {
    lastVoipTokenRef.current = { token: '', userId: '' };
    try {
      await client.removeDevice(token);
    } catch (err) {
      logger('warn', 'PushLogoutCallback - Failed to remove voip token', err);
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

  // this effect is used to send the unsent token to the Stream backend
  useEffect(() => {
    const { pushProviderName } = StreamVideoRN.getConfig().push?.ios || {};
    //  we need to wait for user to be connected before we can send the push token
    if (!pushProviderName || !client || !connectedUserId) return;

    // When switching users, on the same `client` instance (disconnect/connect)
    // it is highly likely that the token has already been sent
    // to the Stream backend but bound to the previous user.
    //
    // Upon changing the user, we need to send the token again
    // to the Stream backend to bind it with the new user.
    //
    // Here we also handle the case where the device token arrived earlier.
    const current = lastVoipTokenRef.current;
    const tokenToSend =
      connectedUserId !== current.userId && current.token
        ? current.token
        : unsentToken;

    if (!tokenToSend) return;

    logger(
      'debug',
      `Sending voip token as user logged in after token was received, token: ${tokenToSend}`,
    );

    client
      .addVoipDevice(tokenToSend, 'apn', pushProviderName)
      .then(() => {
        logger('debug', `Sent voip token: ${tokenToSend}`);
        setLogoutCallback(client, tokenToSend, lastVoipTokenRef);
        lastVoipTokenRef.current = {
          token: tokenToSend,
          userId: connectedUserId,
        };
        setUnsentToken(undefined);
      })
      .catch((error) => {
        logger('warn', 'Error in sending unsent voip token', error);
      });
  }, [client, connectedUserId, unsentToken]);

  useEffect(() => {
    const pushConfig = StreamVideoRN.getConfig().push;
    const pushProviderName = pushConfig?.ios.pushProviderName;
    if (Platform.OS !== 'ios' || !client || !pushProviderName) {
      return;
    }
    if (!pushConfig.android.incomingCallChannel) {
      // TODO: remove this check and find a better way once we have telecom integration for android
      logger(
        'debug',
        'android incomingCallChannel is not defined, so skipping the useIosVoipPushEventsSetupEffect',
      );
      return;
    }

    const voipPushNotification = getVoipPushNotificationLib();

    // even though we do this natively, we have to still register here again
    // natively this will make sure "register" event for JS is sent with the last push token
    // Necessary if client changed before we got the event here or user logged out and logged in again
    voipPushNotification.registerVoipToken();

    const onTokenReceived = (token: string) => {
      const userId = client.streamClient._user?.id ?? '';
      if (client.streamClient.anonymous || !token || !userId) {
        const reason = client.streamClient.anonymous
          ? 'anonymous user'
          : !token
            ? 'no token was present (possibly using a simulator)'
            : 'no user id was present';
        logger('debug', `Skipped sending voip token: ${reason}`);
        setUnsentToken(token);
        return;
      }

      const lastVoipToken = lastVoipTokenRef.current;
      if (lastVoipToken.token === token && lastVoipToken.userId === userId) {
        logger(
          'debug',
          `Skipped sending voip token as it is same as last token - token: ${token}, userId: ${userId}`,
        );
        return;
      }

      logger('debug', `Sending voip token: ${token} userId: ${userId}`);
      client
        .addVoipDevice(token, 'apn', pushProviderName)
        .then(() => {
          logger('debug', `Sent voip token: ${token} userId: ${userId}`);
          setLogoutCallback(client, token, lastVoipTokenRef);
          lastVoipTokenRef.current = { token, userId };
        })
        .catch((err) => {
          setUnsentToken(token);
          logger(
            'warn',
            `Failed to send voip token: ${token} userId: ${userId}`,
            err,
          );
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
      for (const voipPushEvent of events) {
        const { name, data } = voipPushEvent;
        if (name === 'RNVoipPushRemoteNotificationsRegisteredEvent') {
          onTokenReceived(data);
        } else if (name === 'RNVoipPushRemoteNotificationReceivedEvent') {
          onVoipNotificationReceived(data, pushConfig);
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
          `Skipped removing voip event listeners for user: ${userId}`,
        );
        return;
      }
      logger('debug', `Voip event listeners are removed for user: ${userId}`);
      voipPushNotification.removeEventListener('didLoadWithEvents');
      voipPushNotification.removeEventListener('register');
    };
  }, [client]);
};
