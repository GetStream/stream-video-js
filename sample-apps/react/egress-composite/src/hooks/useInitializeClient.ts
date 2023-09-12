import { useEffect, useMemo, useState } from 'react';
import {
  CallingState,
  StreamVideoClient,
  Call,
  StreamVideoParticipant,
} from '@stream-io/video-react-sdk';

import { useConfigurationContext } from '../ConfigurationContext';

const useVideoStateMocks = ({
  client,
  call,
}: {
  client: StreamVideoClient;
  call: Call;
}) => {
  const { test_environment: testEnvironment } = useConfigurationContext();

  useEffect(() => {
    if (!testEnvironment) return;

    const { participants = [] } = testEnvironment;
    // @ts-ignore
    client.writeableStateStore.registerCall(call);
    call.state.setParticipants(participants as StreamVideoParticipant[]);
    console.log({ client, call });
  }, [client, call, testEnvironment]);
};

export const useInitializeClient = () => {
  const {
    base_url: baseURL,
    api_key: apiKey,
    user_id: userId,
    call_type: callType,
    call_id: callId,
    test_environment: testEnvironment,
    token,
  } = useConfigurationContext();

  const client = useMemo<StreamVideoClient>(() => {
    return new StreamVideoClient(apiKey, {
      baseURL,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, baseURL, testEnvironment]);

  // TODO: clean up this solution, have call always exist and check CallingState only
  // probably wrap in useMemo instead as well
  const [activeCall, setActiveCall] = useState<Call | undefined>(() => {
    if (testEnvironment) {
      return client.call(callType, callId);
    }

    return;
  });

  // mock state of client and call if "test_environment" exists
  useVideoStateMocks({ client, call: activeCall! });

  useEffect(() => {
    if (testEnvironment) return;

    client.connectUser(
      {
        id: userId,
      },
      token,
    );

    return () => {
      client.disconnectUser();
    };
  }, [client, testEnvironment, token, userId]);

  useEffect(() => {
    if (!client || testEnvironment) return;

    let joinInterrupted = false;
    const call = client.call(callType, callId);
    const currentCall = call.join().then(() => {
      if (!joinInterrupted) {
        setActiveCall(call);
      }
      return call;
    });
    return () => {
      joinInterrupted = true;
      currentCall.then((theCall) => {
        if (theCall && theCall.state.callingState !== CallingState.LEFT) {
          theCall.leave();
        }
        setActiveCall(undefined);
      });
    };
  }, [client, callType, callId, testEnvironment]);

  return { client, call: activeCall };
};
