import { FC, useCallback, useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import classnames from 'classnames';

import { Copy, UserChecked } from '../Icons';
import Panel from '../Panel';
import Button from '../Button';

import styles from './InvitePanel.module.css';

export type Props = {
  className?: string;
  callId: string;
  isFocused?: boolean;
};

export const Invite: FC<{ callId: string; canShare?: boolean }> = ({
  callId,
  canShare,
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef && inputRef.current) {
      inputRef.current.value = `${window.location.href}?id=${callId}`;
    }
  }, [inputRef, callId]);

  const handleCopy = useCallback(() => {
    if (inputRef && inputRef.current) {
      copyUrl(inputRef?.current?.value);
    }
  }, [inputRef]);

  const copyUrl = useCallback(
    (value: string) => {
      try {
        navigator.clipboard.writeText(value).then(
          function () {
            setIsCopied(!isCopied);
          },
          function (err) {
            console.error('Async: Could not copy text: ', err);
          },
        );
      } catch (error) {}
    },
    [isCopied],
  );

  return (
    <>
      <p className={styles.description}>
        Send the URL below to someone and have them join this private call:
      </p>
      <div className={styles.copy} onClick={() => handleCopy()}>
        {isCopied ? (
          <div className={styles.copied}>
            <UserChecked className={styles.copiedIcon} />

            <span className={styles.copied}>Link copied</span>
            <Copy className={styles.copyIcon} />
          </div>
        ) : (
          <div className={styles.limit}>
            <input ref={inputRef} className={styles.input} readOnly={true} />
            <Copy className={styles.copyIcon} />
          </div>
        )}
      </div>

      {canShare && (
        <Button
          className={styles.share}
          onClick={() =>
            navigator.share({ url: `${window.location.href}?id=${callId}` })
          }
          color="primary"
        >
          Share
        </Button>
      )}
    </>
  );
};

export const InvitePanel: FC<Props> = ({ className, isFocused, callId }) => {
  const [showQr, setShowQr] = useState(false);

  const handleToggleDisplayQr = useCallback(() => {
    setShowQr(!showQr);
  }, [showQr]);

  const rootClassname = classnames(styles.root, className);

  const qrClassNames = classnames(styles.qr, {
    [styles.hide]: showQr === false,
  });

  const showQrIndicatorClassNames = classnames(styles.showQrIndicator, {
    [styles.transform]: showQr === false,
  });

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
          <QRCodeSVG
            className={styles.code}
            value={`${window.location.href}?id=${callId}`}
          />
        </div>
      </>
    </Panel>
  );
};
