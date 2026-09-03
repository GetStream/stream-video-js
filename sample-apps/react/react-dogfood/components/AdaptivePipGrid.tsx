import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Call,
  CallTypes,
  DefaultParticipantViewUI,
  defaultSortPreset,
  hasScreenShare,
  Icon,
  IconButton,
  paginatedLayoutSortPreset,
  ParticipantView,
  type ParticipantFilter,
  type ParticipantPredicate,
  type ParticipantViewProps,
  type StreamVideoParticipant,
  useCall,
  useFilteredParticipants,
  useI18n,
} from '@stream-io/video-react-sdk';

/** Gap between tiles, in px. Keep in sync with the SCSS gap. */
const GAP = 4;
/**
 * The aspect ratio tiles use whenever it fits at a useful size, matching the
 * main-layout grids (`ParticipantView`'s own `aspect-ratio: 4/3`).
 */
const TARGET_ASPECT = 4 / 3;
/**
 * How far the aspect ratio may drift from `TARGET_ASPECT` when space is tight.
 * Filling a cramped PIP window matters more than faithful framing, so tiles
 * are allowed to stretch and crop. The bounds come from Google Meet's
 * document-PIP, measured off its own rendering: 4 participants land on ~0.74
 * (portrait) in a very wide window, ~1.02 (square) in a medium one and ~1.85
 * in a narrow one.
 */
const CRAMPED_MIN_ASPECT = 3 / 4;
const CRAMPED_MAX_ASPECT = 16 / 9;
/**
 * The container's smaller dimension, in px, at which drift is at its fullest
 * and at which it stops entirely. Between the two it interpolates, so growing
 * the window tightens the tiles towards `TARGET_ASPECT` smoothly rather than
 * snapping at a threshold.
 */
const CRAMPED_SIZE = 320;
const SPACIOUS_SIZE = 640;
/**
 * Two arrangements within this much of the best tile area count as a tie, and
 * the one that fills more of the container height wins. Tile area alone can
 * pick a grid that is a fraction of a percent bigger but leaves a quarter of
 * the window empty.
 */
const TIE_THRESHOLD = 0.9;
/**
 * Below these sizes a tile stops being useful, so we page instead of cramming.
 * Both axes are checked: with a variable aspect ratio neither dimension
 * implies the other, and since tiles may be portrait the height floor is the
 * higher of the two. Raise these to bring the pagination arrows in sooner.
 */
const MIN_TILE_WIDTH = 100;
const MIN_TILE_HEIGHT = 104;
/** Hard cap on tiles per page, regardless of how large the window gets. */
const MAX_TILES_PER_PAGE = 16;

/** Avatar placeholder sizing, relative to the smaller tile dimension. */
const AVATAR_TILE_RATIO = 0.45;
const MIN_AVATAR_SIZE = 24;
const MAX_AVATAR_SIZE = 96;
/** Initials font size, relative to the avatar. */
const AVATAR_FONT_RATIO = 0.4;

type Tiling = {
  columns: number;
  tileWidth: number;
  tileHeight: number;
  /** Placeholder avatar size, scaled to the tile. */
  avatarSize: number;
};

export type AdaptivePipGridProps = {
  /**
   * Whether to exclude the local participant from the grid.
   * @default false
   */
  excludeLocalParticipant?: boolean;

  /**
   * Predicate to filter call participants or a filter object.
   */
  filterParticipants?: ParticipantPredicate | ParticipantFilter;

  /**
   * When set to `false` disables mirroring of the local participant's video.
   * @default true
   */
  mirrorLocalParticipantVideo?: boolean;

  /**
   * Whether to show pagination arrows when the participants don't fit the
   * current window size.
   * @default true
   */
  pageArrowsVisible?: boolean;
} & Pick<ParticipantViewProps, 'ParticipantViewUI' | 'VideoPlaceholder'>;

/**
 * A drop-in replacement for `PipLayout.Grid` that derives its column count,
 * row count and page size from the actual size of the PIP window rather than
 * from the participant count alone.
 *
 * Lives in the dogfood app (not the SDK) so we can iterate on it without
 * touching the public layout components.
 */
export const AdaptivePipGrid = (props: AdaptivePipGridProps) => {
  const {
    excludeLocalParticipant = false,
    filterParticipants,
    mirrorLocalParticipantVideo = true,
    pageArrowsVisible = true,
    VideoPlaceholder,
    ParticipantViewUI = DefaultParticipantViewUI,
  } = props;

  const call = useCall();
  const { t } = useI18n();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(MAX_TILES_PER_PAGE);
  const [wrapperElement, setWrapperElement] = useState<HTMLDivElement | null>(
    null,
  );
  const [containerElement, setContainerElement] =
    useState<HTMLDivElement | null>(null);
  const tilesRef = useRef<HTMLDivElement | null>(null);
  const pageSizeRef = useRef(pageSize);

  const participants = useFilteredParticipants({
    excludeLocalParticipant,
    filterParticipants,
  });
  const screenSharingParticipant = participants.find((p) => hasScreenShare(p));

  usePaginatedSortPreset(call);

  useEffect(() => {
    if (!wrapperElement || !call) return;
    return call.setViewport(wrapperElement);
  }, [wrapperElement, call]);

  const pages = useMemo(
    () => chunk(participants, pageSize),
    [participants, pageSize],
  );
  const pageCount = pages.length;

  const lastPage = Math.max(0, pageCount - 1);
  if (page > lastPage) {
    setPage(lastPage);
  }

  const selectedGroup = pages[page];
  const selectedGroupSize = selectedGroup?.length ?? 0;
  const mirror = mirrorLocalParticipantVideo ? undefined : false;

  /**
   * Writes the tile geometry straight to the DOM as custom properties on the
   * grid element. Deliberately not React state: a `ResizeObserver` callback
   * runs before paint, so the tiles resize in the same frame as the container.
   * Routing it through state instead leaves the tiles one frame behind for
   * every frame of a window drag, which reads as flicker.
   */
  const applyGeometry = useCallback(() => {
    const tiles = tilesRef.current;
    if (!containerElement || !tiles) return;

    const rect = containerElement.getBoundingClientRect();
    const width = Math.floor(rect.width);
    const height = Math.floor(rect.height);
    if (width <= 0 || height <= 0) return;

    const nextPageSize = getPageSize(width, height);
    if (nextPageSize !== pageSizeRef.current) {
      pageSizeRef.current = nextPageSize;
      setPageSize(nextPageSize);
    }

    const count = tiles.childElementCount;
    if (count === 0) return;

    const { columns, tileWidth, tileHeight, avatarSize } = getTiling(
      count,
      width,
      height,
    );
    tiles.style.maxWidth = `${columns * tileWidth + (columns - 1) * GAP}px`;
    tiles.style.setProperty('--rd-pip-tile-width', `${tileWidth}px`);
    tiles.style.setProperty('--rd-pip-tile-height', `${tileHeight}px`);
    tiles.style.setProperty('--rd-pip-avatar-size', `${avatarSize}px`);
    tiles.style.setProperty(
      '--rd-pip-avatar-font-size',
      `${Math.round(avatarSize * AVATAR_FONT_RATIO)}px`,
    );
  }, [containerElement]);

  useLayoutEffect(() => {
    applyGeometry();
  }, [applyGeometry, selectedGroupSize]);

  useEffect(() => {
    if (!containerElement) return;

    const view = containerElement.ownerDocument.defaultView ?? window;
    if (!view.ResizeObserver) {
      view.addEventListener('resize', applyGeometry);
      return () => view.removeEventListener('resize', applyGeometry);
    }

    const observer = new view.ResizeObserver(applyGeometry);
    observer.observe(containerElement);
    return () => observer.disconnect();
  }, [containerElement, applyGeometry]);

  if (!call) return null;

  return (
    <div className="rd__pip-grid" ref={setWrapperElement}>
      {screenSharingParticipant &&
        (screenSharingParticipant.isLocalParticipant ? (
          <div className="str-video__pip-screen-share-local">
            <Icon icon="screen-share-off" />
            <span className="str-video__pip-screen-share-local__title">
              {t('You are presenting your screen')}
            </span>
          </div>
        ) : (
          <div className="rd__pip-grid__screen-share">
            <ParticipantView
              participant={screenSharingParticipant}
              trackType="screenShareTrack"
              muteAudio
              mirror={false}
              VideoPlaceholder={VideoPlaceholder}
              ParticipantViewUI={ParticipantViewUI}
            />
          </div>
        ))}
      <div className="rd__pip-grid__container" ref={setContainerElement}>
        {pageArrowsVisible && page > 0 && (
          <IconButton
            icon="caret-left"
            onClick={() =>
              setPage((currentPage) => Math.max(0, currentPage - 1))
            }
            className="str-video__pip-layout__pagination-button str-video__pip-layout__pagination-button--left"
          />
        )}
        <div className="rd__pip-grid__tiles" ref={tilesRef}>
          {selectedGroup?.map((participant) => (
            <div key={participant.sessionId} className="rd__pip-grid__tile">
              <ParticipantView
                participant={participant}
                muteAudio
                mirror={mirror}
                VideoPlaceholder={VideoPlaceholder}
                ParticipantViewUI={ParticipantViewUI}
              />
            </div>
          ))}
        </div>
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

AdaptivePipGrid.displayName = 'AdaptivePipGrid';

/**
 * Chooses the column count that makes each tile as large as possible for the
 * given participant count and container size. This is the part the SDK's
 * `PipLayout.Grid` gets wrong in a PIP window: it derives columns from the
 * participant count alone, which is tuned for a wide 16:9 stage and leaves a
 * tall, narrow window mostly empty.
 */
const getTiling = (count: number, width: number, height: number): Tiling => {
  const bounds = getAspectBounds(width, height);
  const candidates: { columns: number; area: number; usedHeight: number }[] =
    [];

  for (let columns = 1; columns <= count; columns++) {
    const rows = Math.ceil(count / columns);
    const { tileWidth, tileHeight } = fitTile(
      count,
      columns,
      width,
      height,
      bounds,
    );
    if (tileWidth <= 0 || tileHeight <= 0) continue;
    candidates.push({
      columns,
      area: tileWidth * tileHeight,
      usedHeight: rows * tileHeight + GAP * (rows - 1),
    });
  }

  const maxArea = Math.max(0, ...candidates.map((c) => c.area));
  const best = candidates
    .filter((c) => c.area >= maxArea * TIE_THRESHOLD)
    .sort((a, b) => b.usedHeight - a.usedHeight || b.area - a.area)[0];

  const { tileWidth, tileHeight } = best
    ? fitTile(count, best.columns, width, height, bounds)
    : { tileWidth: 0, tileHeight: 0 };

  return {
    columns: best?.columns ?? 1,
    tileWidth,
    tileHeight,
    avatarSize: Math.round(
      Math.min(
        MAX_AVATAR_SIZE,
        Math.max(
          MIN_AVATAR_SIZE,
          Math.min(tileWidth, tileHeight) * AVATAR_TILE_RATIO,
        ),
      ),
    ),
  };
};

/**
 * How far the tile aspect ratio may stray from `TARGET_ASPECT`, as a function
 * of how much room the container has. A cramped window gets the full Meet-like
 * band so the grid can fill it, but `fitTile` still prefers `TARGET_ASPECT`
 * whenever it fits above the minimum useful tile size.
 */
const getAspectBounds = (width: number, height: number) => {
  const smaller = Math.min(width, height);
  const drift = Math.min(
    1,
    Math.max(0, (SPACIOUS_SIZE - smaller) / (SPACIOUS_SIZE - CRAMPED_SIZE)),
  );
  return {
    min: TARGET_ASPECT + (CRAMPED_MIN_ASPECT - TARGET_ASPECT) * drift,
    max: TARGET_ASPECT + (CRAMPED_MAX_ASPECT - TARGET_ASPECT) * drift,
  };
};

/**
 * Largest tile that fits one cell of a `columns`-wide grid. The tile takes the
 * cell's aspect ratio where the band allows, so the grid fills the container;
 * outside the band it falls back to fitting inside the cell.
 */
const fitTile = (
  count: number,
  columns: number,
  width: number,
  height: number,
  bounds: { min: number; max: number },
) => {
  const rows = Math.ceil(count / columns);
  const cellWidth = (width - GAP * (columns - 1)) / columns;
  const cellHeight = (height - GAP * (rows - 1)) / rows;
  if (cellWidth <= 0 || cellHeight <= 0) {
    return { tileWidth: 0, tileHeight: 0 };
  }

  const targetTile = fitTileWithAspect(cellWidth, cellHeight, TARGET_ASPECT);
  if (
    targetTile.tileWidth >= MIN_TILE_WIDTH &&
    targetTile.tileHeight >= MIN_TILE_HEIGHT
  ) {
    return targetTile;
  }

  const cellAspect = cellWidth / cellHeight;
  const aspect = Math.min(bounds.max, Math.max(bounds.min, cellAspect));
  return fitTileWithAspect(cellWidth, cellHeight, aspect);
};

const fitTileWithAspect = (
  cellWidth: number,
  cellHeight: number,
  aspect: number,
) => {
  const cellAspect = cellWidth / cellHeight;
  return cellAspect > aspect
    ? {
        tileWidth: Math.floor(cellHeight * aspect),
        tileHeight: Math.floor(cellHeight),
      }
    : {
        tileWidth: Math.floor(cellWidth),
        tileHeight: Math.floor(cellWidth / aspect),
      };
};

/**
 * The largest number of tiles that still renders at a usable size in the given
 * container. Everything beyond that goes to the next page.
 *
 * Scans every candidate rather than stopping at the first one that fails: tile
 * size is not monotonic in the tile count, because adding a tile can flip the
 * grid to another column count and make every tile *larger* (in a 288x440
 * container, 11 tiles are 93x107 while 9 are 142x84).
 */
const getPageSize = (width: number, height: number) => {
  if (width <= 0 || height <= 0) return MAX_TILES_PER_PAGE;

  let pageSize = 1;
  for (let count = 1; count <= MAX_TILES_PER_PAGE; count++) {
    const { tileWidth, tileHeight } = getTiling(count, width, height);
    if (tileWidth >= MIN_TILE_WIDTH && tileHeight >= MIN_TILE_HEIGHT) {
      pageSize = count;
    }
  }
  return pageSize;
};

const usePaginatedSortPreset = (call: Call | undefined) => {
  useEffect(() => {
    if (!call) return;
    call.setSortParticipantsBy(paginatedLayoutSortPreset);
    return () => {
      const callConfig = CallTypes.get(call.type);
      call.setSortParticipantsBy(
        callConfig.options.sortParticipantsBy || defaultSortPreset,
      );
    };
  }, [call]);
};

const chunk = (participants: StreamVideoParticipant[], size: number) => {
  if (participants.length === 0) return [];
  const chunks: StreamVideoParticipant[][] = [];
  for (let i = 0; i < participants.length; i += size) {
    chunks.push(participants.slice(i, i + size));
  }
  return chunks;
};
