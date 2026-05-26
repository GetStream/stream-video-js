import { describe, expect, it } from 'vitest';
import { DegradationPreference } from '../../../gen/video/sfu/models/models';
import {
  fromRTCDegradationPreference,
  toRTCDegradationPreference,
} from '../degradationPreference';

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

describe('fromRTCDegradationPreference', () => {
  it.each([
    ['balanced', DegradationPreference.BALANCED],
    ['maintain-framerate', DegradationPreference.MAINTAIN_FRAMERATE],
    ['maintain-resolution', DegradationPreference.MAINTAIN_RESOLUTION],
    [
      'maintain-framerate-and-resolution',
      DegradationPreference.MAINTAIN_FRAMERATE_AND_RESOLUTION,
    ],
  ] as const)('maps "%s" to %s', (preference, expected) => {
    // @ts-expect-error not in the lib types yet
    expect(fromRTCDegradationPreference(preference)).toBe(expected);
  });

  it('returns UNSPECIFIED for undefined', () => {
    expect(fromRTCDegradationPreference(undefined)).toBe(
      DegradationPreference.UNSPECIFIED,
    );
  });

  it('returns UNSPECIFIED for an unknown value', () => {
    expect(
      fromRTCDegradationPreference(
        'something-else' as unknown as RTCDegradationPreference,
      ),
    ).toBe(DegradationPreference.UNSPECIFIED);
  });
});
