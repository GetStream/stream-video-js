import {
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  WithTooltip,
  type Call,
} from '@stream-io/video-react-sdk';
import clsx from 'clsx';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { useAppEnvironment } from '../../context/AppEnvironmentContext';
import { inspectorUserId, meetingId } from '../../lib/idGenerators';
import type {
  CreateJwtTokenRequest,
  CreateJwtTokenResponse,
} from '../../pages/api/auth/create-token';
import { CallingState } from './CallingState';
import { copyReport } from './copyReport';
import { CredentialsForm, parseConnectionString } from './CredentialsForm';
import { Credentials } from './types';
import { getConnectionString } from '../../lib/connectionString';

export function InspectorCall(props: {
  autoJoinDemoCall?: boolean;
  children: (
    client: StreamVideoClient | undefined,
    call: Call | undefined,
  ) => ReactNode;
}) {
  const params = new URLSearchParams(window.location.search);
  const connectionStringQueryParam = params.get('conn') ?? '';
  const [connectionString, setConnectionString] = useState(
    connectionStringQueryParam ?? '',
  );
  const { client, call, log, joinDemoCall, joinWithCredentials, leave } =
    useInspectorCall();
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  if (call) {
    const actualConnectionString = getConnectionString(call);
    if (actualConnectionString !== connectionString) {
      setConnectionString(actualConnectionString);
    }
  }

  const handleJoinWithCredentialsSubmit = (credentails: Credentials) => {
    setIsJoining(true);
    joinWithCredentials(credentails).finally(() => setIsJoining(false));
  };

  const handleJoinDemoCall = () => {
    setIsJoining(true);
    joinDemoCall().finally(() => setIsJoining(false));
  };

  const handleLeave = () => {
    setIsLeaving(true);
    leave().finally(() => setIsLeaving(false));
  };

  useAutoJoinDemoCall(props.autoJoinDemoCall ?? false, handleJoinDemoCall);

  let children = (
    <StreamCall call={call}>{props.children(client, call)}</StreamCall>
  );

  if (client) {
    children = <StreamVideo client={client}>{children}</StreamVideo>;
  }

  let defaultCredentials: Credentials;
  try {
    defaultCredentials = parseConnectionString(connectionString);
  } catch {
    defaultCredentials = {
      callType: '',
      callId: '',
      apiKey: '',
      userToken: '',
      userId: '',
    };
  }

  if (props.autoJoinDemoCall) {
    return (
      <>
        <div className="rd__auto-join-call-form">
          <CallJoinLog log={log} />
          <CopyReportButton />
        </div>
        {children}
      </>
    );
  }

  return (
    <>
      <div className="rd__join-call-form">
        <div className="rd__join-call-form-controls">
          {!call && (
            <>
              <div className="rd__join-call-form-connection-string">
                <CredentialsForm
                  defaultValue={defaultCredentials}
                  autoFocus
                  onSubmit={(credentials) => {
                    handleJoinWithCredentialsSubmit(credentials);
                  }}
                />
              </div>
              <div className="rd__join-call-form-or">or</div>
              <div className="rd__join-call-form-demo-call">
                <button
                  className="rd__join-call-form-join"
                  type="button"
                  disabled={isJoining}
                  onClick={handleJoinDemoCall}
                >
                  Join demo call
                </button>
              </div>
            </>
          )}
          {call && (
            <>
              <CallingState call={call} />
              <button
                className="rd__join-call-form-leave"
                type="button"
                disabled={isLeaving}
                onClick={handleLeave}
              >
                Leave call
              </button>
            </>
          )}
          <CopyReportButton />
        </div>
        <CallJoinLog log={log} />
      </div>
      {children}
    </>
  );
}

function CallJoinLog(props: { log: { message: string; error: boolean }[] }) {
  return props.log.length > 0 ? (
    <details
      className="rd__join-call-form-log"
      data-copy="Call join log"
      data-h
    >
      <summary>{props.log.at(-1)?.message}</summary>
      {props.log.map((record, index) => (
        <div
          key={index}
          className={clsx({
            'rd__log-record': true,
            'rd__log-record_error': record.error,
          })}
          data-copyable
        >
          {record.message}
        </div>
      ))}
    </details>
  ) : null;
}

function CopyReportButton() {
  return (
    <WithTooltip title="Copy report" tooltipPlacement="bottom-end">
      <button
        className="rd__copy-button"
        type="button"
        onClick={() => copyReport()}
      >
        📋
      </button>
    </WithTooltip>
  );
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

function useInspectorCall() {
  const environment = useAppEnvironment();
  const [client, setClient] = useState<StreamVideoClient | undefined>();
  const [call, setCall] = useState<Call | undefined>();
  const [log, setLog] = useState<
    Array<{
      message: string;
      error: boolean;
    }>
  >([]);

  const appendLog = (message: string, maybeError?: unknown) => {
    if (maybeError instanceof Error) {
      message += `. ${maybeError.message}`;
    }

    setLog((l) => [
      ...l,
      {
        message,
        error: Boolean(maybeError),
      },
    ]);
  };

  const joinDemoCall = async () => {
    let credentails: Credentials;

    try {
      appendLog('Fetching credentials');
      credentails = await getDemoCredentials(environment);
    } catch (err) {
      appendLog(`Could not fetch credentials`, err);
      throw err;
    }

    await joinWithCredentials(credentails);
  };

  const joinWithCredentials = async (credentials: Credentials) => {
    window._inspector ??= {};
    const _client = await initializeClient(credentials);
    await initializeCall(_client, credentials);
  };

  const initializeClient = async (credentials: Credentials) => {
    try {
      appendLog(`Connecting to ${credentials.apiKey} as ${credentials.userId}`);
      const _client = new StreamVideoClient(credentials.apiKey);
      await _client.connectUser(
        { id: credentials.userId },
        credentials.userToken,
      );
      appendLog('User connected');
      setClient(_client);
      window._inspector.client = _client;
      return _client;
    } catch (err) {
      appendLog(`Could not connect as ${credentials.userId}`, err);
      throw err;
    }
  };

  const initializeCall = async (
    _client: StreamVideoClient,
    credentials: Credentials,
  ) => {
    try {
      appendLog(`Joining call ${credentials.callType}:${credentials.callId}`);
      const _call = _client.call(credentials.callType, credentials.callId);
      await _call.join({ create: true });
      appendLog('Call joined');
      setCall(_call);
      window._inspector.call = _call;
      return _client;
    } catch (err) {
      appendLog(
        `Could not join call ${credentials.callType}:${credentials.callId}`,
        err,
      );
      throw err;
    }
  };

  const leave = async () => {
    if (call) {
      try {
        appendLog(`Leaving call ${call.cid}`);
        await call.leave();
        setCall(undefined);
        delete window._inspector.call;
      } catch (err) {
        appendLog(`Could not leave call ${call.cid}`);
        throw err;
      }
    }

    if (client) {
      try {
        appendLog(`Disconnecting ${client.state.connectedUser?.id}`);
        await client.disconnectUser();
        appendLog('Disconnected from call');
        setClient(undefined);
        delete window._inspector.client;
      } catch (err) {
        appendLog('User disconnected');
        throw err;
      }
    }
  };

  return { client, call, log, joinDemoCall, joinWithCredentials, leave };
}

function useAutoJoinDemoCall(flag: boolean, join: () => void) {
  const autoJoined = useRef(false);
  const joinRef = useRef(join);
  joinRef.current = join;

  useEffect(() => {
    if (flag && !autoJoined.current) {
      joinRef.current();
      autoJoined.current = true;
    }
  }, [flag]);
}

async function getDemoCredentials(environment: string): Promise<Credentials> {
  const params = new URLSearchParams({
    user_id: inspectorUserId(),
    environment,
    exp: String(4 * 60 * 60), // 4 hours
  } satisfies CreateJwtTokenRequest);

  const res = await fetch(`${basePath}/api/auth/create-token?${params}`);
  const credentials = (await res.json()) as CreateJwtTokenResponse;
  return {
    apiKey: credentials.apiKey,
    userId: credentials.userId,
    userToken: credentials.token,
    callType: 'default',
    callId: meetingId(),
  };
}
