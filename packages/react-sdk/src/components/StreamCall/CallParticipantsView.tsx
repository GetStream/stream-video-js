import { useEffect, useRef } from 'react';
import { Call } from '@stream-io/video-client';
import { ParticipantBox } from './ParticipantBox';
import {
  useLocalParticipant,
  useRemoteParticipants,
} from '@stream-io/video-react-bindings';

export const CallParticipantsView = (props: { call: Call }) => {
  const { call } = props;
  const localParticipant = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();

  const viewport = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!viewport.current) return;
    call.viewportTracker.setViewport(viewport.current);
    return () => {
      call.viewportTracker.setViewport(undefined);
    };
  }, [call]);

  const grid = `str-video__grid-${remoteParticipants.length + 1 || 1}`;
  return (
    <div className={`str-video__call-participants-view ${grid}`} ref={viewport}>
      {localParticipant && (
        <ParticipantBox
          participant={localParticipant}
          isMuted
          call={call}
          sinkId={localParticipant.audioOutputDeviceId}
        />
      )}

      {remoteParticipants.map((participant) => (
        <ParticipantBox
          key={participant.sessionId}
          participant={participant}
          call={call}
          sinkId={localParticipant?.audioOutputDeviceId}
        />
      ))}
    </div>
  );
};
