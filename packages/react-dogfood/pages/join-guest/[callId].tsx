import { useRouter } from 'next/router';
import { GetServerSidePropsContext } from 'next';
import { createToken } from '../../helpers/jwt';
import {
  StreamVideo,
  useCreateStreamVideoClient,
} from '@stream-io/video-react-sdk';
import { UserInput } from '@stream-io/video-client';
import { useMemo } from 'react';
import Head from 'next/head';
import { StreamMeeting } from '@stream-io/video-react-sdk';
import { MeetingUI } from '../../components/MeetingUI';

type JoinCallProps = {
  user: UserInput;
  userToken: string;
  coordinatorRpcUrl: string;
  coordinatorWsUrl: string;
  apiKey: string;
};

const JoinCallGuest = (props: JoinCallProps) => {
  const router = useRouter();
  const callId = router.query['callId'] as string;
  const callType = (router.query['type'] as string) || 'default';

  const { userToken, user, coordinatorRpcUrl, coordinatorWsUrl, apiKey } =
    props;
  const loggedInUser = useMemo(
    () => ({
      ...user,
      customJson: new Uint8Array(),
    }),
    [user],
  );

  const client = useCreateStreamVideoClient({
    coordinatorRpcUrl,
    coordinatorWsUrl,
    apiKey,
    token: userToken,
    user: loggedInUser,
  });

  if (!client) {
    return <h2>Connecting...</h2>;
  }
  return (
    <div style={{ flexGrow: 1, minHeight: 0 }}>
      <Head>
        <title>Stream Calls Guests: {callId}</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <StreamVideo client={client}>
        <StreamMeeting
          currentUser={loggedInUser.name}
          callId={callId}
          callType={callType}
          autoJoin
        >
          <MeetingUI />
        </StreamMeeting>
      </StreamVideo>
    </div>
  );
};

export default JoinCallGuest;

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const coordinatorRpcUrl = process.env.STREAM_COORDINATOR_RPC_URL;
  const coordinatorWsUrl = process.env.STREAM_COORDINATOR_WS_URL;
  const apiKey = process.env.STREAM_API_KEY as string;
  const secretKey = process.env.STREAM_SECRET_KEY as string;
  const accessSecret = process.env.STREAM_PUBLIC_ACCESS_SECRET_TOKEN as string;

  if (!accessSecret) {
    throw new Error(
      `Please configure STREAM_PUBLIC_ACCESS_SECRET_TOKEN env variable`,
    );
  }

  const accessToken = context.query[`access_token`] as string | undefined;
  if (!accessToken || accessToken !== accessSecret) {
    console.error(`access_token is not provided or it is invalid`);
    return {
      notFound: true,
    };
  }

  const userId = context.query[`user_id`] as string | undefined;
  if (!userId) {
    console.log('No user id provided, redirecting to 404 page.');
    return {
      notFound: true,
    };
  }
  // Otherwise, SDP parse errors with MSID
  const userName = userId.replaceAll(' ', '_');
  return {
    props: {
      coordinatorRpcUrl,
      coordinatorWsUrl,
      apiKey,
      userToken: createToken(userName, secretKey, {
        exp: String(120 * 60), // token expires in 120 minutes
      }),
      user: {
        id: userName,
        name: userName,
        role: 'guest',
        teams: ['stream-io/guests'],
        imageUrl: `https://getstream.io/random_svg/?id=${userName}&name=${userName}`,
        // customJson: new Uint8Array() // can't be serialized to JSON
      },
    } as JoinCallProps,
  };
};
