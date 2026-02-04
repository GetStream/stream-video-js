import { EmbeddedStreamClient } from '@stream-io/video-react-sdk/embedded';
import { useRouter } from 'next/router';
import {
  getServerSideCredentialsProps,
  type ServerSideCredentialsProps,
} from '../../lib/getServerSideCredentialsProps';

export default function EmbeddedPage(props: ServerSideCredentialsProps) {
  const { apiKey, userToken, user } = props;
  const router = useRouter();

  const callId = router.query.callId;
  const callType = router.query.type;
  const skipLobby = router.query.skipLobby === 'true';

  return (
    <EmbeddedStreamClient
      apiKey={apiKey}
      user={{
        id: 'jdimovska',
        name: user.name,
        image: user.image,
      }}
      callId={callId}
      callType={callType}
      token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiamRpbW92c2thIn0.INlmp-FLyR_3_nW5zWkpnoo4Fa0uY_zQjDPGvuriHeQ"
      skipLobby={skipLobby}
    />
  );
}

export const getServerSideProps = getServerSideCredentialsProps;
