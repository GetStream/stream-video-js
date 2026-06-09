import { useHarnessEngine, useSnapshot } from '../hooks/useHarness';
import type { HarnessParticipant } from '../harness/snapshot';
import './ChaosControls.css';

export const ChaosControls = ({
  participant,
}: {
  participant: HarnessParticipant;
}) => {
  const engine = useHarnessEngine();
  const { participants } = useSnapshot();
  const others = participants.filter((p) => p.userId !== participant.userId);

  return (
    <details className="chaos">
      <summary>Failure injection</summary>
      <div className="chaos__row">
        <button onClick={() => engine.setWrongKey(participant.userId)}>
          Set wrong key
        </button>
        <button onClick={() => engine.rotateKey(participant.userId, true)}>
          Rotate (local only)
        </button>
        <button onClick={() => engine.rotationRace(participant.userId)}>
          Rotation race
        </button>
      </div>
      <div className="chaos__row">
        <span className="chaos__label">Revoke my key from:</span>
        {others.length === 0 && <span className="chaos__muted">no peers</span>}
        {others.map((o) => (
          <button
            key={o.userId}
            onClick={() => engine.revokeKey(participant.userId, o.userId)}
          >
            {o.name}
          </button>
        ))}
      </div>
    </details>
  );
};
