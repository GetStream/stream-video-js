import { EncryptionManager } from '@stream-io/video-react-sdk';
import { MAX_PARTICIPANTS } from '../config';
import './Header.css';

interface HeaderProps {
  callId: string;
  participantCount: number;
  e2eeEnabled: boolean;
  onToggleE2EE: (enabled: boolean) => void;
  onAddParticipant: () => void;
  loading: boolean;
}

export const Header = ({
  callId,
  participantCount,
  e2eeEnabled,
  onToggleE2EE,
  onAddParticipant,
  loading,
}: HeaderProps) => {
  const isSupported = EncryptionManager.isSupported();
  const canAdd =
    participantCount < MAX_PARTICIPANTS &&
    (!e2eeEnabled || isSupported) &&
    !loading;
  const canToggle = participantCount === 0 && !loading;

  return (
    <header className="header">
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
        <label
          className={`header__toggle ${!canToggle ? 'header__toggle--disabled' : ''}`}
        >
          <input
            type="checkbox"
            checked={e2eeEnabled}
            onChange={(e) => onToggleE2EE(e.target.checked)}
            disabled={!canToggle}
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
    </header>
  );
};
