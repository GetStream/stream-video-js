import { PropsWithChildren } from 'react';
import {
  StreamCallProvider,
  StreamTheme,
  StreamVideo,
} from '@stream-io/video-react-sdk';

import {
  EgressReadyNotificationProvider,
  useExternalCSS,
  useInitializeClient,
} from './hooks';
import { UIDispatcher, LogoAndTitleOverlay } from './components';

import './CompositeApp.scss';

export const CompositeApp = () => {
  const { client, call: activeCall } = useInitializeClient();

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

export const StreamThemeWrapper = ({ children }: PropsWithChildren) => {
  // TODO: background style
  useExternalCSS();

  return <StreamTheme>{children}</StreamTheme>;
};
