import { useEffect, useState } from 'react';
import {
  StreamCall,
  StreamClientOptions,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  useHasOngoingScreenShare,
} from '@stream-io/video-react-sdk';
import Layouts, { DEFAULT_LAYOUT_ID, LayoutId } from './layouts';
import {appConfig} from './hooks/useAppConfig';
import { EgressReadyNotificationProvider } from './hooks/useNotifyEgress';
import './CompositeApp.scss';

const config = appConfig();
const client = new StreamVideoClient({apiKey: config.apiKey, user:{id: config.userId}, token: config.token});
const call = client.call(config.callType, config.callId);
await call.join();

const ExternalCSS = () => {
  const [ stylePath, setStylePath ] = useState(config.extCSS);

  useEffect(() => {
    const link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = stylePath;
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); }
  }, [stylePath]);
  return (
    <></>
  );
}

export const CompositeApp = () => {
  return (
    <>
      <ExternalCSS></ExternalCSS>
      <StreamVideo client={client}>
        <StreamTheme>
          <div className="str-video__branding-logo"></div>
          <EgressReadyNotificationProvider>
              <StreamCall call={call} mediaDevicesProviderProps={{ initialAudioEnabled: false, initialVideoEnabled: false }}>
                <UiDispatcher layout={config.layout} />
              </StreamCall>
          </EgressReadyNotificationProvider>
          <div className="str-video__branding-footer"></div>
        </StreamTheme>
      </StreamVideo>
    </>
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
