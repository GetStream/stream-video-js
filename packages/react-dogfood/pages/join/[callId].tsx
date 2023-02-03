import { useRouter } from 'next/router';
import { authOptions } from '../api/auth/[...nextauth]';
import { unstable_getServerSession } from 'next-auth';
import { GetServerSidePropsContext } from 'next';
import { createToken } from '../../helpers/jwt';
import {
  StreamVideo,
  StreamMeeting,
  useCreateStreamVideoClient,
} from '@stream-io/video-react-sdk';
import Head from 'next/head';
import { User } from '@stream-io/video-client';
import { MeetingUI } from '../../components/MeetingUI';

type JoinCallProps = {
  user: User;
  userToken: string;
  coordinatorRpcUrl: string;
  apiKey: string;
};

const JoinCall = (props: JoinCallProps) => {
  const router = useRouter();
  const callId = router.query['callId'] as string;
  const callType = (router.query['type'] as string) || 'default';

  const { userToken, user, coordinatorRpcUrl, apiKey } = props;
  const client = useCreateStreamVideoClient({
    coordinatorRpcUrl,
    apiKey,
    token: userToken,
    user,
  });

  if (!client) {
    return <h2>Connecting...</h2>;
  }
  return (
    <div style={{ flexGrow: 1, minHeight: 0 }}>
      <Head>
        <title>Stream Calls: {callId}</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <StreamVideo client={client}>
        <StreamMeeting
          currentUser={user.name}
          callId={callId}
          callType={callType}
        >
          <MeetingUI />
        </StreamMeeting>
      </StreamVideo>
    </div>
  );
};

export default JoinCall;

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions,
  );

  if (!session) {
    const url = context.req.url;
    return {
      redirect: {
        destination: `/auth/signin?callbackUrl=${url}`,
      },
    };
  }

  const coordinatorRpcUrl = process.env.STREAM_COORDINATOR_RPC_URL;
  const apiKey = process.env.STREAM_API_KEY as string;
  const secretKey = process.env.STREAM_SECRET_KEY as string;

  const userName = (
    (context.query[`user_id`] as string) || session.user.email
  ).replaceAll(' ', '_'); // Otherwise, SDP parse errors with MSID
  return {
    props: {
      coordinatorRpcUrl,
      apiKey,
      userToken: createToken(userName, secretKey),
      user: {
        id: userName,
        name: userName,
        role: 'admin',
        teams: ['stream-io'],
        imageUrl: session.user.image,
      },
    } as JoinCallProps,
  };
};
