import { describe, expect, it } from 'vitest';
import * as TestData from './participant-data';
import { VisibilityState } from '../../types';
import { paginatedLayoutSortPreset } from '../presets';
import { TrackType } from '../../gen/video/sfu/models/models';

describe('presets', () => {
  it('paginatedLayoutSortPreset', () => {
    const ps = TestData.participants().map((p) => ({
      ...p,
      viewportVisibilityState: {
        videoTrack: VisibilityState.UNKNOWN,
        screenShareTrack: VisibilityState.UNKNOWN,
      },
    }));

    expect(ps.sort(paginatedLayoutSortPreset).map((p) => p.name)).toEqual([
      'F',
      'B',
      'E',
      'D',
      'A',
      'C',
    ]);

    // server-pin C
    ps.at(-1)!.pin = {
      isLocalPin: false,
      pinnedAt: Date.now(),
    };

    expect(ps.sort(paginatedLayoutSortPreset).map((p) => p.name)).toEqual([
      'C',
      'F',
      'B',
      'E',
      'D',
      'A',
    ]);

    ps.at(-3)!.publishedTracks = [TrackType.AUDIO]; // E
    ps.at(-2)!.isDominantSpeaker = false; // D
    ps.at(-1)!.isDominantSpeaker = true; // A

    expect(ps.sort(paginatedLayoutSortPreset).map((p) => p.name)).toEqual([
      'C',
      'F',
      'B',
      'A',
      'E',
      'D',
    ]);
  });
});
