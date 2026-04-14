import type { ParticipantState } from '../types';
import { ParticipantPanel } from './ParticipantPanel';
import './ParticipantGrid.css';

interface ParticipantGridProps {
  participants: ParticipantState[];
  onRemove: (userId: string) => void;
  onRotateKey: (userId: string, localOnly: boolean) => void;
  onSetKey: (userId: string, input: string, localOnly: boolean) => void;
}

export const ParticipantGrid = ({
  participants,
  onRemove,
  onRotateKey,
  onSetKey,
}: ParticipantGridProps) => {
  if (participants.length === 0) {
    return (
      <div className="participant-grid__empty">
        <p>No participants yet.</p>
        <p>
          Click &quot;Add Participant&quot; to join the call with E2EE enabled.
        </p>
      </div>
    );
  }

  return (
    <div className="participant-grid">
      {participants.map((p) => (
        <ParticipantPanel
          key={p.userId}
          participant={p}
          onRemove={onRemove}
          onRotateKey={onRotateKey}
          onSetKey={onSetKey}
        />
      ))}
    </div>
  );
};
