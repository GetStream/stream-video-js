import { useEffect, useMemo, useState } from 'react';

import {
  useActiveCall,
  useLocalParticipant,
  useParticipants,
  useRemoteParticipants,
} from '@stream-io/video-react-bindings';
import { StreamVideoLocalParticipant } from '@stream-io/video-client';
import { StreamVideoParticipant } from '@stream-io/video-client';
import clsx from 'clsx';

import { IconButton, ParticipantBox } from '..';
import { Audio } from '../StreamCall/Audio';

const GROUP_SIZE = 16;

const PaginatedGridLayoutGroup = ({
  group,
}: {
  group: Array<StreamVideoParticipant | StreamVideoLocalParticipant>;
}) => {
  const call = useActiveCall();

  return (
    <div
      className={clsx('str-video__paginated-grid-layout-group', {
        one: group.length === 1,
        'two-four': group.length >= 2 && group.length <= 4,
        'five-nine': group.length >= 5 && group.length <= 9,
      })}
    >
      {group.map((participant) => (
        <ParticipantBox
          key={participant.sessionId}
          participant={participant}
          call={call!}
        />
      ))}
    </div>
  );
};

export const PaginatedGridLayout = () => {
  const [page, setPage] = useState(0);

  const localParticipant = useLocalParticipant();
  // TODO: add sorting algorithm (is talking > has video > (connected at | alphabetically))
  // maybe allow integrators to pass pre-sorted participants through prop?
  const participants = useParticipants();
  // used to render audio elements
  const remoteParticipants = useRemoteParticipants();

  // only used to render video elements
  const participantGroups = useMemo(
    () => chunk(participants, GROUP_SIZE),
    [participants],
  );

  const pageCount = participantGroups.length;

  // update page when page count is reduced and selected page no longer exists
  useEffect(() => {
    if (page > pageCount - 1) setPage(pageCount - 1);
  }, [page, pageCount]);

  const selectedGroup = participantGroups[page];

  return (
    <>
      {remoteParticipants.map((participant) => (
        <Audio
          muted={false}
          key={participant.sessionId}
          audioStream={participant.audioStream}
          sinkId={localParticipant?.audioOutputDeviceId}
        />
      ))}
      <div className="str-video__paginated-grid-layout-wrapper">
        <div className="str-video__paginated-grid-layout">
          {pageCount > 1 && (
            <IconButton
              icon="caret-left"
              disabled={page === 0}
              onClick={() => setPage((pv) => (pv === 0 ? pv : pv - 1))}
            />
          )}
          {selectedGroup && (
            <PaginatedGridLayoutGroup group={participantGroups[page]} />
          )}
          {pageCount > 1 && (
            <IconButton
              disabled={page === pageCount - 1}
              icon="caret-right"
              onClick={() =>
                setPage((pv) => (pv === pageCount - 1 ? pv : pv + 1))
              }
            />
          )}
        </div>
      </div>
    </>
  );
};

// TODO: move to utilities
const chunk = <T extends unknown[]>(array: T, size = GROUP_SIZE) => {
  const chunkCount = Math.ceil(array.length / size);

  return Array.from(
    { length: chunkCount },
    (_, index) => array.slice(size * index, size * index + size) as T,
  );
};

// TODO: maybe use this?
// problem is, participants change due to anything (someone muted video for example)
// which would yield new merged stream anytime someone interacted with something
// completely unrelated to published audio tracks
const useMergeAudioStreams = (participants: StreamVideoParticipant[]) => {
  return useMemo(() => {
    const audioStreams = participants
      .map((p) => p.audioStream)
      .filter(Boolean) as MediaStream[];

    const audioContext = new AudioContext();

    const sourceNodes = audioStreams.map((stream) =>
      audioContext.createMediaStreamSource(stream),
    );

    const dest = audioContext.createMediaStreamDestination();

    sourceNodes.forEach((sourceNode) => sourceNode.connect(dest));

    return dest.stream;
  }, [participants]);
};
