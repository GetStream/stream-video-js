import { useCallback, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Icon } from '@stream-io/video-react-sdk';

export type InvitePanelProps = {
  className?: string;
  callId: string;
  isFocused?: boolean;
};

export const Invite = ({ callId }: { callId: string }) => {
  const URLtoCopy = window.location.href;
  const [isCopied, setIsCopied] = useState(false);

  const copyUrl = useCallback(() => {
    setIsCopied(false);
    try {
      navigator.clipboard
        .writeText(URLtoCopy)
        .then(function (err) {
          console.error('Async: Could not copy text: ', err);
        })
        .finally(() => {
          setIsCopied(true);
        });
    } catch (error) {}
  }, [URLtoCopy]);

  useEffect(() => {
    if (isCopied) {
      setTimeout(() => {
        setIsCopied(false);
      }, 3000);
    }
  }, [isCopied]);

  return (
    <div className="rd__invite__copy">
      <h2 className="rd__invite__copy-header">Share the link</h2>
      <p className="rd__invite__copy-description">
        Click the button below to copy the call link:
      </p>
      <button
        className="rd__button rd__button--primary rd__invite__copy-button"
        onClick={copyUrl}
      >
        <Icon className="rd__button__icon" icon="person-add" />
        {isCopied ? 'Copied invite link' : 'Add more people'}
      </button>
    </div>
  );
};

export const InvitePanel = ({ callId }: InvitePanelProps) => {
  const qrCodeContent = new URL(window.location.toString());
  return (
    <div className="rd__invite">
      <Invite callId={callId} />
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
