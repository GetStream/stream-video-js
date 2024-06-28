import { PropsWithChildren } from 'react';
import {
  StreamCall,
  StreamTheme,
  StreamVideo,
} from '@stream-io/video-react-sdk';
import clsx from 'clsx';

import {
  EgressReadyNotificationProvider,
  useExternalCSS,
  useGenericLayoutStyles,
  useInitializeClientAndCall,
  useLogoAndTitleStyles,
  useParticipantLabelStyles,
  useVideoStyles,
} from './hooks';
import { LogoAndTitleOverlay, UIDispatcher } from './components';

import './CompositeApp.scss';
import { useParticipantStyles } from './hooks/options/useParticipantStyles';

export const CompositeApp = () => {
  const { client, call } = useInitializeClientAndCall();

  // @ts-expect-error makes it easy to debug in the browser console
  window.call = call;
  // @ts-expect-error makes it easy to debug in the browser console
  window.client = client;

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <StreamThemeWrapper>
          <EgressReadyNotificationProvider>
            <UIDispatcher />
            <LogoAndTitleOverlay />
          </EgressReadyNotificationProvider>
          {/* <StyleComponent /> */}
        </StreamThemeWrapper>
      </StreamCall>
    </StreamVideo>
  );
};

export const StreamThemeWrapper = ({ children }: PropsWithChildren) => {
  useExternalCSS();

  const videoStyles = useVideoStyles();
  const genericLayoutStyles = useGenericLayoutStyles();
  const participantStyles = useParticipantStyles();
  const participantLabelStyles = useParticipantLabelStyles();
  const logoAndTitleStyles = useLogoAndTitleStyles();

  return (
    <StreamTheme
      className={clsx(
        videoStyles,
        genericLayoutStyles,
        participantStyles,
        participantLabelStyles,
        logoAndTitleStyles,
      )}
      as="div"
    >
      {children}
    </StreamTheme>
  );
};
