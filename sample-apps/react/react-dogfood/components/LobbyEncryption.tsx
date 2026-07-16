import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useI18n } from '@stream-io/video-react-sdk';
import clsx from 'clsx';

import { LockIcon } from './LockIcon';
import { getRandomWords } from '../lib/names';
import { meetingId } from '../lib/idGenerators';

/**
 * Lobby control that turns on end-to-end encryption for the call and manages the
 * shared room key.
 *
 * The `?encryption_key=` query param is the source of truth: it seeds this
 * control on load, is kept in sync as the user edits the key, and is what the
 * join path (`applyQueryConfigParams`) reads to attach the `EncryptionManager`.
 *
 * A call's `encryption.enabled` flag is fixed at creation and cannot be changed
 * afterwards, so flipping E2EE on/off means moving to a *new* call: we generate a
 * fresh id and soft-navigate to `/join/<newId>?encryption_key=...`, where the
 * encryption-aware `getOrCreate` (see pages/join/[callId].tsx) creates the call
 * encrypted. Because the key and the call id always travel together in the URL,
 * the presence of the key fully determines the call's encryption state - so
 * enabling always starts a fresh encrypted call and disabling a fresh plain one.
 * The shared key itself is client-side only (never sent to the backend), so
 * editing the key on an already-encrypted call is just a shallow URL update.
 *
 * Rendered only in the `pronto` environment (gated by the caller).
 */
export const LobbyEncryption = () => {
  const router = useRouter();
  const { t } = useI18n();

  const keyFromUrl = router.query['encryption_key'] as string | undefined;
  // Sticky so clearing the key input doesn't collapse the panel; a full
  // navigation (enable/disable) remounts and re-derives this from the URL.
  const [enabled] = useState(!!keyFromUrl);
  const [encryptionKey, setEncryptionKey] = useState(keyFromUrl ?? '');
  const [copied, setCopied] = useState(false);
  const copyResetRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Navigate to `callId` carrying (or dropping) the shared key. `shallow` keeps
  // the same call (key-only edit); a full navigation swaps to a new call id and
  // re-runs the encryption-aware getOrCreate.
  const goToCall = useCallback(
    (callId: string, key: string | undefined, shallow: boolean) => {
      const query: Record<string, string | string[] | undefined> = {
        ...router.query,
        callId,
      };
      if (key) query['encryption_key'] = key;
      else delete query['encryption_key'];
      router
        .replace({ pathname: router.pathname, query }, undefined, { shallow })
        .catch((err) => console.error('Failed to update URL', err));
    },
    [router],
  );

  const onToggle = useCallback(() => {
    if (!enabled) {
      // Encryption can't be switched on in place: start a fresh encrypted call.
      const key = encryptionKey || getRandomWords(3);
      setEncryptionKey(key);
      goToCall(meetingId(), key, false);
    } else {
      // Can't un-encrypt a call in place: start a fresh, unencrypted call.
      goToCall(meetingId(), undefined, false);
    }
  }, [enabled, encryptionKey, goToCall]);

  const onKeyChange = useCallback(
    (value: string) => {
      setEncryptionKey(value);
      // The key is a client-side shared secret, so it can change on the same
      // (already-encrypted) call without a new call.
      if (enabled) {
        goToCall(router.query['callId'] as string, value || undefined, true);
      }
    },
    [enabled, router, goToCall],
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

  return (
    <div className="rd__lobby-encryption">
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
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

      {enabled && (
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
              onChange={(e) => onKeyChange(e.currentTarget.value)}
            />
            <button
              type="button"
              className="rd__lobby-encryption__copy"
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
      )}
    </div>
  );
};
