import {
  Call,
  GetCallRingStateResponse,
  useObservableValue,
} from '@stream-io/video-react-sdk';
import { useState } from 'react';

/**
 * Pronto-only pane for inspecting the ring outcome of the call being dialed:
 * the state the WebSocket delivered, next to what the `ring_state` endpoint
 * returns on demand.
 */
export const RingStateDebugPane = ({ call }: { call?: Call }) => (
  <aside className="rd__dialer-debug">
    <h3 className="rd__dialer-debug-title">Ring state</h3>
    {call ? (
      <RingStateDebug call={call} />
    ) : (
      <p className="rd__dialer-debug-empty">No call is ringing.</p>
    )}
  </aside>
);

const RingStateDebug = ({ call }: { call: Call }) => {
  const callingState = useObservableValue(call.state.callingState$);
  const session = useObservableValue(call.state.session$);
  const [polled, setPolled] = useState<GetCallRingStateResponse>();
  const [polledAt, setPolledAt] = useState<string>();
  const [error, setError] = useState<string>();
  const [isPolling, setIsPolling] = useState(false);

  const handlePoll = async () => {
    setIsPolling(true);
    setError(undefined);
    try {
      setPolled(await call.getRingState());
      setPolledAt(new Date().toLocaleTimeString());
    } catch (err) {
      setPolled(undefined);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsPolling(false);
    }
  };

  return (
    <>
      <dl className="rd__dialer-debug-list">
        <Row label="CID" value={call.cid} />
        <Row label="Calling state" value={callingState} />
        <Row label="Session" value={session?.id} />
        <Row label="Accepted" value={formatMap(session?.accepted_by)} />
        <Row label="Rejected" value={formatMap(session?.rejected_by)} />
        <Row label="Missed" value={formatMap(session?.missed_by)} />
      </dl>
      <button
        type="button"
        className="rd__button rd__button--secondary"
        onClick={handlePoll}
        disabled={isPolling || !session?.id}
        data-testid="ring-state-poll-button"
      >
        {isPolling ? 'Reading…' : 'Read ring state'}
      </button>
      {error && <p className="rd__dialer-debug-error">{error}</p>}
      {polled && (
        <>
          <p className="rd__dialer-debug-empty">Read at {polledAt}</p>
          <pre className="rd__dialer-debug-json">
            {JSON.stringify(polled, null, 2)}
          </pre>
        </>
      )}
    </>
  );
};

const Row = ({ label, value }: { label: string; value?: string }) => (
  <div className="rd__dialer-debug-row">
    <dt>{label}</dt>
    <dd>{value || '—'}</dd>
  </div>
);

const formatMap = (map?: { [key: string]: string }) => {
  const userIds = Object.keys(map ?? {});
  return userIds.length > 0 ? userIds.join(', ') : undefined;
};
