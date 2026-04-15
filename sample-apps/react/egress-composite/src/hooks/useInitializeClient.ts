import * as Sentry from '@sentry/react';
import { useEffect, useMemo, useRef } from 'react';
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

  const deinit = useRef<Promise<void> | undefined>(undefined);
  useEffect(() => {
    if (!enabled) return;

    const connectAndJoin = async () => {
      await client.connectUser({ id: userId }, token);

      // the recorder system doesn't have any device attached
      await Promise.all([
        call.camera.disable(),
        call.microphone.disableSpeakingWhileMutedNotification(),
        call.microphone.disable(),
      ]).catch((err) => console.error('Error disabling devices', err));

      await call.join({ maxJoinRetries: 100 });
    };

    const init = (deinit.current ?? Promise.resolve()).then(() =>
      connectAndJoin().catch((err) => {
        Sentry.captureException(err, { extra: { userId, callCid: call.cid } });
        console.error('Error joining call', err);
      }),
    );
    return () => {
      deinit.current = init.then(() =>
        call
          .leave()
          .catch((err) => console.error('Error leaving call', err))
          .then(() =>
            client
              .disconnectUser()
              .catch((err) => console.error('Error disconnecting user', err)),
          ),
      );
    };
  }, [call, client, enabled, token, userId]);
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
      maxConnectUserRetries: 25,
    });
  }, [apiKey, baseURL, logLevel]);

  const call = useMemo<Call>(() => {
    return client.call(callType, callId);
  }, [callId, callType, client]);

  // mock state of client and call if "test_environment" exists
  useVideoStateMocks({ client, call, enabled: !!testEnvironment });
  // join call and proceed normally
  useJoinCall({ client, call, enabled: !testEnvironment });

  return { client, call };
};
