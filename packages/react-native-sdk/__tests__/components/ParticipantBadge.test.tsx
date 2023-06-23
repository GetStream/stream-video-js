import React from 'react';
import { mockClientWithUser } from '../mocks/client';
import { SfuModels } from '@stream-io/video-client';
import mockParticipant from '../mocks/participant';
import { A11yButtons, A11yComponents } from '../../src/constants/A11yLabels';
import { mockCall } from '../mocks/call';
import { fireEvent, render, screen } from '../utils/RNTLTools';
import { CallParticipantsBadge } from '../../src/components';

console.warn = jest.fn();
jest.useFakeTimers();

enum P_IDS {
  LOCAL_1 = 'local-1',
  REMOTE_1 = 'remote-1',
  REMOTE_2 = 'remote-2',
}

describe('CallParticipantsBadge', () => {
  it('should render call participants badge component with 1 partic. when the user is alone in the call', async () => {
    const call = mockCall(mockClientWithUser(), [
      mockParticipant({ isLocalParticipant: true }),
    ]);
    render(<CallParticipantsBadge />, {
      call,
    });

    expect(
      await screen.findByLabelText(A11yButtons.PARTICIPANTS_INFO),
    ).toHaveTextContent('1');
  });

  it('should render call participants info view component when the badge is pressed', async () => {
    const call = mockCall(mockClientWithUser(), [
      mockParticipant({ isLocalParticipant: true }),
    ]);

    render(<CallParticipantsBadge />, {
      call,
    });

    const badge = await screen.findByLabelText(A11yButtons.PARTICIPANTS_INFO);
    expect(badge).toHaveTextContent('1');

    fireEvent.press(badge);
    expect(
      await screen.findByLabelText(A11yComponents.PARTICIPANTS_INFO_VIEW),
    ).toBeDefined();
  });

  it('should render an call participants badge component with 3 participants', async () => {
    const call = mockCall(mockClientWithUser(), [
      mockParticipant({
        isLocalParticipant: true,
        sessionId: P_IDS.LOCAL_1,
        userId: P_IDS.LOCAL_1,
      }),
      mockParticipant({
        publishedTracks: [SfuModels.TrackType.AUDIO],
        videoStream: null,
        sessionId: P_IDS.REMOTE_1,
        userId: P_IDS.REMOTE_1,
      }),
      mockParticipant({
        publishedTracks: [SfuModels.TrackType.VIDEO],
        audioStream: null,
        sessionId: P_IDS.REMOTE_2,
        userId: P_IDS.REMOTE_2,
      }),
    ]);

    render(<CallParticipantsBadge />, {
      call,
    });

    expect(
      await screen.findByLabelText(A11yButtons.PARTICIPANTS_INFO),
    ).toHaveTextContent('3');
  });
});
