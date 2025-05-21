import { test, type TestContext } from 'node:test';
import { applyFilter } from './filter';

const obj = {
  num: 42,
  str: 'hello, world',
  array: ['apples', 'bananas'],
};

test('checks single $eq condition', (t: TestContext) => {
  t.assert.ok(applyFilter(obj, { num: { $eq: 42 } }));
  t.assert.ok(!applyFilter(obj, { num: { $eq: 43 } }));
});

test('checks single $neq condition', (t: TestContext) => {
  t.assert.ok(applyFilter(obj, { num: { $neq: 43 } }));
  t.assert.ok(!applyFilter(obj, { num: { $neq: 42 } }));
});

test('checks single $in condition', (t: TestContext) => {
  t.assert.ok(applyFilter(obj, { num: { $in: [41, 42, 43] } }));
  t.assert.ok(!applyFilter(obj, { num: { $in: [1, 2, 3] } }));
});

test('checks single $contains condition', (t: TestContext) => {
  t.assert.ok(applyFilter(obj, { array: { $contains: 'apples' } }));
  t.assert.ok(!applyFilter(obj, { array: { $contains: 'cherries' } }));
});

test('fails $contains condition if value is not array', (t: TestContext) => {
  // This case is not permitted by types, but can still happen in runtime
  t.assert.ok(!applyFilter(obj as any, { str: { $contains: 'apples' } }));
});

test('conditions without operator are treated as $eq', (t: TestContext) => {
  t.assert.ok(applyFilter(obj, { num: 42 }));
  t.assert.ok(!applyFilter(obj, { num: 43 }));
});

test('checks multiple conditions', (t: TestContext) => {
  t.assert.ok(applyFilter(obj, { num: 42, array: { $contains: 'bananas' } }));
  t.assert.ok(!applyFilter(obj, { num: 42, array: { $contains: 'cherries' } }));
});

test('applies $and filter', (t: TestContext) => {
  t.assert.ok(
    applyFilter(obj, {
      $and: [
        { num: 42, array: { $contains: 'bananas' } },
        { str: 'hello, world', array: { $contains: 'apples' } },
      ],
    }),
  );

  t.assert.ok(
    !applyFilter(obj, {
      $and: [
        { num: 42, array: { $contains: 'bananas' } },
        { str: 'hello, world', array: { $contains: 'cherries' } },
      ],
    }),
  );
});

test('applies $or filter', (t: TestContext) => {
  t.assert.ok(
    applyFilter(obj, {
      $or: [
        { str: 'hello, world', array: { $contains: 'cherries' } },
        { num: 42, array: { $contains: 'bananas' } },
      ],
    }),
  );

  t.assert.ok(
    !applyFilter(obj, {
      $or: [
        { str: 'hello, world', array: { $contains: 'cherries' } },
        { num: 43, array: { $contains: 'bananas' } },
      ],
    }),
  );
});

test('applies $not filter', (t: TestContext) => {
  t.assert.ok(
    applyFilter(obj, {
      $not: { str: 'hello, world', array: { $contains: 'cherries' } },
    }),
  );
});

test('applies nested filters', (t: TestContext) => {
  t.assert.ok(
    applyFilter(obj, {
      $or: [
        { str: 'hello, world', array: { $contains: 'cherries' } },
        { $and: [{ num: 42 }, { array: { $contains: 'bananas' } }] },
      ],
    }),
  );

  t.assert.ok(
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
  );
});
