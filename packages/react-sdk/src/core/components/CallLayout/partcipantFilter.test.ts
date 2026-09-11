import { StreamVideoParticipant } from '@stream-io/video-client';
import { describe, expect, it } from 'vitest';
import { applyParticipantsFilter } from './hooks';

// `publishedTracks` is required: the filter-object path derives `hasVideo` / `hasAudio` /
// `hasScreenShare` from it, and those read the array unguarded.
const participants = [
  {
    userId: 'host-id',
    isSpeaking: true,
    isDominantSpeaker: true,
    name: 'Host',
    roles: ['host', 'admin'],
    publishedTracks: [],
  },
  {
    userId: 'listener-id-1',
    isSpeaking: false,
    isDominantSpeaker: false,
    name: 'Listener 1',
    roles: ['listener', 'user'],
    pin: { pinnedAt: new Date() },
    publishedTracks: [],
  },
  {
    userId: 'listener-id-2',
    isSpeaking: false,
    isDominantSpeaker: false,
    name: 'Listener 2',
    roles: ['listener', 'user'],
    publishedTracks: [],
  },
] as unknown as StreamVideoParticipant[];

describe('applyParticipantsFilter', () => {
  it('applies predicate filter', () => {
    const filtered = applyParticipantsFilter(participants, (p) =>
      p.roles.includes('listener'),
    );

    expect(filtered).toHaveLength(2);
    expect(filtered.map((p) => p.userId)).toEqual([
      'listener-id-1',
      'listener-id-2',
    ]);
  });

  it('applies filter object', () => {
    const filtered = applyParticipantsFilter(participants, {
      $and: [
        { roles: { $contains: 'listener' } },
        { $not: { roles: { $contains: 'host' } } },
      ],
    });

    expect(filtered).toHaveLength(2);
    expect(filtered.map((p) => p.userId)).toEqual([
      'listener-id-1',
      'listener-id-2',
    ]);
  });

  it('filter object supports boolean pin property', () => {
    const filtered = applyParticipantsFilter(participants, {
      roles: { $contains: 'listener' },
      isPinned: true,
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].userId).toBe('listener-id-1');
  });
});
