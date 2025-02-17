import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  BackgroundFiltersProvider,
  Call,
  CallingState,
  CallRequest,
  NoiseCancellationProvider,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  User,
} from '@stream-io/video-react-sdk';
import type { INoiseCancellation } from '@stream-io/audio-filters-web';
import { TranslationLanguages } from 'stream-chat';
import { useCreateStreamChatClient } from '../../hooks';
import { MeetingUI } from '../../components';
import {
  getServerSideCredentialsProps,
  ServerSideCredentialsProps,
} from '../../lib/getServerSideCredentialsProps';
import { useGleap } from '../../hooks/useGleap';
import { useSettings } from '../../context/SettingsContext';
import {
  useAppEnvironment,
  useIsDemoEnvironment,
} from '../../context/AppEnvironmentContext';
import { TourProvider } from '../../context/TourContext';
import appTranslations from '../../translations';
import { customSentryLogger } from '../../helpers/logger';
import {
  defaultRequestTransformers,
  defaultResponseTransformers,
} from '../../helpers/axiosApiTransformers';
import type {
  CreateJwtTokenRequest,
  CreateJwtTokenResponse,
} from '../api/auth/create-token';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const CallRoom = (props: ServerSideCredentialsProps) => {
  const router = useRouter();
  const {
    settings: { language, fallbackLanguage },
  } = useSettings();
  const callId = router.query['callId'] as string;
  const callType = (router.query['type'] as string) || 'default';

  // support for connecting to any application using an API key and user token
  const apiKeyOverride = !!router.query['api_key'];
  const isProntoStaging = useAppEnvironment() === 'pronto-staging';
  const isDemoEnvironment = useIsDemoEnvironment();
  useEffect(() => {
    if (!isDemoEnvironment) return;
    // For backwards compatibility, we need to append `?id=${callId}` to the URL
    // if it's not already there.
    // Otherwise, deep links in the mobile apps won't work.
    const id = router.query['id'] as string | undefined;
    if (id !== callId) {
      router
        .replace({
          pathname: router.pathname,
          query: { ...router.query, id: callId },
        })
        .catch((err) => console.error('Failed to replace router', err));
    }
  }, [callId, isDemoEnvironment, router]);

  const { apiKey, userToken, user, gleapApiKey } = props;

  const environment = useAppEnvironment();
  const fetchAuthDetails = useCallback(
    async (init?: RequestInit) => {
      if (apiKeyOverride) {
        return {
          apiKey,
          token: userToken,
          userId: user.id || '!anon',
        } satisfies CreateJwtTokenResponse;
      }

      const params = {
        user_id: user.id || '!anon',
        environment,
        exp: String(4 * 60 * 60), // 4 hours
      } satisfies CreateJwtTokenRequest;
      return fetch(
        `${basePath}/api/auth/create-token?${new URLSearchParams(params)}`,
        init,
      ).then((res) => res.json() as Promise<CreateJwtTokenResponse>);
    },
    [apiKey, apiKeyOverride, environment, user.id, userToken],
  );

  const tokenProvider = useCallback(
    () => fetchAuthDetails().then((auth) => auth.token),
    [fetchAuthDetails],
  );

  const [client, setClient] = useState<StreamVideoClient>();
  useEffect(() => {
    const _client = new StreamVideoClient({
      apiKey,
      user,
      token: userToken,
      tokenProvider,
      options: {
        baseURL: process.env.NEXT_PUBLIC_STREAM_API_URL,
        logLevel: 'debug',
        logger: customSentryLogger({ enableVerboseLogging: isProntoStaging }),
        transformRequest: defaultRequestTransformers,
        transformResponse: defaultResponseTransformers,
      },
    });
    setClient(_client);

    // @ts-ignore - for debugging
    window.client = _client;

    return () => {
      _client
        .disconnectUser()
        .catch((e) => console.error('Failed to disconnect user', e));
      setClient(undefined);
      // @ts-ignore - for debugging
      window.client = undefined;
    };
  }, [apiKey, isProntoStaging, tokenProvider, user, userToken]);

  const chatClient = useCreateStreamChatClient({
    apiKey,
    tokenOrProvider: tokenProvider,
    userData: {
      id: '!anon',
      ...(user as Omit<User, 'type' | 'push_notifications'>),
      language: user.language as TranslationLanguages | undefined,
    },
  });

  const [call, setCall] = useState<Call>();
  useEffect(() => {
    if (!client) return;
    const _call = client.call(callType, callId);
    setCall(_call);

    // @ts-ignore - for debugging
    window.call = _call;

    return () => {
      if (_call.state.callingState !== CallingState.LEFT) {
        _call.leave().catch((e) => console.error('Failed to leave call', e));
        setCall(undefined);
        // @ts-ignore - for debugging
        window.call = undefined;
      }
    };
  }, [callId, callType, client]);

  useEffect(() => {
    if (!call) return;
    // "restricted" is a special call type that only allows
    // `call_member` role to join the call
    const data: CallRequest =
      callType === 'restricted'
        ? { members: [{ user_id: user.id || '!anon', role: 'call_member' }] }
        : {};

    call.getOrCreate({ data }).catch((err) => {
      console.error(`Failed to get or create call`, err);
    });
  }, [call, callType, user.id]);

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
  const [noiseCancellation, setNoiseCancellation] =
    useState<INoiseCancellation>();
  const ncLoader = useRef<Promise<void>>();
  useEffect(() => {
    const load = (ncLoader.current || Promise.resolve())
      .then(() => import('@stream-io/audio-filters-web'))
      .then(({ NoiseCancellation }) => {
        // const modelsPath = `${basePath}/krispai/models`;
        // const nc = new NoiseCancellation({ basePath: modelsPath });
        const nc = new NoiseCancellation();
        setNoiseCancellation(nc);
      });
    return () => {
      ncLoader.current = load.then(() => setNoiseCancellation(undefined));
    };
  }, []);

  if (!client || !call) return null;

  return (
    <>
      <Head>
        <title>Stream Calls: {callId}</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>

      <StreamVideo
        client={client}
        language={language}
        fallbackLanguage={fallbackLanguage}
        translationsOverrides={appTranslations}
      >
        <StreamCall call={call}>
          <TourProvider>
            <BackgroundFiltersProvider
              basePath={`${basePath}/tf`}
              backgroundImages={[
                `${basePath}/backgrounds/amsterdam-1.jpg`,
                `${basePath}/backgrounds/amsterdam-2.jpg`,
                `${basePath}/backgrounds/boulder-1.jpg`,
                `${basePath}/backgrounds/boulder-2.jpg`,
                `${basePath}/backgrounds/gradient-1.jpg`,
                `${basePath}/backgrounds/gradient-2.jpg`,
                `${basePath}/backgrounds/gradient-3.jpg`,
              ]}
            >
              {noiseCancellation && (
                <NoiseCancellationProvider
                  noiseCancellation={noiseCancellation}
                >
                  <MeetingUI chatClient={chatClient} />
                </NoiseCancellationProvider>
              )}
            </BackgroundFiltersProvider>
          </TourProvider>
        </StreamCall>
      </StreamVideo>
    </>
  );
};

export default CallRoom;

export const getServerSideProps = getServerSideCredentialsProps;
