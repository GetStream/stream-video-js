import { useEffect, useMemo, useState } from 'react';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { StreamVideoParticipant } from '@stream-io/video-client';
import clsx from 'clsx';

import {
  DefaultParticipantViewUI,
  ParticipantView,
  ParticipantViewProps,
} from '../ParticipantView';
import { ParticipantsAudio } from '../Audio';
import { IconButton } from '../../../components';
import { chunk } from '../../../utilities';
import {
  ParticipantFilter,
  ParticipantPredicate,
  useFilteredParticipants,
  usePaginatedLayoutSortPreset,
} from './hooks';

const GROUP_SIZE = 16;

type PaginatedGridLayoutGroupProps = {
  /**
   * The group of participants to render.
   */
  group: Array<StreamVideoParticipant>;
} & Pick<
  ParticipantViewProps,
  'VideoPlaceholder' | 'PictureInPicturePlaceholder' | 'mirror'
> &
  Required<Pick<ParticipantViewProps, 'ParticipantViewUI'>>;

const PaginatedGridLayoutGroup = ({
  group,
  mirror,
  VideoPlaceholder,
  PictureInPicturePlaceholder,
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
          mirror={mirror}
          VideoPlaceholder={VideoPlaceholder}
          PictureInPicturePlaceholder={PictureInPicturePlaceholder}
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
   * @default false
   */
  excludeLocalParticipant?: boolean;

  /**
   * Predicate to filter call participants or a filter object.
   * @example
   * // With a predicate:
   * <PaginatedGridLayout
   *   filterParticipants={p => p.roles.includes('student')}
   * />
   * @example
   * // With a filter object:
   * <PaginatedGridLayout
   *   filterParticipants={{
   *     $or: [
   *       { roles: { $contains: 'student' } },
   *       { isPinned: true },
   *     ],
   *   }}
   * />
   */
  filterParticipants?: ParticipantPredicate | ParticipantFilter;

  /**
   * When set to `false` disables mirroring of the local partipant's video.
   * @default true
   */
  mirrorLocalParticipantVideo?: boolean;

  /**
   * Turns on/off the pagination arrows.
   * @default true
   */
  pageArrowsVisible?: boolean;

  /**
   * Whether the layout is muted. Defaults to `false`.
   */
  muted?: boolean;
} & Pick<
  ParticipantViewProps,
  'ParticipantViewUI' | 'VideoPlaceholder' | 'PictureInPicturePlaceholder'
>;

export const PaginatedGridLayout = (props: PaginatedGridLayoutProps) => {
  const {
    groupSize = (props.groupSize || 0) > 0
      ? props.groupSize || GROUP_SIZE
      : GROUP_SIZE,
    excludeLocalParticipant = false,
    filterParticipants,
    mirrorLocalParticipantVideo = true,
    pageArrowsVisible = true,
    VideoPlaceholder,
    ParticipantViewUI = DefaultParticipantViewUI,
    PictureInPicturePlaceholder,
    muted,
  } = props;
  const [page, setPage] = useState(0);
  const [
    paginatedGridLayoutWrapperElement,
    setPaginatedGridLayoutWrapperElement,
  ] = useState<HTMLDivElement | null>(null);

  const call = useCall();
  const { useRemoteParticipants } = useCallStateHooks();
  const remoteParticipants = useRemoteParticipants();
  const participants = useFilteredParticipants({
    excludeLocalParticipant,
    filterParticipants,
  });

  usePaginatedLayoutSortPreset(call);

  useEffect(() => {
    if (!paginatedGridLayoutWrapperElement || !call) return;

    const cleanup = call.setViewport(paginatedGridLayoutWrapperElement);

    return () => cleanup();
  }, [paginatedGridLayoutWrapperElement, call]);

  // only used to render video elements
  const participantGroups = useMemo(
    () => chunk(participants, groupSize),
    [participants, groupSize],
  );

  const pageCount = participantGroups.length;

  // update page when page count is reduced and selected page no longer exists
  useEffect(() => {
    if (page > pageCount - 1) {
      setPage(Math.max(0, pageCount - 1));
    }
  }, [page, pageCount]);

  const selectedGroup = participantGroups[page];
  const mirror = mirrorLocalParticipantVideo ? undefined : false;

  if (!call) return null;

  return (
    <div
      className="str-video__paginated-grid-layout__wrapper"
      ref={setPaginatedGridLayoutWrapperElement}
    >
      {!muted && <ParticipantsAudio participants={remoteParticipants} />}
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
            group={selectedGroup}
            mirror={mirror}
            VideoPlaceholder={VideoPlaceholder}
            ParticipantViewUI={ParticipantViewUI}
            PictureInPicturePlaceholder={PictureInPicturePlaceholder}
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

PaginatedGridLayout.displayName = 'PaginatedGridLayout';
