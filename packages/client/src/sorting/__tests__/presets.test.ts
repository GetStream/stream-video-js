import { describe, expect, it } from 'vitest';
import * as TestData from './participant-data';
import { StreamVideoParticipant, VisibilityState } from '../../types';
import { Comparator } from '../comparator';
import {
  defaultSortPreset,
  livestreamOrAudioRoomSortPreset,
  paginatedLayoutSortPreset,
  speakerLayoutSortPreset,
} from '../presets';
import {
  ParticipantSource,
  TrackType,
} from '../../gen/video/sfu/models/models';

const participant = (
  name: string,
  publishedTracks: TrackType[],
  visibility: VisibilityState = VisibilityState.VISIBLE,
  overrides: Partial<StreamVideoParticipant> = {},
): StreamVideoParticipant =>
  ({
    name,
    userId: name,
    sessionId: name,
    roles: ['user'],
    publishedTracks,
    trackLookupPrefix: name,
    isSpeaking: false,
    isDominantSpeaker: false,
    audioLevel: 0,
    image: '',
    source: ParticipantSource.WEBRTC_UNSPECIFIED,
    viewportVisibilityState: {
      videoTrack: visibility,
      screenShareTrack: visibility,
    },
    ...overrides,
  }) as StreamVideoParticipant;

const names = (ps: StreamVideoParticipant[]) => ps.map((p) => p.name);

// every preset that prioritizes publishing participants over passive ones
const presets: [string, Comparator<StreamVideoParticipant>][] = [
  ['defaultSortPreset', defaultSortPreset],
  ['speakerLayoutSortPreset', speakerLayoutSortPreset],
  ['livestreamOrAudioRoomSortPreset', livestreamOrAudioRoomSortPreset],
];

const { UNKNOWN, VISIBLE, INVISIBLE } = VisibilityState;
const { AUDIO, VIDEO, SCREEN_SHARE } = TrackType;

describe('presets', () => {
  it('paginatedLayoutSortPreset', () => {
    const ps = TestData.participants().map((p) => ({
      ...p,
      viewportVisibilityState: {
        videoTrack: VisibilityState.UNKNOWN,
        screenShareTrack: VisibilityState.UNKNOWN,
      },
    }));

    expect(ps.sort(paginatedLayoutSortPreset).map((p) => p.name))
      .toMatchInlineSnapshot(`
      [
        "F",
        "D",
        "A",
        "B",
        "C",
        "E",
      ]
    `);

    // server-pin C
    ps.at(-1)!.pin = {
      isLocalPin: false,
      pinnedAt: Date.now(),
    };

    expect(ps.sort(paginatedLayoutSortPreset).map((p) => p.name))
      .toMatchInlineSnapshot(`
      [
        "E",
        "F",
        "D",
        "A",
        "B",
        "C",
      ]
    `);

    ps.at(-3)!.publishedTracks = [TrackType.AUDIO]; // E
    ps.at(-2)!.isDominantSpeaker = false; // D
    ps.at(-1)!.isDominantSpeaker = true; // A

    expect(ps.sort(paginatedLayoutSortPreset).map((p) => p.name))
      .toMatchInlineSnapshot(`
      [
        "E",
        "F",
        "D",
        "C",
        "B",
        "A",
      ]
    `);
  });

  // In SpeakerLayout the viewport is the participants bar, so the spotlight
  // tile is never observed and stays UNKNOWN. Regression test for a passive
  // participant holding the spotlight over a participant publishing video.
  it.each(presets)(
    '%s keeps passive participants out of the spotlight',
    (_, preset) => {
      const ps = [
        participant('passive-viewer', [], UNKNOWN),
        participant('host', [VIDEO]),
        participant('local-viewer', [], VISIBLE, { isLocalParticipant: true }),
      ];

      expect(names(ps.sort(preset))).toEqual([
        'host',
        'passive-viewer',
        'local-viewer',
      ]);
    },
  );

  it.each(presets)(
    '%s promotes a rejoined publisher appended last',
    (_, preset) => {
      const ps = [
        participant('v1', [], UNKNOWN),
        participant('v2', []),
        participant('v3', []),
      ].sort(preset);
      // a rejoining participant is appended to the end of the list
      ps.push(participant('host', [AUDIO, VIDEO], UNKNOWN));

      expect(names(ps.sort(preset))).toEqual(['host', 'v1', 'v2', 'v3']);
    },
  );

  it.each(presets)(
    '%s ranks passive participants below publishing ones regardless of visibility',
    (_, preset) => {
      const passive = [
        participant('p1', [], UNKNOWN),
        participant('p2', [], VISIBLE),
        participant('p3', [], INVISIBLE),
      ];
      const publishing = [
        participant('a1', [VIDEO], UNKNOWN),
        participant('a2', [AUDIO], VISIBLE),
        participant('a3', [AUDIO, VIDEO], INVISIBLE),
      ];

      for (const a of passive) {
        for (const b of publishing) {
          expect(preset(a, b)).toBe(1);
          expect(preset(b, a)).toBe(-1);
        }
      }
    },
  );

  // `publishing` ignores the track type, so a participant keeps its rank while
  // it still publishes something. In speakerLayoutSortPreset the gated
  // comparators cannot override this, because the gate only opens on INVISIBLE.
  it.each<[string, TrackType[]]>([
    ['camera and microphone on', [AUDIO, VIDEO]],
    ['the microphone muted', [VIDEO]],
    ['the camera turned off', [AUDIO]],
  ])(
    'speakerLayoutSortPreset keeps the spotlight with %s',
    (_, spotlightTracks) => {
      const ps = [
        participant('spotlight', spotlightTracks, UNKNOWN),
        participant('bar', [AUDIO, VIDEO]),
      ];

      expect(names(ps.sort(speakerLayoutSortPreset))).toEqual([
        'spotlight',
        'bar',
      ]);
    },
  );

  it('speakerLayoutSortPreset drops a spotlight that stops publishing', () => {
    const ps = [
      participant('spotlight', [], UNKNOWN),
      participant('bar', [AUDIO, VIDEO]),
    ];

    expect(names(ps.sort(speakerLayoutSortPreset))).toEqual([
      'bar',
      'spotlight',
    ]);
  });

  // livestreamOrAudioRoomSortPreset gates on INVISIBLE *or* UNKNOWN, so an
  // unobserved spotlight tile stays comparable by audio and video state. This
  // predates the `publishing` comparator, which only breaks ties between a
  // publishing and a non-publishing participant.
  it('livestreamOrAudioRoomSortPreset still re-ranks publishers by track state', () => {
    const ps = [
      participant('spotlight', [VIDEO], UNKNOWN),
      participant('bar', [AUDIO, VIDEO]),
    ];

    expect(names(ps.sort(livestreamOrAudioRoomSortPreset))).toEqual([
      'bar',
      'spotlight',
    ]);
  });

  it.each<[string, TrackType[], Partial<StreamVideoParticipant>]>([
    ['a pinned participant', [], { pin: { isLocalPin: true, pinnedAt: 1 } }],
    ['a presenter', [SCREEN_SHARE], {}],
    ['the dominant speaker', [AUDIO], { isDominantSpeaker: true }],
  ])(
    'speakerLayoutSortPreset ranks %s above a publishing participant',
    (_, tracks, overrides) => {
      const ps = [
        participant('publisher', [AUDIO, VIDEO], UNKNOWN),
        participant('contender', tracks, VISIBLE, overrides),
      ];

      expect(names(ps.sort(speakerLayoutSortPreset))).toEqual([
        'contender',
        'publisher',
      ]);
    },
  );

  it('livestreamOrAudioRoomSortPreset still uses role as a tie breaker between publishers', () => {
    const ps = [
      participant('viewer', [AUDIO, VIDEO]),
      participant('host', [AUDIO, VIDEO], UNKNOWN, { roles: ['host'] }),
    ];

    expect(names(ps.sort(livestreamOrAudioRoomSortPreset))).toEqual([
      'host',
      'viewer',
    ]);
  });
});
