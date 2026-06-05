import type { CallLayout, EventLogEntry, ParticipantSession } from '../types';
import { ParticipantPanel } from './ParticipantPanel';
import './ParticipantGrid.css';

interface ParticipantGridProps {
  participants: ParticipantSession[];
  layout: CallLayout;
  eventsByUser: Record<string, EventLogEntry[]>;
  onRemove: (userId: string) => void;
  onToggleE2EE: (userId: string, enabled: boolean) => void;
  onRotateKey: (userId: string, localOnly: boolean) => void;
  onSetKey: (userId: string, input: string, localOnly: boolean) => void;
  onDismissError: (userId: string) => void;
}

const EMPTY_EVENTS: EventLogEntry[] = [];

export const ParticipantGrid = ({
  participants,
  layout,
  eventsByUser,
  onRemove,
  onToggleE2EE,
  onRotateKey,
  onSetKey,
  onDismissError,
}: ParticipantGridProps) => {
  if (participants.length === 0) {
    return (
      <div className="participant-grid__empty">
        <p>No participants yet.</p>
        <p>Click &quot;Add Participant&quot; to join the call.</p>
      </div>
    );
  }

  return (
    <div className="participant-grid">
      {participants.map((p) => (
        <ParticipantPanel
          key={p.userId}
          participant={p}
          layout={layout}
          events={eventsByUser[p.userId] ?? EMPTY_EVENTS}
          onRemove={onRemove}
          onToggleE2EE={onToggleE2EE}
          onRotateKey={onRotateKey}
          onSetKey={onSetKey}
          onDismissError={onDismissError}
        />
      ))}
    </div>
  );
};
