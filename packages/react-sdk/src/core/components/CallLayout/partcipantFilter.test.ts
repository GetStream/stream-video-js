import { StreamVideoParticipant } from '@stream-io/video-client';
import { test, type TestContext } from 'node:test';
import { applyParticipantsFilter } from './hooks';

const participants = [
  {
    userId: 'host-id',
    isSpeaking: true,
    isDominantSpeaker: true,
    name: 'Host',
    roles: ['host', 'admin'],
  },
  {
    userId: 'listener-id-1',
    isSpeaking: false,
    isDominantSpeaker: false,
    name: 'Listener 1',
    roles: ['listener', 'user'],
    pin: { pinnedAt: new Date() },
  },
  {
    userId: 'listener-id-2',
    isSpeaking: false,
    isDominantSpeaker: false,
    name: 'Listener 2',
    roles: ['listener', 'user'],
  },
] as StreamVideoParticipant[];

test('applies predicate filter', (t: TestContext) => {
  const filtered = applyParticipantsFilter(participants, (p) =>
    p.roles.includes('listener'),
  );

  t.assert.strictEqual(filtered.length, 2);
  t.assert.deepStrictEqual(
    filtered.map((p) => p.userId),
    ['listener-id-1', 'listener-id-2'],
  );
});

test('applies filter object', (t: TestContext) => {
  const filtered = applyParticipantsFilter(participants, {
    $and: [
      { roles: { $contains: 'listener' } },
      { $not: { roles: { $contains: 'host' } } },
    ],
  });

  t.assert.strictEqual(filtered.length, 2);
  t.assert.deepStrictEqual(
    filtered.map((p) => p.userId),
    ['listener-id-1', 'listener-id-2'],
  );
});

test('filter object supports boolean pin property', (t: TestContext) => {
  const filtered = applyParticipantsFilter(participants, {
    roles: { $contains: 'listener' },
    isPinned: true,
  });

  t.assert.strictEqual(filtered.length, 1);
  t.assert.strictEqual(filtered[0].userId, 'listener-id-1');
});
