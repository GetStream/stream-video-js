import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  getServerSideCredentialsProps,
  ServerSideCredentialsProps,
} from '../../lib/getServerSideCredentialsProps';
import { useAppEnvironment } from '../../context/AppEnvironmentContext';
import { getClient } from '../../helpers/client';

export default function Stats(props: ServerSideCredentialsProps) {
  const { apiKey, userToken, user } = props;
  const environment = useAppEnvironment();
  const router = useRouter();
  const cid = router.query['cid'] as string;
  const [data, setData] = useState<any>({ message: 'Loading...' });

  useEffect(() => {
    const useLocalCoordinator =
      router.query['use_local_coordinator'] === 'true';
    const coordinatorUrl = useLocalCoordinator
      ? 'http://localhost:3030/video'
      : (router.query['coordinator_url'] as string | undefined);
    const callSessionId = router.query['call_session_id'] as string | undefined;
    const _client = getClient(
      { apiKey, user, userToken, coordinatorUrl },
      environment,
    );
    window.client = _client;

    const [type, id] = cid.split(':');
    const _call = _client.call(type, id, { reuseInstance: true });
    (async () => {
      try {
        await _call.get();
        const userId =
          (router.query['user_id'] as string | undefined) || user.id;
        const userSessionId = router.query['user_session_id'] as
          | string
          | undefined;
        const kind =
          (router.query['kind'] as 'details' | 'timeline') || 'details';
        const stats = await _call.getCallParticipantsStats({
          userId,
          userSessionId,
          sessionId: callSessionId,
          kind,
        });
        console.log('Call participants stats:', stats);
        setData(stats);
      } catch (err) {
        setData({ message: 'Failed to get call participants stats', err });
      }
    })();

    return () => {
      _client
        .disconnectUser()
        .catch((e) => console.error('Failed to disconnect user', e));

      window.client = undefined;
    };
  }, [apiKey, user, userToken, environment, cid, router.query]);

  return (
    <pre style={{ height: '100%', overflow: 'scroll' }}>
      {data && JSON.stringify(data, null, 2)}
    </pre>
  );
}
export const getServerSideProps = getServerSideCredentialsProps;
