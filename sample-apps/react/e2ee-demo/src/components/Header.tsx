import { EncryptionManager } from '@stream-io/video-react-sdk';
import { MAX_PARTICIPANTS } from '../config';
import './Header.css';

interface HeaderProps {
  callId: string;
  participantCount: number;
  onAddParticipant: () => void;
  loading: boolean;
}

export const Header = ({
  callId,
  participantCount,
  onAddParticipant,
  loading,
}: HeaderProps) => {
  const isSupported = EncryptionManager.isSupported();
  const canAdd = participantCount < MAX_PARTICIPANTS && isSupported && !loading;

  return (
    <header className="header">
      <div className="header__info">
        <h1 className="header__title">Stream E2EE Demo</h1>
        <div className="header__meta">
          <span className="header__call-id">
            Call: <code>{callId}</code>
          </span>
          <span
            className={`header__badge ${isSupported ? 'header__badge--ok' : 'header__badge--no'}`}
          >
            {isSupported ? 'E2EE Supported' : 'E2EE Not Supported'}
          </span>
        </div>
      </div>
      <button
        className="header__add-btn"
        onClick={onAddParticipant}
        disabled={!canAdd}
      >
        {loading
          ? 'Connecting...'
          : `Add Participant (${participantCount}/${MAX_PARTICIPANTS})`}
      </button>
    </header>
  );
};
