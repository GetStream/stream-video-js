import { useSnapshot } from '../hooks/useHarness';
import { ParticipantPanel } from './ParticipantPanel';
import type { EventLogEntry } from './EventLog';
import './CallGrid.css';

export const CallGrid = () => {
  const { participants, log } = useSnapshot();
  const nameByUserId = Object.fromEntries(
    participants.map((p) => [p.userId, p.name]),
  );

  if (participants.length === 0) {
    return (
      <div className="call-grid__empty">
        <p>No participants yet.</p>
        <p>Click "+ Participant" to add someone to the call.</p>
      </div>
    );
  }

  return (
    <div className="call-grid">
      {participants.map((p) => (
        <ParticipantPanel
          key={p.userId}
          participant={p}
          nameByUserId={nameByUserId}
          events={log.filter((e) => e.userId === p.userId) as EventLogEntry[]}
        />
      ))}
    </div>
  );
};
