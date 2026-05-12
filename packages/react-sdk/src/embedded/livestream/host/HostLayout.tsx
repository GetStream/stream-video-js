import { useCallback, useState } from 'react';
import clsx from 'clsx';
import { OwnCapability } from '@stream-io/video-client';
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
import {
  CameraMenuWithBlur,
  ConnectionNotification,
  ViewersCount,
} from '../../shared';

export type HostViewProps = {
  isLive: boolean;
  isBackstageEnabled: boolean;
  onGoLive: () => void;
  onStopLive: () => void;
};

export const HostLayout = ({
  isLive,
  isBackstageEnabled,
  onGoLive,
  onStopLive,
}: HostViewProps) => {
  const { t } = useI18n();
  const { useParticipantCount, useCallSession } = useCallStateHooks();
  const participantCount = useParticipantCount();
  const session = useCallSession();
  const { elapsed } = useCallDuration(session?.live_started_at);
  const { Component: LayoutComponent, props: layoutProps } = useLayout();
  const [showParticipants, setShowParticipants] = useState(false);

  const handleCloseParticipants = useCallback(() => {
    setShowParticipants(false);
  }, []);

  const handleToggleParticipants = useCallback(() => {
    setShowParticipants((prev) => !prev);
  }, []);

  const livestreamStatus = (
    <div
      className="str-video__embedded-livestream-duration"
      aria-live="polite"
      aria-atomic="true"
    >
      <span
        className={
          isLive
            ? 'str-video__embedded-livestream-duration__live-badge'
            : 'str-video__embedded-livestream-duration__backstage-badge'
        }
      >
        {isLive ? t('Live') : t('Backstage')}
      </span>
      <ViewersCount count={participantCount} />
      {isLive && elapsed && (
        <span className="str-video__embedded-livestream-duration__elapsed">
          {elapsed}
        </span>
      )}
    </div>
  );

  return (
    <div className="str-video__embedded-call str-video__embedded-livestream">
      <ConnectionNotification />
      <PermissionRequests />
      <div className="str-video__embedded-call-header">
        {livestreamStatus}
        <CancelCallConfirmButton />
      </div>
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
            <div className="str-video__embedded-participants">
              <CallParticipantsList onClose={handleCloseParticipants} />
            </div>
          )}
        </div>
      </div>
      <div className="str-video__embedded-call-controls str-video__call-controls">
        <div className="str-video__call-controls--group str-video__call-controls--options">
          <Restricted requiredGrants={[OwnCapability.CREATE_REACTION]}>
            <div className="str-video__embedded-mobile">
              <ReactionsButton />
            </div>
          </Restricted>
          <div className="str-video__embedded-desktop">{livestreamStatus}</div>
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
            <ToggleVideoPublishingButton
              Menu={<CameraMenuWithBlur />}
              menuPlacement="top"
            />
          </Restricted>
          <Restricted requiredGrants={[OwnCapability.CREATE_REACTION]}>
            <div className="str-video__embedded-desktop">
              <ReactionsButton />
            </div>
          </Restricted>
          <Restricted requiredGrants={[OwnCapability.SCREENSHARE]}>
            <div className="str-video__embedded-desktop">
              <ScreenShareButton />
            </div>
          </Restricted>
          <RecordCallConfirmationButton />
          {isBackstageEnabled && (
            <Restricted requiredGrants={[OwnCapability.UPDATE_CALL]}>
              {isLive ? (
                <WithTooltip title={t('End Stream')}>
                  <button
                    type="button"
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
                    type="button"
                    className="str-video__embedded-go-live-button"
                    onClick={onGoLive}
                  >
                    <Icon icon="streaming" />
                    <span>{t('Go Live')}</span>
                  </button>
                </WithTooltip>
              )}
            </Restricted>
          )}
          <div className="str-video__embedded-desktop">
            <CancelCallConfirmButton />
          </div>
        </div>
        <div className="str-video__call-controls--group str-video__call-controls--sidebar">
          <WithTooltip title={t('Participants')}>
            <CompositeButton
              active={showParticipants}
              aria-label={t('Participants')}
              aria-pressed={showParticipants}
              onClick={handleToggleParticipants}
            >
              <Icon icon="participants" />
            </CompositeButton>
          </WithTooltip>
        </div>
      </div>
    </div>
  );
};
