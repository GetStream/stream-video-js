import { useCallback, useState } from 'react';
import clsx from 'clsx';
import { OwnCapability, humanize } from '@stream-io/video-client';
import {
  Restricted,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-bindings';
import { useLayout } from '../../hooks';
import {
  CallParticipantsList,
  CancelCallConfirmButton,
  CompositeButton,
  DeviceSelectorAudioInput,
  DeviceSelectorAudioOutput,
  Icon,
  MicCaptureErrorNotification,
  PermissionRequests,
  ReactionsButton,
  RecordCallConfirmationButton,
  ScreenShareButton,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
  WithTooltip,
} from '../../../components';
import { useCallDuration } from '../../hooks';
import { CameraMenuWithBlur, ConnectionNotification } from '../../shared';

const StartBroadcastIcon = () => (
  <svg
    width="20"
    height="14"
    viewBox="0 0 25 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.2 14.3C5.84 12.95 5 11.07 5 9s.84-3.95 2.2-5.3l1.78 1.77A4.97 4.97 0 007.5 9c0 1.38.56 2.62 1.46 3.54L7.2 14.3zM17.8 14.3c1.36-1.35 2.2-3.23 2.2-5.3s-.84-3.95-2.2-5.3l-1.78 1.77A4.97 4.97 0 0117.5 9c0 1.38-.56 2.62-1.46 3.54l1.76 1.76zM12.5 6.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM22.5 9c0 2.76-1.13 5.26-2.94 7.06l1.78 1.78A12.44 12.44 0 0025 9c0-3.45-1.4-6.58-3.66-8.84l-1.78 1.78A9.97 9.97 0 0122.5 9zM5.44 1.94L3.66.16A12.44 12.44 0 000 9c0 3.45 1.4 6.58 3.66 8.84l1.78-1.78A9.97 9.97 0 012.5 9c0-2.76 1.13-5.26 2.94-7.06z"
      fill="currentColor"
    />
  </svg>
);

export type HostViewProps = {
  isLive: boolean;
  isBackstageEnabled: boolean;
  onGoLive: () => void;
  onStopLive: () => void;
};

export const HostView = ({
  isLive,
  isBackstageEnabled,
  onGoLive,
  onStopLive,
}: HostViewProps) => {
  const { t } = useI18n();
  const { useParticipantCount } = useCallStateHooks();
  const participantCount = useParticipantCount();
  const { elapsed } = useCallDuration({ source: 'live' });
  const { Component: LayoutComponent, props: layoutProps } = useLayout();
  const [showParticipants, setShowParticipants] = useState(false);

  const handleCloseParticipants = useCallback(() => {
    setShowParticipants(false);
  }, []);

  const handleToggleParticipants = useCallback(() => {
    setShowParticipants((prev) => !prev);
  }, []);

  return (
    <div className="str-video__embedded-call str-video__embedded-livestream">
      <div className="str-video__embedded-main-panel">
        <ConnectionNotification />
        <PermissionRequests />
        <div className="str-video__embedded-layout">
          <div className="str-video__embedded-layout__stage">
            <LayoutComponent {...layoutProps} />
          </div>

          <div
            className={clsx(
              'str-video__embedded-sidebar',
              showParticipants && 'str-video__embedded-sidebar--open',
            )}
          >
            {showParticipants && (
              <div className="str-video__embedded-sidebar__container">
                <div className="str-video__embedded-participants">
                  <CallParticipantsList onClose={handleCloseParticipants} />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="str-video__embedded-call-controls str-video__call-controls">
          <div className="str-video__call-controls--group str-video__call-controls--options">
            <div className="str-video__embedded-livestream-duration">
              <span
                className={
                  isLive
                    ? 'str-video__embedded-livestream-duration__live-badge'
                    : 'str-video__embedded-livestream-duration__backstage-badge'
                }
              >
                {isLive ? t('Live') : t('Backstage')}
              </span>
              <div className="str-video__embedded-livestream-duration__viewers">
                <Icon
                  icon="eye"
                  className="str-video__embedded-livestream-duration__eye-icon"
                />
                <span className="str-video__embedded-livestream-duration__count">
                  {humanize(participantCount)}
                </span>
              </div>
              {isLive && elapsed && (
                <span className="str-video__embedded-livestream-duration__elapsed">
                  {elapsed}
                </span>
              )}
            </div>
          </div>
          <div className="str-video__call-controls--group str-video__call-controls--media">
            <Restricted
              requiredGrants={[OwnCapability.SEND_AUDIO]}
              hasPermissionsOnly
            >
              <MicCaptureErrorNotification>
                <ToggleAudioPublishingButton
                  Menu={
                    <>
                      <DeviceSelectorAudioOutput
                        visualType="list"
                        title={t('Speaker')}
                      />
                      <DeviceSelectorAudioInput
                        visualType="list"
                        title={t('Microphone')}
                      />
                    </>
                  }
                  menuPlacement="top"
                />
              </MicCaptureErrorNotification>
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
            {isBackstageEnabled && (
              <Restricted requiredGrants={[OwnCapability.UPDATE_CALL]}>
                {isLive ? (
                  <WithTooltip title={t('End Stream')}>
                    <button
                      className="str-video__embedded-end-stream-button"
                      onClick={onStopLive}
                    >
                      <Icon icon="call-end" />
                      <span>{t('Stop Live')}</span>
                    </button>
                  </WithTooltip>
                ) : (
                  <WithTooltip title={t('Start Stream')}>
                    <button
                      className="str-video__embedded-go-live-button"
                      onClick={onGoLive}
                    >
                      <StartBroadcastIcon />
                      <span>{t('Go Live')}</span>
                    </button>
                  </WithTooltip>
                )}
              </Restricted>
            )}
            <CancelCallConfirmButton />
          </div>
          <div className="str-video__call-controls--group str-video__call-controls--sidebar">
            <WithTooltip title={t('Participants')}>
              <CompositeButton
                active={showParticipants}
                onClick={handleToggleParticipants}
              >
                <Icon icon="participants" />
              </CompositeButton>
            </WithTooltip>
          </div>
        </div>
      </div>
    </div>
  );
};
