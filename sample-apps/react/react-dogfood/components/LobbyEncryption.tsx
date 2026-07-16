import { useCallback, useRef, useState } from 'react';
import {
  Icon,
  useCallStateHooks,
  useConnectedUser,
  useI18n,
} from '@stream-io/video-react-sdk';
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
  const { useCallSettings, useCallCreatedBy } = useCallStateHooks();
  const settings = useCallSettings();
  const createdBy = useCallCreatedBy();
  const connectedUser = useConnectedUser();

  // Only the call's creator gets the interactive toggle. A 2nd+ participant (a
  // joiner) can't change a call's encryption (it's fixed at creation), so a
  // toggle would only be confusing:
  //   - joiner on an encrypted call -> show a read-only "encrypted" banner
  //     (and let them enter the key if the link didn't carry it);
  //   - joiner on a plain call -> hide the control entirely (nothing to change).
  // During load `createdBy` is unknown, so we default to the creator view and
  // resolve once the call response arrives.
  // Wait for the call response before deciding what to show: `createdBy` tells
  // us creator vs joiner, `settings` tells us encrypted vs plain. Until both are
  // known we render nothing, so a joiner never briefly sees the creator's toggle
  // (this mirrors the lobby's video preview, which also waits on `settings`).
  const resolved = !!settings && !!createdBy;
  const isEncryptedCall = !!settings?.encryption?.enabled;
  const isJoiner =
    !!createdBy && !!connectedUser && createdBy.id !== connectedUser.id;
  const locked = isJoiner && isEncryptedCall;
  const hideForJoiner = isJoiner && !isEncryptedCall;
  const creatorName = createdBy?.name || createdBy?.id;

  const [enabled, setEnabled] = useState(!!e2ee?.encryptionKey);
  const [encryptionKey, setEncryptionKey] = useState(e2ee?.encryptionKey ?? '');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyResetRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // The control shows "on" whenever the call is actually encrypted - even for a
  // joiner who opened a link without the key. `enabled` is the local (creator)
  // toggle intent; a locked joiner never toggles, so it stays at its mount value.
  const isOn = enabled || isEncryptedCall;
  // A locked joiner who did not receive the key must type it in to decrypt; one
  // who already has it should not be able to edit (and break) a working key.
  const needsKey = locked && !enabled;
  const keyReadOnly = locked && enabled;

  const onToggle = useCallback(async () => {
    if (!e2ee || busy || locked) return;
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
  }, [e2ee, busy, locked, enabled, encryptionKey]);

  const onKeyChange = useCallback(
    (value: string) => {
      setEncryptionKey(value);
      if (isOn) e2ee?.updateEncryptionKey(value);
    },
    [e2ee, isOn],
  );

  const onRefresh = useCallback(() => {
    // The key is a client-side shared secret, so a new one updates the current
    // call (and URL) without creating a new call.
    const key = getRandomWords(3);
    setEncryptionKey(key);
    e2ee?.updateEncryptionKey(key);
  }, [e2ee]);

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

  if (!e2ee || !resolved || hideForJoiner) return null;

  return (
    <div
      className={clsx(
        'rd__lobby-encryption',
        isOn && 'rd__lobby-encryption--on',
        locked && 'rd__lobby-encryption--banner',
      )}
    >
      {locked ? (
        // Joiner on an encrypted call: an informational banner, not a toggle.
        <div className="rd__lobby-encryption__switch rd__lobby-encryption__banner-row">
          <LockIcon className="rd__lobby-encryption__lock" />
          <span className="rd__lobby-encryption__text">
            <span className="rd__lobby-encryption__title">
              {t('End-to-end encryption')}
            </span>
            <span className="rd__lobby-encryption__subtitle">
              {needsKey
                ? t('Enter the shared key to join')
                : creatorName
                  ? `${t('Enabled by')} ${creatorName}`
                  : t('This call is encrypted')}
            </span>
          </span>
        </div>
      ) : (
        <button
          type="button"
          role="switch"
          aria-checked={isOn}
          disabled={busy}
          className="rd__lobby-encryption__switch"
          onClick={onToggle}
        >
          <LockIcon className="rd__lobby-encryption__lock" />
          <span className="rd__lobby-encryption__text">
            <span className="rd__lobby-encryption__title">
              {t('End-to-end encryption')}
            </span>
            <span className="rd__lobby-encryption__subtitle">
              {isOn
                ? t('Only people with the key can join')
                : t('Encrypt this call with a shared key')}
            </span>
          </span>
          <span className="rd__lobby-encryption__track" aria-hidden="true">
            <span className="rd__lobby-encryption__thumb" />
          </span>
        </button>
      )}

      <div
        className={clsx(
          'rd__lobby-encryption__reveal',
          isOn && 'rd__lobby-encryption__reveal--open',
        )}
      >
        <div className="rd__lobby-encryption__reveal-inner" aria-hidden={!isOn}>
          <div className="rd__lobby-encryption__details">
            <div className="rd__lobby-encryption__key-label">
              {t('Shared key')}
            </div>
            <div className="rd__lobby-encryption__key-row">
              <div className="rd__lobby-encryption__key-field">
                <input
                  className="rd__input rd__lobby-encryption__key-input"
                  type="text"
                  value={encryptionKey}
                  spellCheck={false}
                  autoComplete="off"
                  readOnly={keyReadOnly}
                  placeholder={t('Shared room key')}
                  tabIndex={isOn ? undefined : -1}
                  onChange={(e) => onKeyChange(e.currentTarget.value)}
                />
                {!locked && (
                  <button
                    type="button"
                    className="rd__lobby-encryption__refresh"
                    aria-label={t('Generate a new key')}
                    title={t('Generate a new key')}
                    tabIndex={isOn ? undefined : -1}
                    onClick={onRefresh}
                  >
                    <Icon icon="refresh" />
                  </button>
                )}
              </div>
              <button
                type="button"
                className="rd__lobby-encryption__copy"
                tabIndex={isOn ? undefined : -1}
                onClick={onCopyLink}
              >
                {copied ? t('Copied') : t('Copy link')}
              </button>
            </div>
            <p className="rd__lobby-encryption__hint">
              {needsKey
                ? t(
                    'Ask the call creator for the shared key, then enter it here.',
                  )
                : t(
                    'Anyone with this key (or the invite link that contains it) can join the call. Share it only with people you trust.',
                  )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
