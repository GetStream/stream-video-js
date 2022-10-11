import { useRouter } from 'next/router';
import { authOptions } from '../api/auth/[...nextauth]';
import { unstable_getServerSession } from 'next-auth';
import { GetServerSidePropsContext } from 'next';
import { createToken } from '../../helpers/jwt';
import {
  useCreateStreamVideoClient,
  StreamVideo,
  StreamCall,
} from '@stream-io/video-react-sdk';
import { UserInput } from '@stream-io/video-client';
import { useMemo } from 'react';

type JoinCallProps = {
  user: UserInput;
  userToken: string;
  coordinatorRpcUrl: string;
  coordinatorWsUrl: string;
  apiKey: string;
};

const JoinCall = (props: JoinCallProps) => {
  const router = useRouter();
  const callId = router.query['callId'] as string;
  const callType = (router.query['type'] as string) || 'default';
  const includeSelf = Boolean(router.query['include_self']);
  const autoJoin = Boolean(router.query['auto_join']) || true;

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
    <div style={{ flexGrow: 1 }}>
      <StreamVideo client={client}>
        <StreamCall
          currentUser={loggedInUser.name}
          callId={callId}
          callType={callType}
          autoJoin={autoJoin}
          includeSelf={includeSelf}
        />
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
  const coordinatorWsUrl = process.env.STREAM_COORDINATOR_WS_URL;
  const apiKey = process.env.STREAM_API_KEY as string;
  const secretKey = process.env.STREAM_SECRET_KEY as string;

  const userName = (
    (context.query[`user_id`] as string) || session.user.email
  ).replaceAll(' ', '_'); // Otherwise, SDP parse errors with MSID
  return {
    props: {
      coordinatorRpcUrl,
      coordinatorWsUrl,
      apiKey,
      userToken: createToken(userName, secretKey),
      user: {
        name: userName,
        role: 'admin',
        teams: ['stream-io'],
        imageUrl: session.user.image,
        // customJson: new Uint8Array() // can't be serialized to JSON
      },
    } as JoinCallProps,
  };
};
