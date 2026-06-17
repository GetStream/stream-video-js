import { DegradationPreference } from '../../gen/video/sfu/models/models';
import { ensureExhausted } from '../../helpers/ensureExhausted';

export const toRTCDegradationPreference = (
  preference: DegradationPreference,
): RTCDegradationPreference | undefined => {
  switch (preference) {
    case DegradationPreference.BALANCED:
      return 'balanced';
    case DegradationPreference.MAINTAIN_FRAMERATE:
      return 'maintain-framerate';
    case DegradationPreference.MAINTAIN_RESOLUTION:
      return 'maintain-resolution';
    case DegradationPreference.MAINTAIN_FRAMERATE_AND_RESOLUTION:
      // @ts-expect-error not in the typedefs yet
      return 'maintain-framerate-and-resolution';
    case DegradationPreference.UNSPECIFIED:
      return undefined;
    default:
      ensureExhausted(preference, 'Unknown degradation preference');
      return undefined;
  }
};

export const fromRTCDegradationPreference = (
  preference: RTCDegradationPreference | undefined,
): DegradationPreference => {
  switch (preference) {
    case 'balanced':
      return DegradationPreference.BALANCED;
    case 'maintain-framerate':
      return DegradationPreference.MAINTAIN_FRAMERATE;
    case 'maintain-resolution':
      return DegradationPreference.MAINTAIN_RESOLUTION;
    // @ts-expect-error not in the typedefs yet
    case 'maintain-framerate-and-resolution':
      return DegradationPreference.MAINTAIN_FRAMERATE_AND_RESOLUTION;
    default:
      return DegradationPreference.UNSPECIFIED;
  }
};
