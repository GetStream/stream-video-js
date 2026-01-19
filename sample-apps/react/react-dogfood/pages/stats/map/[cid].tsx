import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  getServerSideCredentialsProps,
  ServerSideCredentialsProps,
} from '../../../lib/getServerSideCredentialsProps';
import { useAppEnvironment } from '../../../context/AppEnvironmentContext';
import { getClient } from '../../../helpers/client';

export default function MapStats(props: ServerSideCredentialsProps) {
  const { apiKey, userToken, user } = props;
  const environment = useAppEnvironment();
  const router = useRouter();
  const cid = router.query['cid'] as string;
  const [data, setData] = useState<any>({ message: 'Loading...' });

  useEffect(() => {
    const query = router.query;
    const callSessionId = query['call_session_id'] as string | undefined;
    const start_time = query['start_time'] as string | undefined;
    const end_time = query['end_time'] as string | undefined;
    const exclude_publishers = query['exclude_publishers'] as
      | string
      | undefined;
    const exclude_subscribers = query['exclude_subscribers'] as
      | string
      | undefined;
    const exclude_sfus = query['exclude_sfus'] as string | undefined;

    const _client = getClient({ apiKey, user, userToken }, environment);
    window.client = _client;

    const [type, id] = cid.split(':');
    const _call = _client.call(type, id, { reuseInstance: true });
    (async () => {
      try {
        await _call.get();
        const stats = await _call.getCallStatsMap(
          {
            start_time,
            end_time,
            exclude_publishers: exclude_publishers === 'true',
            exclude_subscribers: exclude_subscribers === 'true',
            exclude_sfus: exclude_sfus === 'true',
          },
          callSessionId,
        );
        console.log('Call participants stats:', stats);
        setData(stats);
      } catch (err) {
        setData({ message: 'Failed to get call stats map', err });
      }
    })();

    return () => {
      _client
        .disconnectUser()
        .catch((e) => console.error('Failed to disconnect user', e));

      window.client = undefined;
    };
  }, [apiKey, cid, environment, router.query, user, userToken]);

  return (
    <pre style={{ height: '100%', overflow: 'scroll' }}>
      {data && JSON.stringify(data, null, 2)}
    </pre>
  );
}
export const getServerSideProps = getServerSideCredentialsProps;
