import { useEffect, useMemo, useState } from 'react';
import {
  useActiveCall,
  useLocalParticipant,
  useParticipants,
  useRemoteParticipants,
} from '@stream-io/video-react-bindings';
import {
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import clsx from 'clsx';

import { ParticipantBox } from '../ParticipantBox';
import { Audio } from '../Audio';
import { IconButton } from '../../../components';

const GROUP_SIZE = 16;

type PaginatedGridLayoutGroupProps = {
  /**
   * The group of participants to render.
   */
  group: Array<StreamVideoParticipant | StreamVideoLocalParticipant>;

  /**
   * Turns on/off the status indicator icons (mute, connection quality, etc...)
   * on the participant boxes.
   */
  indicatorsVisible?: boolean;
};
const PaginatedGridLayoutGroup = ({
  group,
  indicatorsVisible = true,
}: PaginatedGridLayoutGroupProps) => {
  const call = useActiveCall();
  return (
    <div
      className={clsx('str-video__paginated-grid-layout--group', {
        'str-video__paginated-grid-layout--one': group.length === 1,
        'str-video__paginated-grid-layout--two-four':
          group.length >= 2 && group.length <= 4,
        'str-video__paginated-grid-layout--five-nine':
          group.length >= 5 && group.length <= 9,
      })}
    >
      {group.map((participant) => (
        <ParticipantBox
          key={participant.sessionId}
          participant={participant}
          call={call!}
          indicatorsVisible={indicatorsVisible}
          muteAudio
        />
      ))}
    </div>
  );
};

export type PaginatedGridLayoutProps = {
  /**
   * The number of participants to display per page.
   */
  groupSize?: number;

  /**
   * Whether to exclude the local participant from the grid.
   */
  excludeLocalParticipant?: boolean;

  /**
   * Turns on/off the status indicator icons (mute, connection quality, etc...)
   * on the participant boxes.
   */
  indicatorsVisible?: boolean;

  /**
   * Turns on/off the pagination arrows.
   */
  pageArrowsVisible?: boolean;
};

export const PaginatedGridLayout = ({
  groupSize = GROUP_SIZE,
  excludeLocalParticipant = false,
  indicatorsVisible = true,
  pageArrowsVisible = true,
}: PaginatedGridLayoutProps) => {
  const [page, setPage] = useState(0);

  const localParticipant = useLocalParticipant();
  const participants = useParticipants();
  // used to render audio elements
  const remoteParticipants = useRemoteParticipants();

  // only used to render video elements
  const participantGroups = useMemo(
    () =>
      chunk(
        excludeLocalParticipant ? remoteParticipants : participants,
        groupSize,
      ),
    [excludeLocalParticipant, remoteParticipants, participants, groupSize],
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
      <div className="str-video__paginated-grid-layout--wrapper">
        <div className="str-video__paginated-grid-layout">
          {pageArrowsVisible && pageCount > 1 && (
            <IconButton
              icon="caret-left"
              disabled={page === 0}
              onClick={() => setPage((pv) => (pv === 0 ? pv : pv - 1))}
            />
          )}
          {selectedGroup && (
            <PaginatedGridLayoutGroup
              group={participantGroups[page]}
              indicatorsVisible={indicatorsVisible}
            />
          )}
          {pageArrowsVisible && pageCount > 1 && (
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
