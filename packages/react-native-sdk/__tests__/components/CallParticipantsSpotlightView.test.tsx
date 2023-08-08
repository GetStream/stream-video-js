import React from 'react';
import { mockClientWithUser } from '../mocks/client';
import { SfuModels } from '@stream-io/video-client';
import mockParticipant from '../mocks/participant';
import { ComponentTestIds } from '../../src/constants/TestIds';
import { mockCall } from '../mocks/call';
import { render, screen } from '../utils/RNTLTools';
import { CallParticipantsSpotlightView } from '../../src/components/call/internal/CallParticipantsSpotlightView';

console.warn = jest.fn();
jest.useFakeTimers();

enum P_IDS {
  LOCAL_1 = 'local-1',
  REMOTE_1 = 'remote-1',
  REMOTE_2 = 'remote-2',
}

describe('CallParticipantsSpotlightView', () => {
  it('should render an local video view when only 1 participant present in the call', async () => {
    const call = mockCall(mockClientWithUser(), [
      mockParticipant({
        isLocalParticipant: true,
        sessionId: P_IDS.LOCAL_1,
        userId: P_IDS.LOCAL_1,
      }),
      mockParticipant({
        publishedTracks: [
          SfuModels.TrackType.AUDIO,
          SfuModels.TrackType.VIDEO,
          SfuModels.TrackType.SCREEN_SHARE,
        ],
        sessionId: P_IDS.REMOTE_1,
        userId: P_IDS.REMOTE_1,
        screenShareStream: {
          toURL: () => 'screen-share-url',
        },
      }),
    ]);

    render(<CallParticipantsSpotlightView />, {
      call,
    });

    expect(
      await screen.findByTestId(
        ComponentTestIds.PARTICIPANT_VIEW_SCREEN_SHARING,
      ),
    ).toBeVisible();
  });
});
