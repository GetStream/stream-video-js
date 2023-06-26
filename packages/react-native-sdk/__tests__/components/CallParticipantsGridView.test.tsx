import React from 'react';
import { mockClientWithUser } from '../mocks/client';
import { SfuModels } from '@stream-io/video-client';
import mockParticipant from '../mocks/participant';
import { A11yComponents } from '../../src/constants/A11yLabels';
import { mockCall } from '../mocks/call';
import { render, screen } from '../utils/RNTLTools';
import { CallParticipantsGridView } from '../../src/components/CallParticipantsGridView';

console.warn = jest.fn();
jest.useFakeTimers();

enum P_IDS {
  LOCAL_1 = 'local-1',
  REMOTE_1 = 'remote-1',
  REMOTE_2 = 'remote-2',
}

describe('CallParticipantsGridView', () => {
  it('should render an local video view when only 1 participant present in the call', async () => {
    const call = mockCall(mockClientWithUser(), [
      mockParticipant({
        isLocalParticipant: true,
        sessionId: P_IDS.LOCAL_1,
        userId: P_IDS.LOCAL_1,
        publishedTracks: [SfuModels.TrackType.AUDIO],
        videoStream: null,
      }),
    ]);

    render(<CallParticipantsGridView />, {
      call,
    });

    expect(
      await screen.findByLabelText(A11yComponents.LOCAL_PARTICIPANT_FULLSCREEN),
    ).toBeDefined();
  });
});
