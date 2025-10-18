import { PropsWithChildren } from 'react';
import {
  StreamCall,
  StreamTheme,
  StreamVideo,
} from '@stream-io/video-react-sdk';
import { cx } from '@emotion/css';

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
import { WithCustomActions } from './components/CustomActionsContext';

export const CompositeApp = () => {
  const { client, call } = useInitializeClientAndCall();

  window.call = call;
  window.client = client;

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <WithCustomActions>
          <StreamThemeWrapper>
            <EgressReadyNotificationProvider>
              <UIDispatcher />
              <LogoAndTitleOverlay />
            </EgressReadyNotificationProvider>
            {/* <StyleComponent /> */}
          </StreamThemeWrapper>
        </WithCustomActions>
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
      className={cx(
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
