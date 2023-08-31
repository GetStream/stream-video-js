import { PropsWithChildren, useEffect, useState } from 'react';
import {
  Call,
  CallingState,
  StreamCallProvider,
  StreamClientOptions,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
} from '@stream-io/video-react-sdk';

import { useConfigurationContext } from './ConfigurationContext';
import { EgressReadyNotificationProvider, useExternalCSS } from './hooks';
import { UIDispatcher, LogoAndTitleOverlay } from './components';

import './CompositeApp.scss';

export const CompositeApp = () => {
  const {
    base_url: baseURL,
    api_key: apiKey,
    user_id: userId,
    call_type: callType,
    call_id: callId,
    token,
  } = useConfigurationContext();

  const options: StreamClientOptions = {};
  if (baseURL) {
    options.baseURL = baseURL;
  }
  const [client] = useState<StreamVideoClient>(
    () => new StreamVideoClient(apiKey, options),
  );

  useEffect(() => {
    client.connectUser(
      {
        id: userId,
      },
      token,
    );

    return () => {
      client.disconnectUser();
    };
  }, [client, token, userId]);

  const [activeCall, setActiveCall] = useState<Call>();
  useEffect(() => {
    if (!client) return;
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
  }, [client, callType, callId]);

  if (!client) {
    return <h2>Connecting...</h2>;
  }

  return (
    <StreamVideo client={client}>
      <StreamThemeWrapper>
        <EgressReadyNotificationProvider>
          {activeCall && (
            <StreamCallProvider call={activeCall}>
              <UIDispatcher />
              <LogoAndTitleOverlay />
            </StreamCallProvider>
          )}
        </EgressReadyNotificationProvider>
        {/* <StyleComponent /> */}
      </StreamThemeWrapper>
    </StreamVideo>
  );
};

const StreamThemeWrapper = ({ children }: PropsWithChildren) => {
  // TODO: background style
  useExternalCSS();

  return <StreamTheme>{children}</StreamTheme>;
};
