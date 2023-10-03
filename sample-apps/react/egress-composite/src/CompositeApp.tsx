import { PropsWithChildren } from 'react';
import {
  StreamCallProvider,
  StreamTheme,
  StreamVideoProvider,
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
import { UIDispatcher, LogoAndTitleOverlay } from './components';

import './CompositeApp.scss';
import { useParticipantStyles } from './hooks/options/useParticipantStyles';

export const CompositeApp = () => {
  const { client, call } = useInitializeClientAndCall();

  return (
    <StreamVideoProvider client={client}>
      <StreamCallProvider call={call}>
        <StreamThemeWrapper>
          <EgressReadyNotificationProvider>
            <UIDispatcher />
            <LogoAndTitleOverlay />
          </EgressReadyNotificationProvider>
          {/* <StyleComponent /> */}
        </StreamThemeWrapper>
      </StreamCallProvider>
    </StreamVideoProvider>
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
