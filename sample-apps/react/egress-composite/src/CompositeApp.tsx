import { CSSProperties, PropsWithChildren, useEffect, useState } from 'react';
import {
  Call,
  CallingState,
  StreamCallProvider,
  StreamClientOptions,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';

import { useConfigurationContext } from './ConfigurationContext';
import layoutPairMap from './layouts';
import { EgressReadyNotificationProvider } from './hooks/useNotifyEgress';
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
      </StreamThemeWrapper>
    </StreamVideo>
  );
};

const UIDispatcher = () => {
  const { layout } = useConfigurationContext();
  const { useHasOngoingScreenShare } = useCallStateHooks();
  const hasScreenShare = useHasOngoingScreenShare();
  const { DefaultView, ScreenShareView } = layoutPairMap[layout.type];

  return hasScreenShare ? <ScreenShareView /> : <DefaultView />;
};

const DEFAULT_BACKGROUND_STYLE: CSSProperties = {
  background:
    'linear-gradient(0deg, rgba(17,17,18,1) 0%, rgba(32,32,36,1) 50%, rgba(52,52,52,1) 100%)',
};

const DEFAULT_LOGO_STYLE: CSSProperties = {
  position: 'absolute',
  bottom: 10,
  right: 10,
  width: 200,
};

const DEFAULT_TITLE_STYLE: CSSProperties = {
  position: 'absolute',
  top: 10,
  left: 10,
  fontSize: 30,
  padding: 10,
};

const StreamThemeWrapper = ({ children }: PropsWithChildren) => {
  const { background: { style } = {} } = useConfigurationContext();

  return (
    <StreamTheme style={{ ...DEFAULT_BACKGROUND_STYLE, ...style }}>
      {children}
    </StreamTheme>
  );
};

const LogoAndTitleOverlay = () => {
  const {
    title: { text, style: titleStyle } = {},
    logo: { url, style: logoStyle } = {},
  } = useConfigurationContext();

  return (
    <div
      style={{
        top: 0,
        left: 0,
        position: 'absolute',
        width: '100%',
        height: '100%',
      }}
    >
      {text?.length && (
        <div
          data-test-id="title"
          style={{ ...DEFAULT_TITLE_STYLE, ...titleStyle }}
        >
          {text}
        </div>
      )}
      {url && (
        <img
          data-test-id="logo"
          src={url}
          style={{ ...DEFAULT_LOGO_STYLE, ...logoStyle }}
          alt="logo"
        />
      )}
    </div>
  );
};
