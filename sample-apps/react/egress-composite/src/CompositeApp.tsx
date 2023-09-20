import { PropsWithChildren } from 'react';
import {
  StreamCallProvider,
  StreamTheme,
  StreamVideo,
} from '@stream-io/video-react-sdk';

import {
  EgressReadyNotificationProvider,
  useExternalCSS,
  useInitializeClientAndCall,
} from './hooks';
import { UIDispatcher, LogoAndTitleOverlay } from './components';

import './CompositeApp.scss';

export const CompositeApp = () => {
  const { client, call } = useInitializeClientAndCall();

  return (
    <StreamVideo client={client}>
      <StreamThemeWrapper>
        <EgressReadyNotificationProvider>
          <StreamCallProvider call={call}>
            <UIDispatcher />
            <LogoAndTitleOverlay />
          </StreamCallProvider>
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
