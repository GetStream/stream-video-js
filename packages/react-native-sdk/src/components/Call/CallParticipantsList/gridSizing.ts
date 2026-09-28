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
 */
export const getAutoNumberOfColumns = ({
  containerHeight,
  containerWidth,
  participantsLength,
}: {
  containerHeight: number;
  containerWidth: number;
  participantsLength: number;
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
    columns++
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
