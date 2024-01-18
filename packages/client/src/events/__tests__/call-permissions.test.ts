import { describe, expect, it } from 'vitest';
import { CallState } from '../../store';
import { watchCallGrantsUpdated } from '../call-permissions';
import { OwnCapability } from '../../gen/coordinator';

describe('Call Permission Events', () => {
  it('handles sfu.callGrantsUpdated', () => {
    const state = new CallState();
    const handler = watchCallGrantsUpdated(state);
    handler({
      message: 'test',
      currentGrants: {
        canPublishAudio: true,
        canPublishVideo: true,
        canScreenshare: true,
      },
    });

    expect(state.ownCapabilities).toEqual([
      OwnCapability.SEND_AUDIO,
      OwnCapability.SEND_VIDEO,
      OwnCapability.SCREENSHARE,
    ]);

    handler({
      message: 'test',
      currentGrants: {
        canPublishAudio: true,
        canPublishVideo: false,
        canScreenshare: false,
      },
    });
    expect(state.ownCapabilities).toEqual([OwnCapability.SEND_AUDIO]);
  });
});
