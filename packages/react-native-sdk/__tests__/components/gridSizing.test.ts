import {
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
    [4, 4, 2],
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
