import {
  StreamVideo,
  StreamVideoClient,
  User,
} from '@stream-io/video-react-sdk';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { TranslationLanguages } from 'stream-chat';

import { CallScope } from '../../components/CallScope';
import { LobbyE2EEContext } from '../../context/LobbyE2EEContext';
import {
  isE2EEEnvironment,
  useAppEnvironment,
} from '../../context/AppEnvironmentContext';
import { useSettings } from '../../context/SettingsContext';
import { getClient } from '../../helpers/client';
import { useCreateStreamChatClient, useLobbyCall } from '../../hooks';
import { useGleap } from '../../hooks/useGleap';
import {
  getServerSideCredentialsPropsWithOptions,
  ServerSideCredentialsProps,
} from '../../lib/getServerSideCredentialsProps';
import appTranslations from '../../translations';

const CallRoom = (props: ServerSideCredentialsProps) => {
  const router = useRouter();
  const {
    settings: { language, fallbackLanguage, segmentationModel },
  } = useSettings();
  const callId = router.query['callId'] as string;
  const callType = (router.query['type'] as string) || 'default';
  const useLocalCoordinator = router.query['use_local_coordinator'] === 'true';
  const coordinatorUrl = useLocalCoordinator
    ? 'http://localhost:3030/video'
    : (router.query['coordinator_url'] as string | undefined);
  const useLegacyFilters = router.query['useLegacyFilters'] === 'true';

  const { apiKey, userToken, user, gleapApiKey } = props;

  const environment = useAppEnvironment();

  // E2EE is limited to the `pronto` / `pronto-staging` environments for now.
  // When a shared key is present in the URL, the initial call must be *created*
  // end-to-end encrypted - otherwise the backend rejects the (e2ee: true) join.
  // See lib/queryConfigParams.
  const initialEncryptionKey = router.query['encryption_key'] as
    | string
    | undefined;
  const e2eeEnabled = isE2EEEnvironment(environment) && !!initialEncryptionKey;

  const [client, setClient] = useState<StreamVideoClient>();
  useEffect(() => {
    const _client = getClient(
      { apiKey, user, userToken, coordinatorUrl },
      environment,
    );
    setClient(_client);
    window.client = _client;

    return () => {
      setClient(undefined);
      window.client = undefined;
    };
  }, [apiKey, coordinatorUrl, environment, user, userToken]);

  const chatClient = useCreateStreamChatClient({
    apiKey,
    tokenOrProvider: userToken,
    userData: {
      id: '!anon',
      ...(user as Omit<User, 'type' | 'push_notifications'>),
      language: user.language as TranslationLanguages | undefined,
    },
  });

  const { call, callError, e2eeControls } = useLobbyCall({
    client,
    callId,
    callType,
    userId: user.id,
    e2eeEnabled,
    initialEncryptionKey,
  });

  // apple-itunes-app meta-tag is used to open the app from the browser
  // we need to update the app-argument to the current URL so that the app
  // can open the correct call
  useEffect(() => {
    const appleItunesAppMeta = document
      .getElementsByTagName('meta')
      .namedItem('apple-itunes-app');
    if (appleItunesAppMeta) {
      appleItunesAppMeta.setAttribute(
        'content',
        `app-id=1644313060, app-argument=${window.location.href
          .replace('http://', 'streamvideo://')
          .replace('https://', 'streamvideo://')}`,
      );
    }
  }, []);

  useGleap(gleapApiKey, client, call, user);

  if (!client || !call) return null;

  if (callError) {
    return (
      <div className="str-video__call">
        <div className="str-video__call__loading-screen">
          <div className="rd__call-not-found">
            Call not found.
            <br />
            It may have already ended, or the call ID is incorrect.
            <button
              className="rd__button rd__button--secondary rd__button--large rd__call-not-found-button"
              onClick={() => {
                router.push('/');
              }}
            >
              Join another call
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <StreamVideo
      client={client}
      language={language}
      fallbackLanguage={fallbackLanguage}
      translationsOverrides={appTranslations}
    >
      <LobbyE2EEContext.Provider value={e2eeControls}>
        <CallScope
          call={call}
          chatClient={chatClient}
          useLegacyFilters={useLegacyFilters}
          segmentationModel={segmentationModel}
        />
      </LobbyE2EEContext.Provider>
    </StreamVideo>
  );
};

export default CallRoom;

export const getServerSideProps = getServerSideCredentialsPropsWithOptions({
  signInAutomatically: true,
});
