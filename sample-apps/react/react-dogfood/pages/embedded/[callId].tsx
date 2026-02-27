import { EmbeddedCall } from '@stream-io/video-react-sdk/embedded';
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
    <EmbeddedCall
      apiKey={apiKey}
      user={{
        id: user.id!,
        name: user.name,
        image: user.image,
      }}
      callId={callId}
      callType="default"
      token={userToken}
    />
  );
}

export const getServerSideProps = getServerSideCredentialsProps;
