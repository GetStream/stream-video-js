export const DEFAULT_NUMBER_OF_COLUMNS = 2;
const MAX_AUTO_NUMBER_OF_COLUMNS = 4;
const MAX_VISIBLE_ROWS = 3;

// 2 rows fit up to 4 participants in the default 2 columns, and at most 3 rows
// are visible at once, the rest is reachable by scrolling
export const getVisibleRows = (
  participantsLength: number,
  numberOfColumns: number,
) =>
  Math.max(
    2,
    Math.min(Math.ceil(participantsLength / numberOfColumns), MAX_VISIBLE_ROWS),
  );

/**
 * Picks the number of columns whose tiles come closest to a square
 * for the given container, so that wide containers get more columns
 * instead of stretched tiles.
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
  let bestScore = Number.MAX_VALUE;
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
    const aspectRatio = containerWidth / columns / (containerHeight / rows);
    const score = Math.abs(Math.log(aspectRatio));
    if (score < bestScore) {
      bestScore = score;
      bestColumns = columns;
    }
  }
  return bestColumns;
};
