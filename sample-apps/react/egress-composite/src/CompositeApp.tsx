import { useEffect, useState } from 'react';
import {
  Call,
  StreamCallProvider,
  StreamClientOptions,
  StreamVideo,
  useCreateStreamVideoClient,
  useHasOngoingScreenShare,
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
  const client = useCreateStreamVideoClient({
    apiKey: config.apiKey,
    tokenOrProvider: config.token,
    options,
    user: {
      id: config.userId,
    },
  });

  const [activeCall, setActiveCall] = useState<Call>();
  useEffect(() => {
    if (!client) return;
    let joinInterrupted = false;
    const currentCall = client
      .joinCall(config.callId, config.callType)
      .then((call) => {
        if (!joinInterrupted) {
          setActiveCall(call);
        }
        return call;
      });
    return () => {
      joinInterrupted = true;
      currentCall.then((call) => {
        call?.leave();
        setActiveCall(undefined);
      });
    };
  }, [client, config.callId, config.callType]);

  if (!client) {
    return <h2>Connecting...</h2>;
  }

  return (
    <StreamVideo client={client}>
      <EgressReadyNotificationProvider>
        {activeCall && (
          <StreamCallProvider call={activeCall}>
            <UiDispatcher layout={config.layout} />
          </StreamCallProvider>
        )}
      </EgressReadyNotificationProvider>
    </StreamVideo>
  );
};

const UiDispatcher = (props: { layout: LayoutId }) => {
  const { layout } = props;
  const { ParticipantsView, ScreenShareView } =
    Layouts[layout || DEFAULT_LAYOUT_ID];

  const hasScreenShare = useHasOngoingScreenShare();
  if (hasScreenShare) {
    return <ScreenShareView />;
  }

  return <ParticipantsView />;
};
