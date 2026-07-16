import { useCallback, useRef, useState } from 'react';
import { useI18n } from '@stream-io/video-react-sdk';
import clsx from 'clsx';

import { LockIcon } from './LockIcon';
import { getRandomWords } from '../lib/names';
import { useLobbyE2EE } from '../context/LobbyE2EEContext';

/**
 * Lobby control that turns on end-to-end encryption for the call and manages the
 * shared room key.
 *
 * Encryption is fixed at call creation, so toggling delegates to the call page
 * (via {@link useLobbyE2EE}), which swaps the active call for a freshly created
 * one in place - no navigation, no remount. The switch state is kept locally and
 * optimistic so the key appears immediately; the shared key is client-side only,
 * so editing it updates the current call without creating a new one.
 *
 * Rendered only in the `pronto` environment (gated by the caller).
 */
export const LobbyEncryption = () => {
  const { t } = useI18n();
  const e2ee = useLobbyE2EE();

  const [enabled, setEnabled] = useState(!!e2ee?.encryptionKey);
  const [encryptionKey, setEncryptionKey] = useState(e2ee?.encryptionKey ?? '');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyResetRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const onToggle = useCallback(async () => {
    if (!e2ee || busy) return;
    if (!enabled) {
      const key = encryptionKey || getRandomWords(3);
      setEncryptionKey(key);
      setEnabled(true); // optimistic: reveal the key right away
      try {
        setBusy(true);
        await e2ee.enableEncryption(key);
      } catch (err) {
        console.error('Failed to enable encryption', err);
        setEnabled(false);
      } finally {
        setBusy(false);
      }
    } else {
      setEnabled(false);
      try {
        setBusy(true);
        await e2ee.disableEncryption();
      } catch (err) {
        console.error('Failed to disable encryption', err);
        setEnabled(true);
      } finally {
        setBusy(false);
      }
    }
  }, [e2ee, busy, enabled, encryptionKey]);

  const onKeyChange = useCallback(
    (value: string) => {
      setEncryptionKey(value);
      if (enabled) e2ee?.updateEncryptionKey(value);
    },
    [e2ee, enabled],
  );

  const onCopyLink = useCallback(() => {
    if (typeof window === 'undefined') return;
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        setCopied(true);
        clearTimeout(copyResetRef.current);
        copyResetRef.current = setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => console.error('Failed to copy invite link', err));
  }, []);

  if (!e2ee) return null;

  return (
    <div className="rd__lobby-encryption">
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={busy}
        className={clsx(
          'rd__lobby-encryption__switch',
          enabled && 'rd__lobby-encryption__switch--on',
        )}
        onClick={onToggle}
      >
        <LockIcon className="rd__lobby-encryption__lock" />
        <span className="rd__lobby-encryption__text">
          <span className="rd__lobby-encryption__title">
            {t('End-to-end encryption')}
          </span>
          <span className="rd__lobby-encryption__subtitle">
            {enabled
              ? t('Only people with the key can join')
              : t('Encrypt this call with a shared key')}
          </span>
        </span>
        <span className="rd__lobby-encryption__track" aria-hidden="true">
          <span className="rd__lobby-encryption__thumb" />
        </span>
      </button>

      <div
        className={clsx(
          'rd__lobby-encryption__reveal',
          enabled && 'rd__lobby-encryption__reveal--open',
        )}
      >
        <div
          className="rd__lobby-encryption__reveal-inner"
          aria-hidden={!enabled}
        >
          <div className="rd__lobby-encryption__details">
            <div className="rd__lobby-encryption__key-label">
              {t('Shared key')}
            </div>
            <div className="rd__lobby-encryption__key-row">
              <input
                className="rd__input rd__lobby-encryption__key-input"
                type="text"
                value={encryptionKey}
                spellCheck={false}
                autoComplete="off"
                placeholder={t('Shared room key')}
                tabIndex={enabled ? undefined : -1}
                onChange={(e) => onKeyChange(e.currentTarget.value)}
              />
              <button
                type="button"
                className="rd__lobby-encryption__copy"
                tabIndex={enabled ? undefined : -1}
                onClick={onCopyLink}
              >
                {copied ? t('Copied') : t('Copy link')}
              </button>
            </div>
            <p className="rd__lobby-encryption__hint">
              {t(
                'Anyone with this key (or the invite link that contains it) can join the call. Share it only with people you trust.',
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
