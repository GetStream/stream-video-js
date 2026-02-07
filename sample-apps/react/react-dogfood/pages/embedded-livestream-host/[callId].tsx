import { EmbeddedLivestream } from '@stream-io/video-react-sdk/embedded';
import { useRouter } from 'next/router';
import {
  getServerSideCredentialsProps,
  type ServerSideCredentialsProps,
} from '../../lib/getServerSideCredentialsProps';

export default function EmbeddedPage(props: ServerSideCredentialsProps) {
  const { apiKey, userToken, user } = props;
  const router = useRouter();

  const callId = router.query.callId as string;

  return (
    <EmbeddedLivestream
      apiKey={apiKey}
      user={{
        id: 'jdimovska',
        name: user.name,
        image: user.image,
      }}
      callId={callId}
      token={userToken}
    />
  );
}

export const getServerSideProps = getServerSideCredentialsProps;
