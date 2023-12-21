import { useCallback, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Icon, IconButton, useI18n } from '@stream-io/video-react-sdk';

export const InvitePopup = ({
  callId,
  close,
}: {
  callId: string;
  close: () => void;
}) => {
  const { t } = useI18n();
  const { isCopied, copyInviteLink } = useCopyInviteLink();

  const qrCodeContent = new URL(window.location.toString());

  return (
    <div className="rd__invite-popup">
      <div className="rd__invite-popup__header">
        <h2 className="rd__invite-popup__heading">
          {t('Your meeting is live!')}
        </h2>
        <IconButton
          className="rd__invite-popup__close"
          icon="close"
          onClick={close}
        />
      </div>

      <button
        className="rd__button rd__button--primary rd__invite-popup__button"
        onClick={copyInviteLink}
      >
        <Icon className="rd__button__icon" icon="person-add" />
        {isCopied ? 'Copied invite link' : 'Add others'}
      </button>

      <p className="rd__invite-popup__description">
        {t('Or share this call ID with the others you want in the meeting:')}
      </p>
      <div className="rd__invite-popup__id" onClick={copyInviteLink}>
        <div>
          {t('Call ID:')}
          <span className="rd__invite-popup__id-text">{callId}</span>
        </div>
        <Icon className="rd__invite-popup__id-button" icon="copy" />
      </div>
      <div className="rd__invite-popup__qr-container">
        <p className="rd__invite-popup__qr-description">
          To test on a mobile device, can the QR Code below:
        </p>
        <QRCodeSVG
          className="rd__invite-popup__qr-code"
          value={qrCodeContent.toString()}
        />
      </div>
    </div>
  );
};

export const Invite = () => {
  const { isCopied, copyInviteLink } = useCopyInviteLink();
  return (
    <div className="rd__invite__copy">
      <h2 className="rd__invite__copy-header">Share the link</h2>
      <p className="rd__invite__copy-description">
        Click the button below to copy the call link:
      </p>
      <button
        className="rd__button rd__button--primary rd__invite__copy-button"
        onClick={copyInviteLink}
      >
        <Icon className="rd__button__icon" icon="person-add" />
        {isCopied ? 'Copied invite link' : 'Add more people'}
      </button>
    </div>
  );
};

export const InvitePanel = () => {
  const qrCodeContent = new URL(window.location.toString());
  return (
    <div className="rd__invite">
      <Invite />
      <div className="rd__invite__qr">
        <h2 className="rd__invite__qr-header">Test on mobile</h2>
        <p className="rd__invite__qr-description">
          To test on a mobile device, can the QR Code below:
        </p>
        <div className="rd__invite__qr-container">
          <QRCodeSVG
            className="rd__invite__qr-code"
            value={qrCodeContent.toString()}
          />
        </div>
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
