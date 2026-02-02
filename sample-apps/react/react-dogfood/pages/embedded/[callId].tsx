import { EmbeddedStreamClient } from '@stream-io/video-react-sdk/embedded';
import { useRouter } from 'next/router';
import {
  getServerSideCredentialsProps,
  type ServerSideCredentialsProps,
} from '../../lib/getServerSideCredentialsProps';

export default function EmbeddedPage(props: ServerSideCredentialsProps) {
  const { apiKey, userToken, user } = props;
  const router = useRouter();

  const callId = router.query.callId as string;
  const callType = (router.query.type as string) || 'default';
  const skipLobby = router.query.skipLobby === 'true';

  return (
    <EmbeddedStreamClient
      apiKey={apiKey}
      user={{
        id: user.id,
        name: user.name,
        image: user.image,
        type: 'authenticated',
        token: userToken,
      }}
      call={{
        id: callId,
        type: callType,
      }}
      skipLobby={skipLobby}
    />
  );
}

export const getServerSideProps = getServerSideCredentialsProps;
