import { describe, expect, it } from 'vitest';
import { applyFilter } from './filter';

const obj = {
  num: 42,
  str: 'hello, world',
  array: ['apples', 'bananas'],
};

describe('applyFilter', () => {
  it('checks single $eq condition', () => {
    expect(applyFilter(obj, { num: { $eq: 42 } })).toBe(true);
    expect(applyFilter(obj, { num: { $eq: 43 } })).toBe(false);
  });

  it('checks single $neq condition', () => {
    expect(applyFilter(obj, { num: { $neq: 43 } })).toBe(true);
    expect(applyFilter(obj, { num: { $neq: 42 } })).toBe(false);
  });

  it('checks single $gt condition', () => {
    expect(applyFilter(obj, { num: { $gt: 41 } })).toBe(true);
    expect(applyFilter(obj, { num: { $gt: 42 } })).toBe(false);
  });

  it('checks single $gte condition', () => {
    expect(applyFilter(obj, { num: { $gte: 42 } })).toBe(true);
    expect(applyFilter(obj, { num: { $gte: 43 } })).toBe(false);
  });

  it('checks single $lt condition', () => {
    expect(applyFilter(obj, { num: { $lt: 43 } })).toBe(true);
    expect(applyFilter(obj, { num: { $lt: 42 } })).toBe(false);
  });

  it('checks single $lte condition', () => {
    expect(applyFilter(obj, { num: { $lte: 42 } })).toBe(true);
    expect(applyFilter(obj, { num: { $lte: 41 } })).toBe(false);
  });

  it('checks single $in condition', () => {
    expect(applyFilter(obj, { num: { $in: [41, 42, 43] } })).toBe(true);
    expect(applyFilter(obj, { num: { $in: [1, 2, 3] } })).toBe(false);
  });

  it('checks single $contains condition', () => {
    expect(applyFilter(obj, { array: { $contains: 'apples' } })).toBe(true);
    expect(applyFilter(obj, { array: { $contains: 'cherries' } })).toBe(false);
  });

  it('fails $contains condition if value is not array', () => {
    // This case is not permitted by types, but can still happen in runtime
    expect(applyFilter(obj as any, { str: { $contains: 'apples' } })).toBe(
      false,
    );
  });

  it('conditions without operator are treated as $eq', () => {
    expect(applyFilter(obj, { num: 42 })).toBe(true);
    expect(applyFilter(obj, { num: 43 })).toBe(false);
  });

  it('checks multiple conditions', () => {
    expect(applyFilter(obj, { num: 42, array: { $contains: 'bananas' } })).toBe(
      true,
    );
    expect(
      applyFilter(obj, { num: 42, array: { $contains: 'cherries' } }),
    ).toBe(false);
  });

  it('applies $and filter', () => {
    expect(
      applyFilter(obj, {
        $and: [
          { num: 42, array: { $contains: 'bananas' } },
          { str: 'hello, world', array: { $contains: 'apples' } },
        ],
      }),
    ).toBe(true);

    expect(
      applyFilter(obj, {
        $and: [
          { num: 42, array: { $contains: 'bananas' } },
          { str: 'hello, world', array: { $contains: 'cherries' } },
        ],
      }),
    ).toBe(false);
  });

  it('applies $or filter', () => {
    expect(
      applyFilter(obj, {
        $or: [
          { str: 'hello, world', array: { $contains: 'cherries' } },
          { num: 42, array: { $contains: 'bananas' } },
        ],
      }),
    ).toBe(true);

    expect(
      applyFilter(obj, {
        $or: [
          { str: 'hello, world', array: { $contains: 'cherries' } },
          { num: 43, array: { $contains: 'bananas' } },
        ],
      }),
    ).toBe(false);
  });

  it('applies $not filter', () => {
    expect(
      applyFilter(obj, {
        $not: { str: 'hello, world', array: { $contains: 'cherries' } },
      }),
    ).toBe(true);
  });

  it('applies nested filters', () => {
    expect(
      applyFilter(obj, {
        $or: [
          { str: 'hello, world', array: { $contains: 'cherries' } },
          { $and: [{ num: 42 }, { array: { $contains: 'bananas' } }] },
        ],
      }),
    ).toBe(true);

    expect(
      applyFilter(obj, {
        $not: {
          $or: [
            { str: 'hello, world', array: { $contains: 'cherries' } },
            {
              $and: [
                { num: 42 },
                { array: { $contains: 'bananas' } },
                { str: 'bye, world' },
              ],
            },
          ],
        },
      }),
    ).toBe(true);
  });
});
