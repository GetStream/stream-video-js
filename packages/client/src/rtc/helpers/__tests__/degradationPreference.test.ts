import { describe, expect, it } from 'vitest';
import { DegradationPreference } from '../../../gen/video/sfu/models/models';
import { toRTCDegradationPreference } from '../degradationPreference';

describe('toRTCDegradationPreference', () => {
  it.each([
    [DegradationPreference.BALANCED, 'balanced'],
    [DegradationPreference.MAINTAIN_FRAMERATE, 'maintain-framerate'],
    [DegradationPreference.MAINTAIN_RESOLUTION, 'maintain-resolution'],
    [
      DegradationPreference.MAINTAIN_FRAMERATE_AND_RESOLUTION,
      'maintain-framerate-and-resolution',
    ],
  ])('maps %s to "%s"', (preference, expected) => {
    expect(toRTCDegradationPreference(preference)).toBe(expected);
  });

  it('returns undefined for UNSPECIFIED', () => {
    expect(
      toRTCDegradationPreference(DegradationPreference.UNSPECIFIED),
    ).toBeUndefined();
  });
});
