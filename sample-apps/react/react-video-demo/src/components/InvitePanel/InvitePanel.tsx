import { FC, useCallback, useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import classnames from 'classnames';

import { Copy, UserChecked, Reload } from '../Icons';
import Panel from '../Panel';
import Button from '../Button';

import { useUserContext } from '../../contexts/UserContext';

import { useBreakpoint } from '../../hooks/useBreakpoints';

import styles from './InvitePanel.module.css';

export type Props = {
  className?: string;
  callId: string;
  isFocused?: boolean;
  fulllHeight?: boolean;
};

export const Invite: FC<{ callId: string; canShare?: boolean }> = ({
  callId,
  canShare,
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef && inputRef.current) {
      const hasId = new URL(window.location.href).searchParams.has('id');
      if (hasId) {
        inputRef.current.value = `${window.location.href}`;
      } else {
        inputRef.current.value = `${window.location.href}?id=${callId}`;
      }
    }
  }, [inputRef, callId]);

  const handleCopy = useCallback(() => {
    if (inputRef && inputRef.current) {
      copyUrl(inputRef?.current?.value);
    }
  }, [inputRef]);

  const copyUrl = useCallback((value: string) => {
    try {
      navigator.clipboard.writeText(value).then(
        function () {
          setIsCopied(true);
        },
        function (err) {
          console.error('Async: Could not copy text: ', err);
        },
      );
    } catch (error) {}
  }, []);

  const copiedClasses = classnames(styles.copied, {
    [styles.isCopied]: isCopied,
  });

  const limitClasses = classnames(styles.limit, {
    [styles.canCopy]: isCopied === false,
  });

  return (
    <>
      <p className={styles.description}>
        Send the URL below to someone and have them join this private call:
      </p>
      <div className={styles.copy}>
        <div className={copiedClasses} onClick={() => setIsCopied(false)}>
          <UserChecked className={styles.copiedIcon} />

          <span className={copiedClasses}>Link copied</span>
          <Reload className={styles.reload} />
        </div>

        <div className={limitClasses} onClick={() => handleCopy()}>
          <input ref={inputRef} className={styles.input} readOnly={true} />
          <Copy className={styles.copyIcon} />
        </div>
      </div>

      {canShare && (
        <Button
          className={styles.share}
          onClick={() => navigator.share({ url: `${window.location.href}` })}
          color="primary"
        >
          Share
        </Button>
      )}
    </>
  );
};

export const InvitePanel: FC<Props> = ({
  className,
  isFocused,
  callId,
  fulllHeight,
}) => {
  const [showQr, setShowQr] = useState(false);
  const { qr } = useUserContext();
  const breakpoint = useBreakpoint();

  useEffect(() => {
    if (breakpoint === 'lg') {
      setShowQr(true);
    }
  }, [breakpoint]);

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

        {Boolean(qr) ? (
          <>
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
        ) : null}
      </>
    </Panel>
  );
};
