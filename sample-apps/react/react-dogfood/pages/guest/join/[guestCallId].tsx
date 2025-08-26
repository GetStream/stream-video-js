import type { INoiseCancellation } from '@stream-io/audio-filters-web';
import {
  BackgroundFiltersProvider,
  Call,
  CallingState,
  NoiseCancellationProvider,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  useCallStateHooks,
  User,
  UserResponse,
} from '@stream-io/video-react-sdk';
import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { MeetingUI } from '../../../components';
import { type UserMode } from '../../../components/Lobby';
import { useAppEnvironment } from '../../../context/AppEnvironmentContext';
import { getClient } from '../../../helpers/client';
import { createToken } from '../../../helpers/jwt';
import { useGleap } from '../../../hooks/useGleap';

type GuestCallRoomProps = {
  user: UserResponse;
  apiKey: string;
  token: string;
  gleapApiKey?: string;
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const HeadComponent = ({ callId }: { callId: string }) => {
  const { useCallCustomData } = useCallStateHooks();
  const customData = useCallCustomData();

  return (
    <Head>
      <title>Stream Calls (Guest): {customData.name || callId}</title>
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
    </Head>
  );
};

export default function GuestCallRoom(props: GuestCallRoomProps) {
  const { apiKey, user, token, gleapApiKey } = props;
  const environment = useAppEnvironment();

  const router = useRouter();
  const callId = router.query['guestCallId'] as string;
  const callType = (router.query['type'] as string) || 'default';
  const mode = (router.query['mode'] as UserMode) || 'anon';
  const guestUserId = (router.query['guest_user_id'] as string) || 'Guest';

  const [client, setClient] = useState<StreamVideoClient>();
  useEffect(() => {
    const userToConnect: User =
      mode === 'anon'
        ? { type: 'anonymous' }
        : { id: guestUserId, name: guestUserId, type: 'guest' };
    const tokenToUse = mode === 'anon' ? token : undefined;
    const _client = getClient(
      { apiKey, user: userToConnect, userToken: tokenToUse },
      environment,
    );
    setClient(_client);

    window.client = _client;

    return () => {
      _client
        .disconnectUser()
        .catch((e) => console.error('Failed to disconnect user', e));
      setClient(undefined);
    };
  }, [apiKey, environment, guestUserId, mode, token]);

  const [call, setCall] = useState<Call>();
  useEffect(() => {
    const _call = client?.call(callType, callId, { reuseInstance: true });
    setCall(_call);

    window.call = _call;

    return () => {
      if (_call?.state.callingState !== CallingState.LEFT) {
        _call?.leave();
      }
      setCall(undefined);
    };
  }, [client, callType, callId]);

  useEffect(() => {
    call?.getOrCreate().catch((err) => {
      console.error(`Failed to get or create call`, err);
    });
  }, [call]);

  useGleap(gleapApiKey, client, call, user);

  const [noiseCancellation, setNoiseCancellation] =
    useState<INoiseCancellation>();
  const ncLoader = useRef<Promise<void>>(undefined);
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

  if (!client || !call) {
    return null;
  }
  return (
    <>
      <StreamVideo client={client}>
        <StreamCall call={call}>
          <HeadComponent callId={callId} />
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
              <NoiseCancellationProvider noiseCancellation={noiseCancellation}>
                <MeetingUI mode={mode} />
              </NoiseCancellationProvider>
            )}
          </BackgroundFiltersProvider>
        </StreamCall>
      </StreamVideo>
    </>
  );
}

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const callId = context.query['guestCallId'] as string;
  const callType = (context.query['type'] as string) || 'default';

  const apiKey = process.env.STREAM_API_KEY as string;
  const secretKey = process.env.STREAM_SECRET_KEY as string;
  const gleapApiKey = (process.env.GLEAP_API_KEY as string | undefined) || null;
  const user: User = {
    id: `anonymous-${Math.random().toString(36).substring(2, 15)}`,
    custom: {},
    language: '',
  };

  // anonymous user tokens must have "!anon" as the user_id
  const token = await createToken('!anon', apiKey, secretKey, {
    user_id: '!anon',
    call_cids: [`${callType}:${callId}`],
  });

  return {
    props: {
      user,
      token,
      apiKey,
      gleapApiKey,
    },
  };
};
