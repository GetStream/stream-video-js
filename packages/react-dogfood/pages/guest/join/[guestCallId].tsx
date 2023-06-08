import { GetServerSidePropsContext } from 'next';
import {
  Call,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  User,
  UserResponse,
} from '@stream-io/video-react-sdk';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { MeetingUI } from '../../../components';
import { createToken } from '../../../helpers/jwt';
import { useEffect, useState } from 'react';
import { useGleap } from '../../../hooks/useGleap';

type GuestCallRoomProps = {
  user: UserResponse;
  apiKey: string;
  token: string;
  gleapApiKey?: string;
};

export default function GuestCallRoom(props: GuestCallRoomProps) {
  const { apiKey, user, token, gleapApiKey } = props;

  const router = useRouter();
  const callId = router.query['guestCallId'] as string;
  const callType = (router.query['type'] as string) || 'default';
  const mode = (router.query['mode'] as 'anon' | 'guest') || 'anon';
  const guestUserId = (router.query['guest_user_id'] as string) || 'Guest';

  const [userToConnect, setUserToConnect] = useState(user);
  const [tokenToUse, setTokenToUse] = useState(token);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [client] = useState<StreamVideoClient>(
    () => new StreamVideoClient(apiKey),
  );
  const [connectedUser, setConnectedUser] = useState<User | undefined>(
    undefined,
  );
  const [call] = useState<Call>(() => client.call(callType, callId));

  useEffect(() => {
    const connectRequest = isAnonymous
      ? client.connectAnonymousUser(userToConnect, tokenToUse)
      : client.connectUser(userToConnect, tokenToUse);
    connectRequest
      .then(() => setConnectedUser(userToConnect))
      .catch((err) => {
        console.error(`Failed to establish connection`, err);
      });
    return () => {
      client.disconnectUser().then(() => setConnectedUser(undefined));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, userToConnect?.id, tokenToUse, isAnonymous]);

  useEffect(() => {
    if (mode !== 'guest') return;
    client
      .createGuestUser({
        user: {
          id: guestUserId,
          name: guestUserId,
          role: 'guest',
        },
      })
      .then((guestUser) => {
        setUserToConnect(guestUser.user);
        setTokenToUse(guestUser.access_token);
        setIsAnonymous(false);
      })
      .catch((err) => {
        console.error('Error creating guest user', err);
      });
  }, [client, guestUserId, mode]);

  useEffect(() => {
    if (!connectedUser) return;
    call.getOrCreate().catch((err) => {
      console.error(`Failed to get or create call`, err);
    });
  }, [call, connectedUser]);

  useGleap(gleapApiKey, client, userToConnect);
  return (
    <>
      <Head>
        <title>Stream Calls (Guest): {callId}</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <StreamVideo client={client}>
        <StreamCall call={call}>
          <MeetingUI enablePreview={mode !== 'anon'} />
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
  const user: UserResponse = {
    id: `anonymous-${Math.random().toString(36).substring(2, 15)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    role: 'guest',
    teams: [],
    custom: {},
  };

  // anonymous user tokens must have "!anon" as the user_id
  const token = createToken('!anon', secretKey, {
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
