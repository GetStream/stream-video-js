import { extractCallingExpOptions } from '../../src/utils/push/libs/callingx';
import type { StreamVideoConfig } from '../../src/utils/StreamVideoRN/types';

const config = (ios?: NonNullable<StreamVideoConfig['push']>['ios']) =>
  ({
    push: { ios },
    foregroundService: { android: {} },
  }) as unknown as StreamVideoConfig;

describe('extractCallingExpOptions', () => {
  it.each([true, false])(
    'passes useLiveCommunicationKit=%s through',
    (flag) => {
      expect(
        extractCallingExpOptions(config({ useLiveCommunicationKit: flag })).ios,
      ).toEqual({ useLiveCommunicationKit: flag });
    },
  );

  it('omits useLiveCommunicationKit when undefined', () => {
    const options = extractCallingExpOptions(config({ supportsVideo: true }));
    expect(options.ios).toEqual({ supportsVideo: true });
    expect(options.ios).not.toHaveProperty('useLiveCommunicationKit');
  });
});
