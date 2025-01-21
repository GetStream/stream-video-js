import {
  Call,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
} from '@stream-io/video-react-sdk';
import { useEffect, useMemo, useState } from 'react';
import { ConnectivityDash } from './ConnectivityDash';
import { CapabilitiesDash } from './CapabiltiesDash';
import { DevicesDash } from './DevicesDash';
import { CodecDash } from './CodecDash';

interface Credentials {
  callType: string;
  callId: string;
  apiKey: string;
  userId: string;
  userToken: string;
}

export default function InspectorPage() {
  const params = new URLSearchParams(window.location.search);
  const connectionString = params.get('conn') ?? '';
  const credentials = useMemo(
    () => parseConnectionString(connectionString),
    [connectionString],
  );
  const { client, call } = useCall(credentials);

  return (
    <div className="rd__inspector">
      <CapabilitiesDash />
      {client ? (
        <StreamVideo client={client}>
          <DevicesDash />
          {call ? (
            <StreamCall call={call}>
              <ConnectivityDash />
              <CodecDash />
            </StreamCall>
          ) : (
            <div className="rd__inspector-placeholder">Joining call....</div>
          )}
        </StreamVideo>
      ) : (
        <div className="rd__inspector-placeholder">Connecting user...</div>
      )}
    </div>
  );
}

// function CallStatsInspector() {
//   const { useCallStatsReport } = useCallStateHooks();
//   const stats = useCallStatsReport();

//   return <pre>{JSON.stringify(stats, undefined, 2)}</pre>;
// }

function parseConnectionString(connectionString: string): Credentials {
  // Example connection lines:
  // callType:callId@apiKey:userToken
  // callId@apiKey:userToken (default call type)
  const connectionStringRegex =
    /((?<callType>[\w-]+):)?(?<callId>[\w-]+)@(?<apiKey>[a-z0-9]+):(?<userToken>[\w-.]+)/i;
  const matches = connectionString.match(connectionStringRegex);

  if (!matches || !matches.groups) {
    throw new Error('Cannot parse connection string');
  }

  return {
    callType: matches.groups['callType'] ?? 'default',
    callId: matches.groups['callId'],
    apiKey: matches.groups['apiKey'],
    userId: parseUserIdFromToken(matches.groups['userToken']),
    userToken: matches.groups['userToken'],
  };
}

function parseUserIdFromToken(userToken: string) {
  const throwMalformed = () => {
    throw new Error('User token is malformed');
  };

  const payload = userToken.split('.')[1] ?? throwMalformed();
  return JSON.parse(atob(payload)).user_id ?? throwMalformed();
}

function useCall(credentials: Credentials) {
  const [client, setClient] = useState<StreamVideoClient | undefined>();
  const [call, setCall] = useState<Call | undefined>();

  useEffect(
    function initializeClient() {
      const _client = new StreamVideoClient(credentials.apiKey);
      let cancel = false;

      _client
        .connectUser({ id: credentials.userId }, credentials.userToken)
        .then(
          () => {
            if (!cancel) {
              setClient(_client);
              window._inspector ??= {};
              window._inspector.client = _client;
            }
          },
          () => {
            console.error('Could not connect user');
          },
        );

      return () => {
        cancel = true;
        setClient(undefined);
        _client.disconnectUser().catch(() => {
          console.error('Could not disconnect user');
        });
      };
    },
    [credentials],
  );

  useEffect(
    function initializeCall() {
      if (!client) {
        return;
      }

      const _call = client.call(credentials.callType, credentials.callId);
      let cancel = false;

      _call.join({ create: true }).then(() => {
        if (!cancel) {
          _call.camera.enable();
          setCall(_call);
          window._inspector ??= {};
          window._inspector.call = _call;
        }
      });

      return () => {
        cancel = true;
        setCall(undefined);
        _call.leave().catch(() => {
          console.error('Could not leave call');
        });
      };
    },
    [client, credentials],
  );

  return { client, call };
}
