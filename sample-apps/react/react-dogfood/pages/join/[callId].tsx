import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Call,
  CallingState,
  CallRequest,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  User,
} from '@stream-io/video-react-sdk';
import Head from 'next/head';
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

  const { user, gleapApiKey } = props;

  const environment = useAppEnvironment();
  const fetchAuthDetails = useCallback(
    async (init?: RequestInit) => {
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
    [environment, user.id],
  );

  const tokenProvider = useCallback(
    () => fetchAuthDetails().then((auth) => auth.token),
    [fetchAuthDetails],
  );

  const [credentials, setCredentials] = useState<CreateJwtTokenResponse>();
  useEffect(() => {
    const abortController = new AbortController();
    fetchAuthDetails({ signal: abortController.signal })
      .then((data) => setCredentials(data))
      .catch((err) => console.log('Failed to fetch auth details', err));
    return () => abortController.abort();
  }, [fetchAuthDetails]);

  const [client, setClient] = useState<StreamVideoClient>();
  useEffect(() => {
    if (!credentials) return;
    const _client = new StreamVideoClient({
      apiKey: credentials.apiKey,
      user,
      tokenProvider,
      options: {
        baseURL: process.env.NEXT_PUBLIC_STREAM_API_URL,
        logLevel: 'debug',
        logger: customSentryLogger,
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
  }, [credentials, tokenProvider, user]);

  const chatClient = useCreateStreamChatClient({
    apiKey: credentials?.apiKey,
    tokenOrProvider: tokenProvider,
    userData: { id: '!anon', ...(user as Omit<User, 'type'>) },
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
            <MeetingUI chatClient={chatClient} />
          </TourProvider>
        </StreamCall>
      </StreamVideo>
    </>
  );
};

export default CallRoom;

export const getServerSideProps = getServerSideCredentialsProps;
