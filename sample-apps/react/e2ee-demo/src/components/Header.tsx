import { useState } from 'react';
import { EncryptionManager } from '@stream-io/video-react-sdk';
import { MAX_PARTICIPANTS } from '../config';
import type { PreferredCodec } from '../types';
import './Header.css';

interface HeaderProps {
  callId: string;
  participantCount: number;
  e2eeEnabled: boolean;
  preferredCodec: PreferredCodec;
  sharedPassphrase: string | null;
  onToggleE2EE: (enabled: boolean) => void;
  onCodecChange: (codec: PreferredCodec) => void;
  onSetSharedKey: (passphrase: string) => void;
  onAddParticipant: () => void;
  loading: boolean;
}

export const Header = ({
  callId,
  participantCount,
  e2eeEnabled,
  preferredCodec,
  sharedPassphrase,
  onToggleE2EE,
  onCodecChange,
  onSetSharedKey,
  onAddParticipant,
  loading,
}: HeaderProps) => {
  const isSupported = EncryptionManager.isSupported();
  const canAdd =
    participantCount < MAX_PARTICIPANTS &&
    (!e2eeEnabled || isSupported) &&
    !loading;

  const [sharedKeyInput, setSharedKeyInput] = useState('');

  const inputValue = sharedKeyInput || sharedPassphrase || '';

  const handleSetSharedKey = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onSetSharedKey(trimmed);
    setSharedKeyInput('');
  };

  return (
    <header className="header">
      <div className="header__row">
        <div className="header__info">
          <h1 className="header__title">Stream E2EE Demo</h1>
          <div className="header__meta">
            <span className="header__call-id">
              Call: <code>{callId}</code>
            </span>
            {e2eeEnabled && (
              <span
                className={`header__badge ${isSupported ? 'header__badge--ok' : 'header__badge--no'}`}
              >
                {isSupported ? 'E2EE Supported' : 'E2EE Not Supported'}
              </span>
            )}
          </div>
        </div>
        <div className="header__actions">
          <label className="header__codec-select">
            Codec
            <select
              value={preferredCodec}
              onChange={(e) => onCodecChange(e.target.value as PreferredCodec)}
              disabled={loading}
            >
              <option value="vp8">VP8</option>
              <option value="vp9">VP9</option>
              <option value="h264">H.264</option>
              <option value="av1">AV1</option>
            </select>
          </label>
          <label className="header__toggle">
            <input
              type="checkbox"
              checked={e2eeEnabled}
              onChange={(e) => onToggleE2EE(e.target.checked)}
              disabled={loading}
            />
            E2EE
          </label>
          <button
            className="header__add-btn"
            onClick={onAddParticipant}
            disabled={!canAdd}
          >
            {loading
              ? 'Connecting...'
              : `Add Participant (${participantCount}/${MAX_PARTICIPANTS})`}
          </button>
        </div>
      </div>
      {e2eeEnabled && (
        <div className="header__shared-key">
          <input
            className="header__shared-key-input"
            type="text"
            placeholder="Enter shared passphrase..."
            value={inputValue}
            onChange={(e) => setSharedKeyInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSetSharedKey()}
          />
          <button
            className="header__shared-key-btn"
            onClick={handleSetSharedKey}
            disabled={!inputValue.trim()}
          >
            Set Shared Key
          </button>
          {sharedPassphrase && (
            <span className="header__badge header__badge--ok">
              Shared key active
            </span>
          )}
        </div>
      )}
    </header>
  );
};
