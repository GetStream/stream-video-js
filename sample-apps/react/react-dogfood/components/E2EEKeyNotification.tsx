import { useEffect, useState } from 'react';
import { Notification, useI18n } from '@stream-io/video-react-sdk';
import { useE2eeKeyStatus } from '../hooks/useE2eeKeyStatus';
import { useLobbyE2EE } from '../context/LobbyE2EEContext';

/**
 * Surfaces a shared-key mismatch on an encrypted call.
 *
 * Without this a wrong meeting key looks like a broken call rather than a wrong
 * key: media arrives, fails its authentication tag and is dropped, so tiles stay
 * black and audio silent with nothing said about why.
 *
 * When the failure looks local, the banner doubles as the fix: the key can be
 * re-entered here and is pushed straight to the worker, so a mistyped key does
 * not cost a rejoin. Dismissable, and re-armed once decryption recovers, so a
 * later mismatch is surfaced again rather than nagging about this one.
 */
export const E2EEKeyNotification = () => {
  const status = useE2eeKeyStatus();
  const e2ee = useLobbyE2EE();
  const { t } = useI18n();
  const [dismissed, setDismissed] = useState(false);
  const [draftKey, setDraftKey] = useState('');

  // Re-arm once the call recovers, so a later mismatch is surfaced again.
  useEffect(() => {
    if (status.kind === 'ok') {
      setDismissed(false);
      setDraftKey('');
    }
  }, [status.kind]);

  if (status.kind === 'ok') return null;

  const message =
    status.kind === 'local-key-mismatch' ? (
      <span className="rd__e2ee-key-notification">
        {t(
          "Nobody's audio or video can be decrypted. Your meeting key is most likely wrong.",
        )}
        {e2ee && (
          <form
            className="rd__e2ee-key-notification__form"
            onSubmit={(event) => {
              event.preventDefault();
              const key = draftKey.trim();
              if (!key) return;
              e2ee.updateEncryptionKey(key);
              setDraftKey('');
            }}
          >
            <input
              type="text"
              value={draftKey}
              placeholder={t('Meeting key')}
              aria-label={t('Meeting key')}
              onChange={(event) => setDraftKey(event.target.value)}
            />
            <button type="submit" disabled={!draftKey.trim()}>
              {t('Apply')}
            </button>
          </form>
        )}
      </span>
    ) : (
      `${t('Cannot decrypt participants:')} ${status.names.join(', ')}`
    );

  return (
    <Notification
      isVisible={!dismissed}
      placement="top"
      message={message}
      close={() => setDismissed(true)}
    />
  );
};
