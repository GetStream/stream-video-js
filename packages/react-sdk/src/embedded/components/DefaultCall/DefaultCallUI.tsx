import { useCallback, useRef, useState } from 'react';
import { CallingState, OwnCapability } from '@stream-io/video-client';
import {
  Restricted,
  useCall,
  useCallStateHooks,
  useConnectedUser,
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
  CameraMenuWithBlur,
  ConnectionNotification,
  LoadingScreen,
  MicMenuWithNoiseCancellation,
  ToggleLayoutButton,
} from '../shared';
import { CallFeedback } from '../CallFeedback';
import { usePersistedDevicePreferences } from '../../../hooks';
import type { CallTypeUIProps } from '../CallRouter';

const DEVICE_PREFERENCES_KEY = '@stream-io/embedded-device-preferences';

/**
 * Derives the current view from callingState and user intent.
 * - 'lobby': User hasn't initiated join yet
 * - 'loading': Join initiated, waiting for JOINED state
 * - 'active-call': Currently in call (JOINED state)
 * - 'feedback': Call ended (LEFT state after being in call)
 */
type ViewState = 'lobby' | 'loading' | 'active-call' | 'feedback';

const DefaultCallUI = ({ onJoin }: CallTypeUIProps) => {
  const call = useCall();
  const connectedUser = useConnectedUser();
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const [showParticipants, setShowParticipants] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const [hasInitiatedJoin, setHasInitiatedJoin] = useState(false);
  const wasInCallRef = useRef(false);

  const { layout, setLayout } = useLayoutSwitcher();

  usePersistedDevicePreferences(DEVICE_PREFERENCES_KEY);
  useWakeLock();

  if (callingState === CallingState.JOINED) {
    wasInCallRef.current = true;
  }

  const view: ViewState = (() => {
    if (callingState === CallingState.JOINED) {
      return 'active-call';
    }
    if (callingState === CallingState.LEFT && wasInCallRef.current) {
      return 'feedback';
    }
    if (hasInitiatedJoin) {
      return 'loading';
    }
    return 'lobby';
  })();

  const handleJoin = useCallback(
    async (displayName?: string) => {
      const trimmedName = displayName?.trim();
      const nameChanged = trimmedName && trimmedName !== connectedUser?.name;

      if (nameChanged && onJoin) {
        onJoin(trimmedName);
        return;
      }

      if (!call) return;

      setHasInitiatedJoin(true);

      try {
        if (call.state.callingState !== CallingState.JOINED) {
          await call.join({ create: true });
        }
      } catch (err) {
        console.error('Failed to join call:', err);
        setHasInitiatedJoin(false);
      }
    },
    [call, onJoin, connectedUser?.name],
  );

  const handleRejoin = useCallback(async () => {
    if (!call) return;

    wasInCallRef.current = false;
    setHasInitiatedJoin(true);

    try {
      await call.join();
    } catch (err) {
      console.error('Failed to rejoin call:', err);
      setHasInitiatedJoin(false);
      wasInCallRef.current = true;
    }
  }, [call]);

  const handleFeedbackSubmit = useCallback((rating: number) => {
    console.log(rating);
  }, []);

  const handleCopyInviteLink = useCallback(async () => {
    const link = window.location.href;
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  }, []);

  if (view === 'lobby') {
    return <Lobby onJoin={handleJoin} />;
  }

  if (view === 'loading') {
    return <LoadingScreen />;
  }

  if (view === 'feedback') {
    return (
      <CallFeedback onSubmit={handleFeedbackSubmit} onRejoin={handleRejoin} />
    );
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
                <div className="str-video__embedded-invite-section">
                  <h4 className="str-video__embedded-invite-section__title">
                    Share the link
                  </h4>
                  <p className="str-video__embedded-invite-section__description">
                    Click the button below to copy the call link:
                  </p>
                  <button
                    type="button"
                    className="str-video__embedded-invite-section__button"
                    onClick={handleCopyInviteLink}
                  >
                    <Icon icon="link-copy" />
                    {linkCopied ? 'Link copied!' : 'Copy invite link'}
                  </button>
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
