import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Call,
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
import appTranslations from '../../translations';
import { customSentryLogger } from '../../helpers/logger';

const CallRoom = (props: ServerSideCredentialsProps) => {
  const router = useRouter();
  const {
    settings: { language },
  } = useSettings();
  const callId = router.query['callId'] as string;
  const callType = (router.query['type'] as string) || 'default';
  const { userToken, user, apiKey, gleapApiKey } = props;
  const tokenProvider = useCallback(async () => {
    const { token } = await fetch(
      '/api/auth/create-token?' +
        new URLSearchParams({
          api_key: apiKey,
          user_id: user.id || '!anon',
          exp: String(4 * 60 * 60), // 4 hours
        }),
    ).then((res) => res.json());
    return token as string;
  }, [apiKey, user.id]);

  const [client, setClient] = useState<StreamVideoClient>();
  useEffect(() => {
    const _client = new StreamVideoClient({
      apiKey,
      user,
      tokenProvider,
      options: {
        baseURL: process.env.NEXT_PUBLIC_STREAM_API_URL,
        logLevel: 'debug',
        logger: customSentryLogger,
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
  }, [apiKey, tokenProvider, user]);

  const chatClient = useCreateStreamChatClient({
    apiKey,
    tokenOrProvider: userToken,
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
      _call.leave();
      setCall(undefined);
      // @ts-ignore - for debugging
      window.call = undefined;
    };
  }, [callId, callType, client]);

  useEffect(() => {
    call?.getOrCreate().catch((err) => {
      console.error(`Failed to get or create call`, err);
    });
  }, [call]);

  useGleap(gleapApiKey, client, user);

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
        translationsOverrides={appTranslations}
      >
        <StreamCall call={call}>
          <MeetingUI chatClient={chatClient} />
        </StreamCall>
      </StreamVideo>
    </>
  );
};

export default CallRoom;

export const getServerSideProps = getServerSideCredentialsProps;
