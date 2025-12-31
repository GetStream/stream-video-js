import { useCall, useI18n } from '@stream-io/video-react-bindings';
import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { hasScreenShare } from '@stream-io/video-client';
import { Icon, IconButton } from '../../../../components';
import {
  DefaultParticipantViewUI,
  ParticipantView,
} from '../../ParticipantView';
import {
  useFilteredParticipants,
  usePaginatedLayoutSortPreset,
} from '../hooks';
import { chunk } from '../../../../utilities';
import { PipLayoutProps } from './Pip';

type GridDensity = 'single' | 'small' | 'medium' | 'large' | 'overflow';

export type PipLayoutGridProps = PipLayoutProps & {
  /**
   * The number of participants to display per page.
   * @default 9
   */
  groupSize?: number;

  /**
   * Whether to show pagination arrows when there are multiple pages.
   * @default true
   */
  pageArrowsVisible?: boolean;
};

const getGridDensity = (count: number): GridDensity => {
  if (count === 1) return 'single';
  if (count <= 5) return 'small';
  if (count <= 9) return 'medium';
  if (count <= 16) return 'large';
  return 'overflow';
};

/**
 * A grid-based PIP layout with pagination support.
 * Use this when you need a more structured grid view in PIP mode.
 */
export const Grid = (props: PipLayoutGridProps) => {
  const { t } = useI18n();
  const {
    excludeLocalParticipant = false,
    filterParticipants,
    mirrorLocalParticipantVideo = true,
    groupSize = 9,
    pageArrowsVisible = true,
    VideoPlaceholder,
    ParticipantViewUI = DefaultParticipantViewUI,
  } = props;

  const [page, setPage] = useState(0);
  const [wrapperElement, setWrapperElement] = useState<HTMLDivElement | null>(
    null,
  );

  const call = useCall();
  const participants = useFilteredParticipants({
    excludeLocalParticipant,
    filterParticipants,
  });
  const screenSharingParticipant = participants.find((p) => hasScreenShare(p));

  usePaginatedLayoutSortPreset(call);

  useEffect(() => {
    if (!wrapperElement || !call) return;
    return call.setViewport(wrapperElement);
  }, [wrapperElement, call]);

  const participantGroups = useMemo(
    () => chunk(participants, groupSize),
    [participants, groupSize],
  );

  const pageCount = participantGroups.length;

  if (page > pageCount - 1) {
    setPage(Math.max(0, pageCount - 1));
  }

  const selectedGroup = participantGroups[page];
  const mirror = mirrorLocalParticipantVideo ? undefined : false;

  if (!call) return null;

  return (
    <div
      className="str-video__pip-layout str-video__pip-layout--grid"
      ref={setWrapperElement}
    >
      {screenSharingParticipant &&
        (screenSharingParticipant.isLocalParticipant ? (
          <div className="str-video__pip-screen-share-local">
            <Icon icon="screen-share-off" />
            <span className="str-video__pip-screen-share-local__title">
              {t('You are presenting your screen')}
            </span>
          </div>
        ) : (
          <ParticipantView
            participant={screenSharingParticipant}
            trackType="screenShareTrack"
            muteAudio
            mirror={false}
            VideoPlaceholder={VideoPlaceholder}
            ParticipantViewUI={ParticipantViewUI}
          />
        ))}
      <div className="str-video__pip-layout__grid-container">
        {pageArrowsVisible && page > 0 && (
          <IconButton
            icon="caret-left"
            onClick={() =>
              setPage((currentPage) => Math.max(0, currentPage - 1))
            }
            className="str-video__pip-layout__pagination-button str-video__pip-layout__pagination-button--left"
          />
        )}
        {selectedGroup && (
          <div
            className={clsx(
              'str-video__pip-layout__grid',
              `str-video__pip-layout__grid--${getGridDensity(selectedGroup.length)}`,
            )}
          >
            {selectedGroup.map((participant) => (
              <ParticipantView
                key={participant.sessionId}
                participant={participant}
                muteAudio
                mirror={mirror}
                VideoPlaceholder={VideoPlaceholder}
                ParticipantViewUI={ParticipantViewUI}
              />
            ))}
          </div>
        )}
        {pageArrowsVisible && page < pageCount - 1 && (
          <IconButton
            icon="caret-right"
            onClick={() =>
              setPage((currentPage) => Math.min(pageCount - 1, currentPage + 1))
            }
            className="str-video__pip-layout__pagination-button str-video__pip-layout__pagination-button--right"
          />
        )}
      </div>
    </div>
  );
};

Grid.displayName = 'PipLayout.Grid';
