import { useEffect, useMemo } from 'react';
import {
  Call,
  StreamVideoClient,
  StreamVideoParticipant,
} from '@stream-io/video-react-sdk';

import { useConfigurationContext } from '../ConfigurationContext';

const useVideoStateMocks = ({
  client,
  call,
  enabled,
}: {
  client: StreamVideoClient;
  call: Call;
  enabled: boolean;
}) => {
  const { test_environment: testEnvironment } = useConfigurationContext();

  useEffect(() => {
    if (!enabled) return;

    const { participants = [] } = testEnvironment ?? {};
    // @ts-expect-error private api
    client.writeableStateStore.registerCall(call);
    call.state.setParticipants(participants as StreamVideoParticipant[]);
    console.log({ client, call });
  }, [client, call, testEnvironment, enabled]);
};

const useJoinCall = ({
  client,
  call,
  enabled,
}: {
  client: StreamVideoClient;
  call: Call;
  enabled: boolean;
}) => {
  const { token, user_id: userId } = useConfigurationContext();

  useEffect(() => {
    if (!enabled) return;
    client.connectUser({ id: userId }, token).catch((err) => {
      console.error('Error connecting user', err);
    });
    return () => {
      client.disconnectUser().catch((err) => {
        console.error('Error disconnecting user', err);
      });
    };
  }, [client, enabled, token, userId]);

  useEffect(() => {
    if (!client || !enabled) return;

    // the recorder system doesn't have any device attached
    const deviceSetup = Promise.all([
      call.camera.disable(),
      call.microphone.disableSpeakingWhileMutedNotification(),
      call.microphone.disable(),
    ]);

    const callJoinPromise = deviceSetup
      .then(() => call.join())
      .catch((err) => console.error('Error joining call', err));
    return () => {
      callJoinPromise
        .then(() => call.leave())
        .catch((err) => console.error('Error leaving call', err));
    };
  }, [call, client, enabled]);
};

export const useInitializeClientAndCall = () => {
  const {
    base_url: baseURL,
    api_key: apiKey,
    call_type: callType,
    call_id: callId,
    log_level: logLevel = 'debug',
    test_environment: testEnvironment,
  } = useConfigurationContext();

  const client = useMemo<StreamVideoClient>(() => {
    return new StreamVideoClient(apiKey, {
      baseURL,
      logLevel,
    });
  }, [apiKey, baseURL, logLevel]);

  const call = useMemo<Call>(() => {
    return client.call(callType, callId);
  }, [callId, callType, client]);

  // mock state of client and call if "test_environment" exists
  useVideoStateMocks({ client, call, enabled: !!testEnvironment });
  // join call and proceed normally
  useJoinCall({ client, call, enabled: !testEnvironment });

  // @ts-ignore expose the client and call for debugging
  window.client = client;
  // @ts-ignore expose the client and call for debugging
  window.call = call;

  return { client, call };
};
