import { useCall } from '@stream-io/video-react-sdk';
import { ValuePoller } from './ValuePoller';

export function TransportDiagram(props: {
  direction: 'publisher' | 'subscriber';
}) {
  const call = useCall();
  const pc: RTCPeerConnection | undefined = (call?.[props.direction] as any).pc;

  if (!pc) {
    return <TransportDiagramPlaceholder />;
  }

  return (
    <ValuePoller
      id="rtc-transport"
      fetcher={async () => {
        const pair = await fetchPeerConnectionCandidatePair(pc);

        if (!pair) {
          return <TransportDiagramPlaceholder />;
        }

        return (
          <>
            <div className="rd__transport-diagram">
              <dl
                className="rd__ice-candidate rd__transport-diagram-local"
                data-copy="Local"
              >
                <dt data-copyable>{pair.local.address}</dt>
                <dd data-copyable>{pair.local.candidateType}</dd>
              </dl>
              <span data-copy={`Network type: ${pair.network}`} hidden />
              <i />
              <div
                className="rd__protocol"
                data-copy={`↕️ ${pair.protocol} ${pair.healthy ? '💚' : '💔'}`}
              >
                {pair.protocol}
                <span className="rd__value-poller-indicator">
                  {pair.healthy ? ' 💚' : ' 💔'}
                </span>
              </div>
              <i />
              <dl
                className="rd__ice-candidate rd__transport-diagram-remote"
                data-copy="Remote"
              >
                <dt data-copyable>{pair.remote.address}</dt>
                <dd data-copyable>{pair.remote.candidateType}</dd>
              </dl>
            </div>
            <div className="rd__transport-diagram">
              <div className="rd__transport-diagram-label">
                Local - {pair.network}
              </div>
              <button type="button" onClick={() => pc.restartIce()}>
                Re-ICE
              </button>
              <div className="rd__transport-diagram-label">Remote</div>
            </div>
          </>
        );
      }}
    />
  );
}

function TransportDiagramPlaceholder() {
  return (
    <div className="rd__transport-diagram rd__transport-diagram_placeholder">
      No RTC connection. Enable camera or microphone
    </div>
  );
}

async function fetchPeerConnectionCandidatePair(pc: RTCPeerConnection) {
  const reportObj = Object.fromEntries((await pc.getStats()).entries());
  const transportEntry: RTCTransportStats | undefined = Object.values(
    reportObj,
  ).find((entry) => entry.type === 'transport');

  if (!transportEntry?.selectedCandidatePairId) {
    return null;
  }

  const candidatePairEntry: RTCIceCandidatePairStats =
    reportObj[transportEntry.selectedCandidatePairId];
  // RTCIceCandidateStats type is not in the lib.dom.d.ts :
  const localCandidateEntry: any =
    reportObj[candidatePairEntry.localCandidateId];
  const remoteCandidateEntry: any =
    reportObj[candidatePairEntry.remoteCandidateId];
  const rawProtocol =
    localCandidateEntry.protocol ?? localCandidateEntry.relayProtocol;
  const protocol: string = rawProtocol
    ? localCandidateEntry.protocol.toUpperCase()
    : '-';

  return {
    local: formatCandidateEntry(localCandidateEntry),
    remote: formatCandidateEntry(remoteCandidateEntry),
    healthy: candidatePairEntry.state === 'succeeded',
    protocol,
    network: localCandidateEntry.networkType,
  };
}

function formatCandidateEntry(candidate: any) {
  const address = candidate.address
    ? `${candidate.address}:${candidate.port}`
    : '-';
  let candidateType = '-';

  switch (candidate.candidateType as RTCIceCandidateType) {
    case 'host':
      candidateType = 'Host';
      break;
    case 'srflx':
      candidateType = 'Server reflexive';
      break;
    case 'prflx':
      candidateType = 'Peer reflexive';
      break;
    case 'relay':
      candidateType = 'Relay';
      break;
  }

  return { address, candidateType };
}
