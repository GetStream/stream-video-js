import { useEffect, useState } from 'react';
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
import Layouts, { DEFAULT_LAYOUT_ID, LayoutId } from './layouts';
import { useAppConfig } from './hooks/useAppConfig';
import { EgressReadyNotificationProvider } from './hooks/useNotifyEgress';
import './CompositeApp.scss';

export const CompositeApp = () => {
  const config = useAppConfig();
  const options: StreamClientOptions = {};
  if (config.baseURL) {
    options.baseURL = config.baseURL;
  }
  const [client] = useState<StreamVideoClient>(
    () => new StreamVideoClient(config.apiKey, options),
  );

  useEffect(() => {
    client.connectUser(
      {
        id: config.userId,
      },
      config.token,
    );

    return () => {
      client.disconnectUser();
    };
  }, [client, config.userId, config.token]);

  const [activeCall, setActiveCall] = useState<Call>();
  useEffect(() => {
    if (!client) return;
    let joinInterrupted = false;
    const call = client.call(config.callType, config.callId);
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
  }, [client, config.callId, config.callType]);

  if (!client) {
    return <h2>Connecting...</h2>;
  }

  return (
    <StreamVideo client={client}>
      <StreamTheme>
        <EgressReadyNotificationProvider>
          {activeCall && (
            <StreamCallProvider call={activeCall}>
              <UiDispatcher layout={config.layout} />
            </StreamCallProvider>
          )}
        </EgressReadyNotificationProvider>
      </StreamTheme>
    </StreamVideo>
  );
};

const UiDispatcher = (props: { layout: LayoutId }) => {
  const { layout } = props;
  const { ParticipantsView, ScreenShareView } =
    Layouts[layout || DEFAULT_LAYOUT_ID];

  const { useHasOngoingScreenShare } = useCallStateHooks();
  const hasScreenShare = useHasOngoingScreenShare();
  if (hasScreenShare) {
    return <ScreenShareView />;
  }

  return <ParticipantsView />;
};
