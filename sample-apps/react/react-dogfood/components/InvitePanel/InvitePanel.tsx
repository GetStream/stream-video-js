import { useCallback, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Icon, IconButton } from '@stream-io/video-react-sdk';
import { useIsDemoEnvironment } from '../../context/AppEnvironmentContext';
import { useAppI18n } from '../../hooks/useAppI18n';

/**
 * Builds the URL encoded in the invite QR code: the current location with every
 * query param preserved (`encryption_key`, `environment`, ...) plus `from_qr`.
 */
const buildQrCodeUrl = () => {
  const { origin, pathname, search, hash } = window.location;
  const params = new URLSearchParams(search);
  params.set('from_qr', 'true');
  return `${origin}${pathname}?${params.toString()}${hash}`;
};

export const InvitePopup = ({
  callId,
  close,
}: {
  callId: string;
  close: () => void;
}) => {
  const { t } = useAppI18n();
  const { isCopied, copyInviteLink } = useCopyInviteLink();

  const qrCodeContent = buildQrCodeUrl();

  return (
    <div className="rd__invite-popup">
      <div className="rd__invite-popup__header">
        <h2 className="rd__invite-popup__heading">
          {t('invite.meetingLive.title', 'Your meeting is live!')}
        </h2>
        <IconButton
          className="rd__invite-popup__close"
          icon="close"
          onClick={close}
          size="sm"
          variant="secondary"
        />
      </div>

      <button
        className="rd__button rd__button--primary rd__invite-popup__button"
        onClick={copyInviteLink}
      >
        <Icon className="rd__button__icon" icon="person-add" />
        {isCopied ? 'Copied invite link' : 'Copy invite link'}
      </button>

      <p className="rd__invite-popup__description">
        {t(
          'invite.shareCallId.description',
          'Or share this call ID with the others you want in the meeting:',
        )}
      </p>
      <div className="rd__invite-popup__id" onClick={copyInviteLink}>
        <div>
          {t('invite.callId.label', 'Call ID:')}
          <span className="rd__invite-popup__id-text">{callId}</span>
        </div>
        <Icon className="rd__invite-popup__id-button" icon="copy" />
      </div>
      <div className="rd__invite-popup__qr-container" title={qrCodeContent}>
        <p className="rd__invite-popup__qr-description">
          To test on a mobile device, scan the QR Code below:
        </p>
        <QRCodeSVG
          className="rd__invite-popup__qr-code"
          value={qrCodeContent}
        />
      </div>
    </div>
  );
};

export const Invite = () => {
  const { t } = useAppI18n();
  const { isCopied, copyInviteLink } = useCopyInviteLink();
  return (
    <div className="rd__invite__copy">
      <h2 className="rd__invite__copy-header">
        {t('invite.shareTheLink.title', 'Share the link')}
      </h2>
      <p className="rd__invite__copy-description">
        {t(
          'invite.copyLink.description',
          'Click the button below to copy the call link:',
        )}
      </p>
      <button
        className="rd__button rd__button--primary rd__invite__copy-button"
        onClick={copyInviteLink}
      >
        <Icon className="rd__button__icon" icon="person-add" />
        {isCopied
          ? t('invite.copiedInviteLink.label', 'Copied invite link')
          : t('invite.copyInviteLink.label', 'Copy invite link')}
      </button>
    </div>
  );
};

export const InvitePanel = () => {
  const { t } = useAppI18n();
  const isDemoEnvironment = useIsDemoEnvironment();
  const [expanded, setExpanded] = useState(false);

  const qrCodeContent = buildQrCodeUrl();
  return (
    <div className="rd__invite">
      <Invite />
      <div className="rd__invite__qr">
        {!isDemoEnvironment ? (
          <>
            <h2
              className="rd__invite__qr-header rd__invite__qr-header--accordion"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {t('invite.testOnMobile.title', 'Test on mobile')}
              <Icon
                className="rd__invite__qr-chevron"
                icon={expanded ? 'chevron-up' : 'chevron-down'}
              />
            </h2>
            {expanded && (
              <>
                <p className="rd__invite__qr-description">
                  {t(
                    'invite.testOnMobile.description',
                    'To test on a mobile device, scan the QR Code below:',
                  )}
                </p>
                <div className="rd__invite__qr-container" title={qrCodeContent}>
                  <QRCodeSVG
                    className="rd__invite__qr-code"
                    value={qrCodeContent}
                  />
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <h2 className="rd__invite__qr-header">
              {t('invite.testOnMobile.title', 'Test on mobile')}
            </h2>
            <p className="rd__invite__qr-description">
              {t(
                'invite.testOnMobile.description',
                'To test on a mobile device, scan the QR Code below:',
              )}
            </p>
            <div className="rd__invite__qr-container" title={qrCodeContent}>
              <QRCodeSVG
                className="rd__invite__qr-code"
                value={qrCodeContent}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const useCopyInviteLink = () => {
  const [isCopied, setIsCopied] = useState(false);
  const copyInviteLink = useCallback(() => {
    setIsCopied(false);
    const url = window.location.href;
    navigator.clipboard
      .writeText(url)
      .catch((err) => console.error('could not copy invite link', err))
      .finally(() => setIsCopied(true));
  }, []);

  useEffect(() => {
    if (!isCopied) return;
    const id = setTimeout(() => {
      setIsCopied(false);
    }, 3000);
    return () => clearTimeout(id);
  }, [isCopied]);

  return { isCopied, copyInviteLink };
};
