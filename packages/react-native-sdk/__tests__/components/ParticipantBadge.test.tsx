import React from 'react';
import { mockClientWithUser } from '../mocks/client';
import { SfuModels } from '@stream-io/video-client';
import mockParticipant from '../mocks/participant';
import { ButtonTestIds, ComponentTestIds } from '../../src/constants/TestIds';
import { mockCall } from '../mocks/call';
import { fireEvent, render, screen } from '../utils/RNTLTools';
import { ParticipantsInfoBadge } from '../../src/components';

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
    render(<ParticipantsInfoBadge />, {
      call,
    });

    expect(
      await screen.findByTestId(ButtonTestIds.PARTICIPANTS_INFO),
    ).toHaveTextContent('1');
  });

  it('should render call participants info component when the badge is pressed', async () => {
    const call = mockCall(mockClientWithUser(), [
      mockParticipant({ isLocalParticipant: true }),
    ]);

    render(<ParticipantsInfoBadge />, {
      call,
    });

    const badge = await screen.findByTestId(ButtonTestIds.PARTICIPANTS_INFO);
    expect(badge).toHaveTextContent('1');

    fireEvent.press(badge);
    expect(
      await screen.findByTestId(ComponentTestIds.PARTICIPANTS_INFO),
    ).toBeVisible();
  });

  it('should render a call participants badge component with 3 participants', async () => {
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

    render(<ParticipantsInfoBadge />, {
      call,
    });

    expect(
      await screen.findByTestId(ButtonTestIds.PARTICIPANTS_INFO),
    ).toHaveTextContent('3');
  });
});
