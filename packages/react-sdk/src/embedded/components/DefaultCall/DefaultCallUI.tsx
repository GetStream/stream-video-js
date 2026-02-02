import { useCallback, useEffect, useState } from 'react';
import { CallingState, OwnCapability } from '@stream-io/video-client';
import {
  Restricted,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-bindings';
import {
  CallParticipantsList,
  CancelCallButton,
  CompositeButton,
  Icon,
  PermissionRequests,
  ReactionsButton,
  RecordCallConfirmationButton,
  ScreenShareButton,
  SpeakingWhileMutedNotification,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
  WithTooltip,
} from '../../../components';

import { useLayoutSwitcher, useWakeLock } from '../../hooks';
import { Layouts } from '../../layouts';
import { Lobby } from './Lobby';
import {
  CallHeader,
  ConnectionNotification,
  LoadingScreen,
  ToggleLayoutButton,
  CameraMenuWithBlur,
  MicMenuWithNoiseCancellation,
} from '../shared';
import { usePersistedDevicePreferences } from '../../../hooks';

const DEVICE_PREFERENCES_KEY = '@stream-io/embedded-device-preferences';

type DefaultCallUIProps = {
  skipLobby?: boolean;
};

type ViewState = 'lobby' | 'loading' | 'active-call';

const DefaultCallUI = ({ skipLobby = false }: DefaultCallUIProps) => {
  const call = useCall();
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const [showParticipants, setShowParticipants] = useState(false);
  const [view, setView] = useState<ViewState>('lobby');

  const { layout, setLayout } = useLayoutSwitcher();

  usePersistedDevicePreferences(DEVICE_PREFERENCES_KEY);
  useWakeLock();

  const onJoin = useCallback(async () => {
    if (!call) return;

    setView('loading');

    try {
      if (call.state.callingState !== CallingState.JOINED) {
        await call.join({ create: true });
      }
      setView('active-call');
    } catch (err) {
      console.error('Failed to join call:', err);
    }
  }, [call]);

  useEffect(() => {
    if (callingState === CallingState.JOINED) {
      setView('active-call');
    }
  }, [callingState]);

  if (view === 'lobby') {
    return <Lobby onJoin={onJoin} skipLobby={skipLobby} />;
  }

  if (view === 'loading') {
    return <LoadingScreen />;
  }

  const layoutConfig = Layouts[layout];
  const LayoutComponent = layoutConfig.Component;
  const layoutProps = layoutConfig.props ?? {};

  return (
    <div className="str-video__embedded-call">
      <div className="str-video__embedded-main-panel">
        <CallHeader />
        <PermissionRequests />
        <div className="str-video__embedded-notifications">
          <Restricted
            requiredGrants={[OwnCapability.SEND_AUDIO]}
            hasPermissionsOnly
          >
            <SpeakingWhileMutedNotification />
          </Restricted>
        </div>
        <div className="str-video__embedded-layout">
          <div className="str-video__embedded-layout__stage">
            <LayoutComponent {...layoutProps} />
          </div>

          <div
            className={`str-video__embedded-sidebar${showParticipants ? ' str-video__embedded-sidebar--open' : ''}`}
          >
            {showParticipants && (
              <div className="str-video__embedded-sidebar__container">
                <div className="str-video__embedded-participants">
                  <CallParticipantsList
                    onClose={() => setShowParticipants(false)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="str-video__embedded-call-controls str-video__call-controls">
          <div className="str-video__call-controls--group str-video__call-controls--options">
            <ToggleLayoutButton
              selectedLayout={layout}
              onMenuItemClick={setLayout}
            />
          </div>
          <div className="str-video__call-controls--group str-video__call-controls--media">
            <Restricted
              requiredGrants={[OwnCapability.SEND_AUDIO]}
              hasPermissionsOnly
            >
              <div className="str-video__embedded-dual-toggle">
                <ToggleAudioPublishingButton
                  Menu={<MicMenuWithNoiseCancellation />}
                  menuPlacement="top"
                />
              </div>
            </Restricted>
            <Restricted
              requiredGrants={[OwnCapability.SEND_VIDEO]}
              hasPermissionsOnly
            >
              <div className="str-video__embedded-dual-toggle">
                <ToggleVideoPublishingButton
                  Menu={<CameraMenuWithBlur />}
                  menuPlacement="top"
                />
              </div>
            </Restricted>
            <Restricted requiredGrants={[OwnCapability.CREATE_REACTION]}>
              <ReactionsButton />
            </Restricted>
            <Restricted requiredGrants={[OwnCapability.SCREENSHARE]}>
              <ScreenShareButton />
            </Restricted>
            <RecordCallConfirmationButton />
            <CancelCallButton />
          </div>
          <div className="str-video__call-controls--group str-video__call-controls--sidebar">
            <WithTooltip title="Participants">
              <CompositeButton
                active={showParticipants}
                onClick={() => setShowParticipants(!showParticipants)}
              >
                <Icon icon="participants" />
              </CompositeButton>
            </WithTooltip>
          </div>
        </div>
        <ConnectionNotification />
      </div>
    </div>
  );
};

export default DefaultCallUI;
