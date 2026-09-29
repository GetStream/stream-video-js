export const DEFAULT_NUMBER_OF_COLUMNS = 2;
const MAX_AUTO_NUMBER_OF_COLUMNS = 4;
const MAX_VISIBLE_ROWS = 3;

// only the rows occupied by participants are visible, at most 3 at once,
// the rest is reachable by scrolling
export const getVisibleRows = (
  participantsLength: number,
  numberOfColumns: number,
) =>
  Math.max(
    1,
    Math.min(Math.ceil(participantsLength / numberOfColumns), MAX_VISIBLE_ROWS),
  );

/**
 * Picks the number of columns whose cells fit the largest square tile
 * (the biggest `min(cellWidth, cellHeight)`) for the given container,
 * so that tiles are as big as possible. Ties keep fewer columns.
 * With `evenGridColumns`, only even column counts are considered, so the grid
 * divides cleanly down the middle, where foldable devices have their hinge.
 */
export const getAutoNumberOfColumns = ({
  containerHeight,
  containerWidth,
  participantsLength,
  evenGridColumns = false,
}: {
  containerHeight: number;
  containerWidth: number;
  participantsLength: number;
  evenGridColumns?: boolean;
}) => {
  if (containerWidth <= 0 || containerHeight <= 0) {
    return DEFAULT_NUMBER_OF_COLUMNS;
  }
  let bestColumns = DEFAULT_NUMBER_OF_COLUMNS;
  let bestTileSize = 0;
  const maxColumns = Math.min(
    MAX_AUTO_NUMBER_OF_COLUMNS,
    Math.max(DEFAULT_NUMBER_OF_COLUMNS, participantsLength),
  );
  for (
    let columns = DEFAULT_NUMBER_OF_COLUMNS;
    columns <= maxColumns;
    columns += evenGridColumns ? 2 : 1
  ) {
    const rows = getVisibleRows(participantsLength, columns);
    const tileSize = Math.min(containerWidth / columns, containerHeight / rows);
    if (tileSize > bestTileSize) {
      bestTileSize = tileSize;
      bestColumns = columns;
    }
  }
  return bestColumns;
};

/**
 * Calculates the size of a participant view from the size of the list's
 * container and the number of participants. The margin is applied on every
 * side of the view, so it is subtracted twice per axis to keep each row and
 * column within the container. In horizontal mode the left and right margin
 * is `horizontalMargin` instead.
 */
export const calculateParticipantViewSize = ({
  containerHeight,
  containerWidth,
  participantsLength,
  numberOfColumns,
  horizontal,
  margin,
  horizontalMargin,
}: {
  containerHeight: number;
  containerWidth: number;
  participantsLength: number;
  numberOfColumns: number;
  horizontal: boolean | undefined;
  margin: number;
  horizontalMargin: number;
}) => {
  if (horizontal) {
    return {
      itemHeight: containerHeight - margin * 2,
      itemWidth: containerWidth / numberOfColumns - horizontalMargin * 2,
    };
  }
  const rows = getVisibleRows(participantsLength, numberOfColumns);
  return {
    itemHeight: containerHeight / rows - margin * 2,
    itemWidth: containerWidth / numberOfColumns - margin * 2,
  };
};
