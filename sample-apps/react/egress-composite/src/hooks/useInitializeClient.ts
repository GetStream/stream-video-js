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
    // @ts-ignore
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

    client.connectUser(
      {
        id: userId,
      },
      token,
    );

    return () => {
      client.disconnectUser();
    };
  }, [client, enabled, token, userId]);

  useEffect(() => {
    if (!client || !enabled) return;

    call.camera.disable();
    call.microphone.disable();

    const callJoinPromise = call.join();
    return () => {
      callJoinPromise.then(() => {
        call.leave();
      });
    };
  }, [call, client, enabled]);
};

export const useInitializeClientAndCall = () => {
  const {
    base_url: baseURL,
    api_key: apiKey,
    call_type: callType,
    call_id: callId,
    test_environment: testEnvironment,
  } = useConfigurationContext();

  const client = useMemo<StreamVideoClient>(() => {
    return new StreamVideoClient(apiKey, {
      baseURL,
    });
  }, [apiKey, baseURL]);

  const call = useMemo<Call>(() => {
    return client.call(callType, callId);
  }, [callId, callType, client]);

  // mock state of client and call if "test_environment" exists
  useVideoStateMocks({ client, call, enabled: !!testEnvironment });
  // join call and proceed normally
  useJoinCall({ client, call, enabled: !testEnvironment });

  return { client, call };
};
