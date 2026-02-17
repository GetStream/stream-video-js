import { useCallback, useState } from 'react';
import clsx from 'clsx';
import { OwnCapability } from '@stream-io/video-client';
import {
  Restricted,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-bindings';
import { useCallDuration, useLayout } from '../../hooks';
import {
  CallParticipantsList,
  CancelCallConfirmButton,
  CompositeButton,
  DeviceSelectorAudioInput,
  DeviceSelectorAudioOutput,
  Icon,
  MicCaptureErrorNotification,
  ReactionsButton,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
  WithTooltip,
} from '../../../components';
import { CameraMenuWithBlur, ViewersCount } from '../../shared';

export const ViewerView = () => {
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
      <div className="str-video__embedded-call-header">
        <div className="str-video__embedded-livestream-duration">
          <span className="str-video__embedded-livestream-duration__live-badge">
            {t('Live')}
          </span>
          <ViewersCount count={participantCount} />
          {elapsed && (
            <span className="str-video__embedded-livestream-duration__elapsed">
              {elapsed}
            </span>
          )}
        </div>
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
          <div className="str-video__embedded-desktop">
            <div className="str-video__embedded-livestream-duration">
              <span className="str-video__embedded-livestream-duration__live-badge">
                {t('Live')}
              </span>
              <ViewersCount count={participantCount} />
              {elapsed && (
                <span className="str-video__embedded-livestream-duration__elapsed">
                  {elapsed}
                </span>
              )}
            </div>
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
          <div className="str-video__embedded-desktop">
            <CancelCallConfirmButton />
          </div>
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
  );
};
