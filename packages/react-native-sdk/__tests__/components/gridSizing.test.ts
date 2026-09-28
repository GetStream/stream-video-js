import {
  calculateParticipantViewSize,
  getAutoNumberOfColumns,
  getVisibleRows,
} from '../../src/components/Call/CallParticipantsList/gridSizing';

describe('getVisibleRows', () => {
  it.each([
    [3, 2, 2],
    [4, 2, 2],
    [5, 2, 3],
    [12, 2, 3],
    [6, 3, 2],
    [4, 4, 1],
    [3, 3, 1],
    [0, 2, 1],
  ])('%i participants in %i columns -> %i rows', (count, columns, rows) => {
    expect(getVisibleRows(count, columns)).toBe(rows);
  });
});

describe('getAutoNumberOfColumns', () => {
  it('keeps 2 columns in a portrait phone container', () => {
    for (const participantsLength of [3, 4, 6, 9]) {
      expect(
        getAutoNumberOfColumns({
          containerWidth: 390,
          containerHeight: 650,
          participantsLength,
        }),
      ).toBe(2);
    }
  });

  it('keeps 2 columns in a large portrait container', () => {
    expect(
      getAutoNumberOfColumns({
        containerWidth: 650,
        containerHeight: 800,
        participantsLength: 6,
      }),
    ).toBe(2);
  });

  it('adds columns in a wide container instead of stretching the tiles', () => {
    expect(
      getAutoNumberOfColumns({
        containerWidth: 860,
        containerHeight: 520,
        participantsLength: 6,
      }),
    ).toBe(3);
  });

  it('uses one full-height row instead of reserving an empty row', () => {
    expect(
      getAutoNumberOfColumns({
        containerWidth: 860,
        containerHeight: 520,
        participantsLength: 3,
      }),
    ).toBe(3);
  });

  it('fills a wide short window as 2x2 instead of one row of tall tiles', () => {
    expect(
      getAutoNumberOfColumns({
        containerWidth: 800,
        containerHeight: 400,
        participantsLength: 4,
      }),
    ).toBe(2);
  });

  it('prefers bigger tiles over more columns in a phone landscape window', () => {
    expect(
      getAutoNumberOfColumns({
        containerWidth: 602,
        containerHeight: 327,
        participantsLength: 5,
      }),
    ).toBe(3);
  });

  it('never exceeds the participant count', () => {
    expect(
      getAutoNumberOfColumns({
        containerWidth: 2000,
        containerHeight: 300,
        participantsLength: 3,
      }),
    ).toBe(3);
  });

  it('falls back to 2 columns before the container is measured', () => {
    expect(
      getAutoNumberOfColumns({
        containerWidth: 0,
        containerHeight: 0,
        participantsLength: 6,
      }),
    ).toBe(2);
  });
});

describe('calculateParticipantViewSize', () => {
  const margin = 4;

  it.each([
    [390, 650, 6, 2],
    [690, 350, 6, 3],
    [860, 520, 6, 4],
  ])(
    'keeps every row and column of a %ix%i grid inside the container',
    (containerWidth, containerHeight, participantsLength, numberOfColumns) => {
      const { itemWidth, itemHeight } = calculateParticipantViewSize({
        containerWidth,
        containerHeight,
        participantsLength,
        numberOfColumns,
        horizontal: false,
        margin,
      });
      const rows = getVisibleRows(participantsLength, numberOfColumns);
      expect(numberOfColumns * (itemWidth + margin * 2)).toBeCloseTo(
        containerWidth,
      );
      expect(rows * (itemHeight + margin * 2)).toBeCloseTo(containerHeight);
    },
  );

  it('fits the horizontal margins in horizontal mode', () => {
    const { itemWidth, itemHeight } = calculateParticipantViewSize({
      containerWidth: 400,
      containerHeight: 120,
      participantsLength: 5,
      numberOfColumns: 2,
      horizontal: true,
      margin,
    });
    expect(2 * (itemWidth + 8 * 2)).toBeCloseTo(400);
    expect(itemHeight + margin * 2).toBeCloseTo(120);
  });
});
