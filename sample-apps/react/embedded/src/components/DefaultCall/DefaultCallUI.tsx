import { useCallback, useEffect, useState } from 'react';
import {
  CallingState,
  CallParticipantsList,
  CancelCallButton,
  CompositeButton,
  DeviceSelectorAudioInput,
  DeviceSelectorAudioOutput,
  DeviceSelectorVideo,
  Icon,
  LoadingIndicator,
  OwnCapability,
  ReactionsButton,
  Restricted,
  ScreenShareButton,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
  useCall,
  useCallStateHooks,
  WithTooltip,
} from '@stream-io/video-react-sdk';

import { useLayoutSwitcher } from '../../hooks';
import { ToggleLayoutButton } from '../LayoutSelector';
import { Layouts } from '../../layouts/LayoutMap';
import { Lobby } from '../Lobby';
import CallHeader from '../CallHeader/CallHeader.tsx';
import { ConnectionNotification } from '../ConnectionNotification';

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

  const onJoin = useCallback(async () => {
    if (!call) return;

    setView('loading');

    try {
      if (call.state.callingState !== CallingState.JOINED) {
        await call.join();
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
    return (
      <div className="str-video__call">
        <div className="str-video__call__loading-screen">
          <LoadingIndicator />
        </div>
      </div>
    );
  }

  const layoutConfig = Layouts[layout];
  const LayoutComponent = layoutConfig.Component;
  const layoutProps = layoutConfig.props ?? {};

  return (
    <div className="rd__call">
      <div className="rd__main-call-panel">
        <CallHeader />
        <div className="rd__layout">
          <div className="rd__layout__stage-container">
            <LayoutComponent {...layoutProps} />
          </div>

          <div
            className={`rd__sidebar${showParticipants ? ' rd__sidebar--open' : ''}`}
          >
            {showParticipants && (
              <div className="rd__sidebar__container">
                <div className="rd__participants">
                  <CallParticipantsList
                    onClose={() => setShowParticipants(false)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="str-video__call-controls">
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
              <div className="rd__dual-toggle">
                <ToggleAudioPublishingButton
                  Menu={
                    <>
                      <DeviceSelectorAudioOutput
                        visualType="list"
                        title="Speaker"
                      />
                      <DeviceSelectorAudioInput
                        visualType="list"
                        title="Microphone"
                      />
                    </>
                  }
                  menuPlacement="top"
                />
              </div>
            </Restricted>
            <Restricted
              requiredGrants={[OwnCapability.SEND_VIDEO]}
              hasPermissionsOnly
            >
              <div className="rd__dual-toggle">
                <ToggleVideoPublishingButton
                  Menu={<DeviceSelectorVideo visualType="list" />}
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
