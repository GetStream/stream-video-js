import { describe, expect, it } from 'vitest';
import { CallState } from '../../store';
import {
  watchCallGrantsUpdated,
  watchCallPermissionsUpdated,
} from '../call-permissions';
import { OwnCapability } from '../../gen/coordinator';
import { ConnectionQuality } from '../../gen/video/sfu/models/models';

describe('Call Permission Events', () => {
  it('handles call.permissions_updated', () => {
    const state = new CallState();
    state.setParticipants([
      {
        userId: 'test',
        name: 'test',
        sessionId: 'test',
        isDominantSpeaker: false,
        isSpeaking: false,
        audioLevel: 0,
        image: '',
        publishedTracks: [],
        connectionQuality: ConnectionQuality.EXCELLENT,
        roles: [],
        trackLookupPrefix: '',
        isLoggedInUser: true,
      },
    ]);
    const handler = watchCallPermissionsUpdated(state);
    handler({
      type: 'call.permissions_updated',
      created_at: '',
      call_cid: 'development:12345',
      own_capabilities: [OwnCapability.SEND_AUDIO, OwnCapability.SEND_VIDEO],
      user: {
        id: 'test',
        created_at: '',
        role: '',
        updated_at: '',
        custom: {},
        teams: [],
      },
    });

    expect(state.ownCapabilities).toEqual([
      OwnCapability.SEND_AUDIO,
      OwnCapability.SEND_VIDEO,
    ]);

    handler({
      type: 'call.permissions_updated',
      created_at: '',
      call_cid: 'development:12345',
      own_capabilities: [OwnCapability.SEND_VIDEO],
      user: {
        id: 'test',
        created_at: '',
        role: '',
        updated_at: '',
        custom: {},
        teams: [],
      },
    });
    expect(state.ownCapabilities).toEqual([OwnCapability.SEND_VIDEO]);
  });

  it('handles sfu.callGrantsUpdated', () => {
    const state = new CallState();
    const handler = watchCallGrantsUpdated(state);
    handler({
      eventPayload: {
        oneofKind: 'callGrantsUpdated',
        callGrantsUpdated: {
          message: 'test',
          currentGrants: {
            canPublishAudio: true,
            canPublishVideo: true,
            canScreenshare: true,
          },
        },
      },
    });

    expect(state.ownCapabilities).toEqual([
      OwnCapability.SEND_AUDIO,
      OwnCapability.SEND_VIDEO,
      OwnCapability.SCREENSHARE,
    ]);

    handler({
      eventPayload: {
        oneofKind: 'callGrantsUpdated',
        callGrantsUpdated: {
          message: 'test',
          currentGrants: {
            canPublishAudio: true,
            canPublishVideo: false,
            canScreenshare: false,
          },
        },
      },
    });
    expect(state.ownCapabilities).toEqual([OwnCapability.SEND_AUDIO]);
  });
});
