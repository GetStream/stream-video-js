import {
  Call,
  SubscriptionChanges,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ValuePoller } from './ValuePoller';

export function CodecDash() {
  const call = useCall();
  const {
    forceSubscriptions,
    subscribedParticipantCount,
    remoteParticipantCount,
  } = useForceSubscriptions();

  useEffect(() => {
    if (call) {
      forceSubscriptions(call);
    }
  }, [call, forceSubscriptions]);

  return (
    <div className="rd__inspector-dash">
      <h3 data-copyable data-h>
        Codecs in use
      </h3>
      <dl>
        <dt data-copyable>Publishing</dt>
        <dd data-copyable>
          <ValuePoller
            id="publisher-codecs"
            fetcher={() => {
              const pc = (call?.publisher as any)?.pc;
              return pc ? fetchCodecsInUse(pc, 'sender') : '-';
            }}
          />
          <span data-copy="" hidden />
        </dd>

        <dt>
          <span data-copyable>
            Subscriptions ({subscribedParticipantCount}/{remoteParticipantCount}
            )
          </span>
          <button
            className="rd__dash-action-button"
            type="button"
            onClick={() => call && forceSubscriptions(call)}
          >
            Sub. to all
          </button>
        </dt>
        <dd data-copyable>
          <ValuePoller
            id="subscriber-codecs"
            fetcher={() => {
              const pc = (call?.subscriber as any)?.pc;
              return pc ? fetchCodecsInUse(pc, 'receiver') : '-';
            }}
          />
        </dd>
      </dl>
      <section>
        <small>
          Press "Sub. to all" to start receiving video from all participants
          currently in the call.
        </small>
      </section>
    </div>
  );
}

function useForceSubscriptions() {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const remoteParticipants = useMemo(
    () =>
      participants.filter((p) => !p.isLocalParticipant).map((p) => p.sessionId),
    [participants],
  );
  const [subscribedParticipants, setSubscribedParticipants] = useState(
    new Set<string>(),
  );
  const subscribedParticipantCount = useMemo(
    () =>
      remoteParticipants.reduce(
        (count, p) => (subscribedParticipants.has(p) ? count + 1 : count),
        0,
      ),
    [remoteParticipants, subscribedParticipants],
  );

  const forceSubscriptions = useCallback((call: Call) => {
    const _participants = call.state.remoteParticipants;
    // Force subscribe to video from all known participants.
    // Without that reporting received codecs is not very useful.
    const changes: SubscriptionChanges = {};
    for (const participant of _participants) {
      changes[participant.sessionId] = {
        dimension: { width: 800, height: 600 },
      };
    }
    call.state.updateParticipantTracks('videoTrack', changes);
    call.dynascaleManager.applyTrackSubscriptions();
    setSubscribedParticipants(new Set(Object.keys(changes)));
  }, []);

  return {
    forceSubscriptions,
    subscribedParticipantCount,
    remoteParticipantCount: remoteParticipants.length,
  };
}

async function fetchCodecsInUse(
  pc: RTCPeerConnection,
  direction: 'sender' | 'receiver',
) {
  const activeTransceivers = pc
    .getTransceivers()
    .filter((t) => t[direction].track?.readyState === 'live');

  const stats = await Promise.all(
    activeTransceivers.map((t) => t[direction].getStats()),
  );

  const codecs: string[] = [];

  for (const report of stats) {
    report.forEach((entry) => {
      if (entry.type === 'codec') {
        codecs.push(entry.mimeType);
      }
    });
  }

  return codecs.join(', ') || '-';
}
