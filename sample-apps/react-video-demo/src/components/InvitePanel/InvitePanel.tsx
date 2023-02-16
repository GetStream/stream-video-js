import { FC, useCallback, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import classnames from 'classnames';

import { Copy, UserChecked } from '../Icons';
import Panel from '../Panel';

import styles from './InvitePanel.module.css';

export type Props = {
  className?: string;
  callId: string;
  isFocused?: boolean;
};

export const InvitePanel: FC<Props> = ({ className, isFocused, callId }) => {
  const [isCopied, setIsCopied] = useState(false);

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

  const rootClassname = classnames(styles.root, className);

  return (
    <Panel
      className={rootClassname}
      title="Invite more people"
      isFocused={isFocused}
    >
      <>
        <p className={styles.description}>
          Send the URL below to someone and have them join this private call:
        </p>
        <div className={styles.copy}>
          {isCopied ? (
            <div className={styles.copied}>
              <UserChecked className={styles.copiedIcon} />

              <span className={styles.copied}>Link copied</span>
              <Copy className={styles.copyIcon} />
            </div>
          ) : (
            <>
              <input
                className={styles.input}
                value={callId}
                onClick={(e) => copyUrl(e.currentTarget.value)}
                readOnly={true}
              />
              <Copy className={styles.copyIcon} />
            </>
          )}
        </div>

        <p className={styles.description}>
          Or scan the QR code with your phone to test it yourself:
        </p>
        <div className={styles.qr}>
          <QRCodeSVG className={styles.code} value={callId} />
        </div>
      </>
    </Panel>
  );
};
