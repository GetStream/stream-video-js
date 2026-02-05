import { useCallback, useState } from 'react';
import { OwnCapability } from '@stream-io/video-client';
import { Restricted, useI18n } from '@stream-io/video-react-bindings';
import {
  CallParticipantsList,
  CancelCallButton,
  CompositeButton,
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
} from '../../../components';

import { useLayout } from '../../hooks';
import { Layouts } from '../../layouts';
import {
  CallHeader,
  CameraMenuWithBlur,
  MicMenuWithNoiseCancellation,
} from '../shared';

/**
 * ActiveCall renders the in-call experience with layout, controls, and sidebar.
 * It handles local UI state (sidebar, link copied).
 */
export const ActiveCall = () => {
  const { t } = useI18n();
  const [showParticipants, setShowParticipants] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const { layout } = useLayout();

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
                    {t('Share the link')}
                  </h4>
                  <p className="str-video__embedded-invite-section__description">
                    {t('Click the button below to copy the call link:')}
                  </p>
                  <button
                    type="button"
                    className="str-video__embedded-invite-section__button"
                    onClick={handleCopyInviteLink}
                  >
                    <Icon icon="link-copy" />
                    {linkCopied ? t('Link copied!') : t('Copy invite link')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="str-video__embedded-call-controls str-video__call-controls">
          <div className="str-video__call-controls--group str-video__call-controls--options" />
          <div className="str-video__call-controls--group str-video__call-controls--media">
            <Restricted
              requiredGrants={[OwnCapability.SEND_AUDIO]}
              hasPermissionsOnly
            >
              <MicCaptureErrorNotification>
                <ToggleAudioPublishingButton
                  Menu={<MicMenuWithNoiseCancellation />}
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
                onClick={() => setShowParticipants(!showParticipants)}
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
