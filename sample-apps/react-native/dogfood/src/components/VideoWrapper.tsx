import React, { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import {
  JoinCallResponse,
  logToConsole,
  StreamVideo,
  StreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../contexts/AppContext';
import { createToken } from '../modules/helpers/createToken';
import translations from '../translations';
import { useCustomTheme } from '../theme';
import axios, { AxiosResponseTransformer } from 'axios';
import { Alert } from 'react-native';

export const VideoWrapper = ({ children }: PropsWithChildren<{}>) => {
  const userId = useAppGlobalStoreValue((store) => store.userId);
  const userName = useAppGlobalStoreValue((store) => store.userName);
  const userImageUrl = useAppGlobalStoreValue((store) => store.userImageUrl);
  const appEnvironment = useAppGlobalStoreValue(
    (store) => store.appEnvironment,
  );
  const useLocalSfu = useAppGlobalStoreValue((store) => store.useLocalSfu);
  const themeMode = useAppGlobalStoreValue((store) => store.themeMode);
  const localIpAddress = useAppGlobalStoreValue(
    (store) => store.localIpAddress,
  );
  const customTheme = useCustomTheme(themeMode);
  const setState = useAppGlobalStoreSetState();

  const [videoClient, setVideoClient] = useState<StreamVideoClient | undefined>(
    undefined,
  );

  const user = useMemo(
    () => ({
      id: userId,
      name: userName,
      image: userImageUrl,
    }),
    [userId, userName, userImageUrl],
  );

  useEffect(() => {
    let _videoClient: StreamVideoClient | undefined;
    let unsubscribeCallRejected: (() => void) | undefined;
    const run = async () => {
      const fetchAuthDetails = async () => {
        return await createToken({ user_id: user.id }, appEnvironment);
      };
      const { apiKey, token } = await fetchAuthDetails();
      const tokenProvider = () => fetchAuthDetails().then((auth) => auth.token);
      setState({ apiKey });
      _videoClient = StreamVideoClient.getOrCreateInstance({
        apiKey,
        user,
        token,
        tokenProvider,
        options: {
          rejectCallWhenBusy: true,
          logLevel: 'debug',
          logger: (level, message, ...args) => {
            if (
              message.startsWith('[Dispatcher]') &&
              /audioLevelChanged|dominantSpeakerChanged/.test(message)
            ) {
              // reduce noise from audioLevelChanged and dominantSpeakerChanged events
              return;
            }

            // Call the SDK's default log method
            logToConsole(level, message, ...args);
          },
          transformResponse: useLocalSfu
            ? getCustomSfuResponseTransformers(localIpAddress)
            : undefined,
        },
      });

      unsubscribeCallRejected = _videoClient?.on(
        'call.rejected',
        async (event) => {
          const isCallCreatedByMe =
            event.call.created_by.id === _videoClient?.state.connectedUser?.id;
          const calleeName = event.user.name ?? event.user.id;
          const isCalleeBusy = isCallCreatedByMe && event.reason === 'busy';

          if (isCalleeBusy) {
            Alert.alert('Call rejected', `User: ${calleeName} is busy.`);
          }
        },
      );

      setVideoClient(_videoClient);
    };
    if (user.id) {
      run().catch((error) => {
        console.error('Error creating video client', error);
      });
    }

    return () => {
      unsubscribeCallRejected?.();
      _videoClient?.disconnectUser();
      setVideoClient(undefined);
    };
  }, [appEnvironment, setState, useLocalSfu, localIpAddress, user]);

  if (!videoClient) {
    return null;
  }

  return (
    <StreamVideo
      client={videoClient}
      style={customTheme}
      translationsOverrides={translations}
    >
      {children}
    </StreamVideo>
  );
};

const getCustomSfuResponseTransformers = (localIpAddress: string) =>
  (axios.defaults.transformResponse as AxiosResponseTransformer[]).concat(
    function (data) {
      /**
       * This transformer is used to override the SFU URL and WS URL returned by the
       * backend with the ones provided in the textbox.
       *
       * Useful for testing with a local SFU.
       *
       * Note: it needs to be declared as a `function` instead of an arrow function
       * as it executes in the context of the current axios instance.
       */
      const sfuUrlOverride = `http://${localIpAddress}:3031/twirp`;
      const sfuWsUrlOverride = `ws://${localIpAddress}:3031/ws`;
      if (sfuUrlOverride && sfuWsUrlOverride && this.url?.endsWith('/join')) {
        (data as JoinCallResponse).credentials.server = {
          ...(data as JoinCallResponse).credentials.server,
          url: sfuUrlOverride,
          ws_endpoint: sfuWsUrlOverride,
          edge_name: sfuUrlOverride,
        };
        return data;
      }
    },
  );
