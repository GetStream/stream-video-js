import { useCallback, useState } from 'react';
import { OwnCapability } from '@stream-io/video-client';
import { Restricted, useI18n } from '@stream-io/video-react-bindings';
import {
  CallParticipantsList,
  CancelCallButton,
  CompositeButton,
  DeviceSelectorAudioInput,
  DeviceSelectorAudioOutput,
  Icon,
  MicCaptureErrorNotification,
  PermissionRequests,
  ReactionsButton,
  RecordCallConfirmationButton,
  ScreenShareButton,
  SpeakingWhileMutedNotification,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
  WithTooltip,
} from '../../components';

import { useLayout } from '../hooks';
import {
  CallDuration,
  CameraMenuWithBlur,
  ConnectionNotification,
} from '../shared';

/**
 * ActiveCall renders the in-call experience with layout, controls, and sidebar.
 */
export const ActiveCall = () => {
  const { t } = useI18n();
  const [showParticipants, setShowParticipants] = useState(false);

  const { Component: LayoutComponent, props: layoutProps } = useLayout();

  const handleCloseParticipants = useCallback(() => {
    setShowParticipants(false);
  }, []);

  const handleToggleParticipants = useCallback(() => {
    setShowParticipants((prev) => !prev);
  }, []);

  return (
    <div className="str-video__embedded-call">
      <div className="str-video__embedded-main-panel">
        <ConnectionNotification />
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
                  <CallParticipantsList onClose={handleCloseParticipants} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="str-video__embedded-call-controls str-video__call-controls">
          <div className="str-video__call-controls--group str-video__call-controls--options">
            <CallDuration />
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
            <CancelCallButton />
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
