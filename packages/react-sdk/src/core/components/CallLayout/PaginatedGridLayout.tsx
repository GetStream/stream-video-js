import { useEffect, useMemo, useState } from 'react';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import {
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import clsx from 'clsx';

import {
  DefaultParticipantViewUI,
  ParticipantView,
  ParticipantViewProps,
} from '../ParticipantView';
import { ParticipantsAudio } from '../Audio';
import { IconButton } from '../../../components';
import { chunk } from '../../../utilities';
import { usePaginatedLayoutSortPreset } from './hooks';

const GROUP_SIZE = 16;

type PaginatedGridLayoutGroupProps = {
  /**
   * The group of participants to render.
   */
  group: Array<StreamVideoParticipant | StreamVideoLocalParticipant>;
} & Pick<ParticipantViewProps, 'VideoPlaceholder'> &
  Required<Pick<ParticipantViewProps, 'ParticipantViewUI'>>;

const PaginatedGridLayoutGroup = ({
  group,
  VideoPlaceholder,
  ParticipantViewUI,
}: PaginatedGridLayoutGroupProps) => {
  return (
    <div
      className={clsx('str-video__paginated-grid-layout__group', {
        'str-video__paginated-grid-layout--one': group.length === 1,
        'str-video__paginated-grid-layout--two-four':
          group.length >= 2 && group.length <= 4,
        'str-video__paginated-grid-layout--five-nine':
          group.length >= 5 && group.length <= 9,
      })}
    >
      {group.map((participant) => (
        <ParticipantView
          key={participant.sessionId}
          participant={participant}
          muteAudio
          VideoPlaceholder={VideoPlaceholder}
          ParticipantViewUI={ParticipantViewUI}
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
   * Turns on/off the pagination arrows.
   */
  pageArrowsVisible?: boolean;
} & Pick<ParticipantViewProps, 'ParticipantViewUI' | 'VideoPlaceholder'>;

export const PaginatedGridLayout = ({
  groupSize = GROUP_SIZE,
  excludeLocalParticipant = false,
  pageArrowsVisible = true,
  VideoPlaceholder,
  ParticipantViewUI = DefaultParticipantViewUI,
}: PaginatedGridLayoutProps) => {
  const [page, setPage] = useState(0);

  const call = useCall();
  const { useParticipants, useRemoteParticipants } = useCallStateHooks();
  const participants = useParticipants();
  // used to render audio elements
  const remoteParticipants = useRemoteParticipants();

  usePaginatedLayoutSortPreset(call);

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
    if (page > pageCount - 1) {
      setPage(Math.max(0, pageCount - 1));
    }
  }, [page, pageCount]);

  const selectedGroup = participantGroups[page];

  if (!call) return null;

  return (
    <div className="str-video__paginated-grid-layout__wrapper">
      <ParticipantsAudio participants={remoteParticipants} />
      <div className="str-video__paginated-grid-layout">
        {pageArrowsVisible && pageCount > 1 && (
          <IconButton
            icon="caret-left"
            disabled={page === 0}
            onClick={() =>
              setPage((currentPage) => Math.max(0, currentPage - 1))
            }
          />
        )}
        {selectedGroup && (
          <PaginatedGridLayoutGroup
            group={participantGroups[page]}
            VideoPlaceholder={VideoPlaceholder}
            ParticipantViewUI={ParticipantViewUI}
          />
        )}
        {pageArrowsVisible && pageCount > 1 && (
          <IconButton
            disabled={page === pageCount - 1}
            icon="caret-right"
            onClick={() =>
              setPage((currentPage) => Math.min(pageCount - 1, currentPage + 1))
            }
          />
        )}
      </div>
    </div>
  );
};
