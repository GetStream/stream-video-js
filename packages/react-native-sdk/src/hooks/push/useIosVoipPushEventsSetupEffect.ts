import { type MutableRefObject, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { StreamVideoRN } from '../../utils';
import { onVoipNotificationReceived } from '../../utils/push/internal/ios';
import {
  useConnectedUser,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { setPushLogoutCallback } from '../../utils/internal/pushLogoutCallback';
import { StreamVideoClient, videoLoggerSystem } from '@stream-io/video-client';
import { getCallingxLibIfAvailable } from '../../utils/push/libs';

const logger = videoLoggerSystem.getLogger('useIosVoipPushEventsSetupEffect');

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
      logger.debug('PushLogoutCallback - Removed voip token', token);
    } catch (err) {
      logger.warn('PushLogoutCallback - Failed to remove voip token', err);
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

    logger.debug(
      `Sending voip token as user logged in after token was received, token: ${tokenToSend}`,
    );

    client
      .addVoipDevice(tokenToSend, 'apn', pushProviderName)
      .then(() => {
        logger.debug(`Sent voip token: ${tokenToSend}`);
        setLogoutCallback(client, tokenToSend, lastVoipTokenRef);
        lastVoipTokenRef.current = {
          token: tokenToSend,
          userId: connectedUserId,
        };
        setUnsentToken(undefined);
      })
      .catch((error) => {
        logger.warn('Error in sending unsent voip token', error);
      });
  }, [client, connectedUserId, unsentToken]);

  useEffect(() => {
    const pushConfig = StreamVideoRN.getConfig().push;
    const pushProviderName = pushConfig?.ios.pushProviderName;
    const callingx = getCallingxLibIfAvailable();

    if (Platform.OS !== 'ios' || !client || !pushProviderName || !callingx) {
      return;
    }

    const onTokenReceived = (token: string) => {
      const userId = client.streamClient._user?.id ?? '';
      if (client.streamClient.anonymous || !token || !userId) {
        const reason = client.streamClient.anonymous
          ? 'anonymous user'
          : !token
            ? 'no token was present (possibly using a simulator)'
            : 'no user id was present';
        logger.debug(`Skipped sending voip token: ${reason}`);
        setUnsentToken(token);
        return;
      }

      const lastVoipToken = lastVoipTokenRef.current;
      if (lastVoipToken.token === token && lastVoipToken.userId === userId) {
        logger.debug(
          `Skipped sending voip token as it is same as last token - token: ${token}, userId: ${userId}`,
        );
        return;
      }

      logger.debug(`Sending voip token: ${token} userId: ${userId}`);
      client
        .addVoipDevice(token, 'apn', pushProviderName)
        .then(() => {
          logger.debug(`Sent voip token: ${token} userId: ${userId}`);
          setLogoutCallback(client, token, lastVoipTokenRef);
          lastVoipTokenRef.current = { token, userId };
        })
        .catch((err) => {
          setUnsentToken(token);
          logger.warn(
            `Failed to send voip token: ${token} userId: ${userId}`,
            err,
          );
        });
    };
    // fired when PushKit give us the latest token
    const voipRegisterListener = callingx.addEventListener(
      'voipNotificationsRegistered',
      ({ token }) => {
        onTokenReceived(token);
      },
    );

    // this will return events that were fired before js bridge initialized
    callingx.getInitialVoipEvents().forEach(({ eventName, params }) => {
      if (eventName === 'voipNotificationsRegistered' && 'token' in params) {
        onTokenReceived(params.token);
      } else if (eventName === 'voipNotificationReceived') {
        onVoipNotificationReceived(params, pushConfig);
      }
    });

    callingx.registerVoipToken();

    lastListener.count += 1;
    const currentListenerCount = lastListener.count;

    return () => {
      const userId = client.streamClient._user?.id;
      if (currentListenerCount !== lastListener.count) {
        logger.debug(
          `Skipped removing voip event listeners for user: ${userId}`,
        );
        return;
      }
      logger.debug(`Voip event listeners are removed for user: ${userId}`);
      voipRegisterListener.remove();
    };
  }, [client]);
};
