import { useEffect, useState } from 'react';
import {
  StreamCall,
  StreamTheme,
  StreamVideo,
  type Call,
  type StreamVideoClient,
} from '@stream-io/video-react-sdk';
import { PreCallTest } from './PreCallTest';
import { useAppEnvironment } from '../../context/AppEnvironmentContext';
import { getClient } from '../../helpers/client';
import { meetingId } from '../../lib/idGenerators';
import type { ServerSideCredentialsProps } from '../../lib/getServerSideCredentialsProps';

export const PreCallTestApp = ({
  apiKey,
  user,
  userToken,
}: ServerSideCredentialsProps) => {
  const environment = useAppEnvironment();
  const [client, setClient] = useState<StreamVideoClient>();
  const [call, setCall] = useState<Call>();

  useEffect(() => {
    const _client = getClient({ apiKey, user, userToken }, environment);
    const _call = _client.call('default', `pre_call_test_${meetingId()}`);
    _call.setStatsReportingIntervalInMs(500);

    setClient(_client);
    setCall(_call);

    _call.getOrCreate().catch(console.error);

    return () => {
      setClient(undefined);
      setCall(undefined);
      _call.leave().catch(console.error);
    };
  }, [apiKey, user, userToken, environment]);

  if (!client || !call) {
    return null;
  }

  return (
    <StreamTheme className="rd__pre-call-test-theme">
      <div className="rd__pre-call-test-page">
        <StreamVideo client={client}>
          <StreamCall call={call}>
            <PreCallTest />
          </StreamCall>
        </StreamVideo>
      </div>
    </StreamTheme>
  );
};

export default PreCallTestApp;
