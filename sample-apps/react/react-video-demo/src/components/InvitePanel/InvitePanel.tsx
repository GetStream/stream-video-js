import { useCallback, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import classnames from 'classnames';

import { Copy, Reload, UserChecked } from '../Icons';
import Panel from '../Panel';

import { usePanelContext, PANEL_VISIBILITY } from '../../contexts/PanelContext';

import { useBreakpoint } from '../../hooks/useBreakpoints';

import styles from './InvitePanel.module.css';

export type InvitePanelProps = {
  className?: string;
  callId: string;
  isFocused?: boolean;
};

export const Invite = ({
  callId,
  canShare,
}: {
  callId: string;
  canShare?: boolean;
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const hasId = new URL(window.location.href).searchParams.has('id');
  const URLtoCopy = `${window.location.href}${!hasId ? `?id=${callId}` : ''}`;

  const copyUrl = useCallback(() => {
    try {
      navigator.clipboard.writeText(URLtoCopy).then(
        function () {
          setIsCopied(true);
        },
        function (err) {
          console.error('Async: Could not copy text: ', err);
        },
      );
    } catch (error) {}
  }, [URLtoCopy]);

  const copiedClasses = classnames(styles.copied);

  const copyButtonClasses = classnames(styles.copyButton);

  return (
    <>
      <p className={styles.description}>
        Send the URL below to someone and have them join this private call:
      </p>
      <div className={styles.copy}>
        {isCopied ? (
          <div className={copiedClasses} onClick={() => setIsCopied(false)}>
            <UserChecked className={styles.copiedIcon} />

            <span>Link copied</span>
            <Reload className={styles.reload} />
          </div>
        ) : (
          <div className={copyButtonClasses} onClick={copyUrl}>
            <div className={styles.url}>{URLtoCopy}</div>
            <Copy className={styles.copyIcon} />
          </div>
        )}
      </div>

      {canShare && (
        <button
          className={styles.share}
          onClick={() => navigator.share({ url: `${window.location.href}` })}
        >
          Share
        </button>
      )}
    </>
  );
};

export const InvitePanel = ({
  className,
  isFocused,
  callId,
}: InvitePanelProps) => {
  const [showQr, setShowQr] = useState(true);
  const breakpoint = useBreakpoint();

  const { qrCodeVisibility } = usePanelContext();

  useEffect(() => {
    if (qrCodeVisibility === PANEL_VISIBILITY.collapsed) {
      setShowQr(false);
    } else {
      if (breakpoint === 'lg') {
        setShowQr(true);
      }
    }
  }, [breakpoint, qrCodeVisibility]);

  const handleToggleDisplayQr = useCallback(() => {
    setShowQr((prev) => !prev);
  }, []);

  const rootClassname = classnames(styles.root, className);

  const qrClassNames = classnames(styles.qr, {
    [styles.hide]: showQr,
  });

  const showQrIndicatorClassNames = classnames(styles.showQrIndicator, {
    [styles.transform]: showQr,
  });

  const qrCodeContent = new URL(window.location.toString());
  qrCodeContent.searchParams.set('id', callId);

  return (
    <Panel
      className={rootClassname}
      title="Invite more people"
      isFocused={isFocused}
    >
      <>
        <Invite callId={callId} canShare={false} />
        <p className={styles.description} onClick={handleToggleDisplayQr}>
          Or scan the QR code with your phone to test it yourself:
          <span className={showQrIndicatorClassNames}>▼</span>
        </p>

        <div className={qrClassNames}>
          <QRCodeSVG className={styles.code} value={qrCodeContent.toString()} />
        </div>
      </>
    </Panel>
  );
};
