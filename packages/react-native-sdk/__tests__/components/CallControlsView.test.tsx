import React from 'react';
import { mockClientWithUser } from '../mocks/client';
import mockParticipant from '../mocks/participant';
import { A11yButtons, A11yComponents } from '../../src/constants/A11yLabels';
import { mockCall } from '../mocks/call';
import { fireEvent, render, screen, waitFor } from '../utils/RNTLTools';
import { CallControlsView } from '../../src/components';
import { OwnCapability } from '@stream-io/video-client';

console.warn = jest.fn();
jest.useFakeTimers();

enum P_IDS {
  LOCAL_1 = 'local-1',
}

describe('CallControlsView', () => {
  it('should render an unread badge indicator when the value is defined in the chatButton prop', async () => {
    const call = mockCall(mockClientWithUser(), [
      mockParticipant({
        isLocalParticipant: true,
        sessionId: P_IDS.LOCAL_1,
        userId: P_IDS.LOCAL_1,
      }),
    ]);

    render(
      <CallControlsView
        chatButton={{ onPressHandler: jest.fn(), unreadBadgeCountIndicator: 1 }}
      />,
      {
        call,
      },
    );

    const indicator = await screen.findByText('1');

    expect(indicator).toBeVisible();
  });

  it('should not render an unread badge indicator when the value is 0 in the chatButton prop', async () => {
    const call = mockCall(mockClientWithUser(), [
      mockParticipant({
        isLocalParticipant: true,
        sessionId: P_IDS.LOCAL_1,
        userId: P_IDS.LOCAL_1,
      }),
    ]);

    render(
      <CallControlsView
        chatButton={{ onPressHandler: jest.fn(), unreadBadgeCountIndicator: 0 }}
      />,
      {
        call,
      },
    );

    await waitFor(() =>
      expect(() =>
        screen.getByLabelText(A11yComponents.CHAT_UNREAD_BADGE_COUNT_INDICATOR),
      ).toThrow(
        /Unable to find an element with accessibilityLabel: chat-unread-badge-count-indicator/i,
      ),
    );
  });

  it('render reaction button in call controls view', async () => {
    const call = mockCall(
      mockClientWithUser(),
      [
        mockParticipant({
          isLocalParticipant: true,
          sessionId: P_IDS.LOCAL_1,
          userId: P_IDS.LOCAL_1,
        }),
      ],
      [OwnCapability.CREATE_REACTION],
    );

    render(<CallControlsView />, {
      call,
    });

    const button = await screen.findByLabelText(A11yButtons.REACTION);

    fireEvent.press(button);

    expect(screen.getByLabelText(A11yComponents.REACTIONS_MODAL)).toBeVisible();
  });

  it('execute onPressHandler when its passed to hangup call button when its pressed in call controls view', async () => {
    const call = mockCall(mockClientWithUser(), [
      mockParticipant({
        isLocalParticipant: true,
        sessionId: P_IDS.LOCAL_1,
        userId: P_IDS.LOCAL_1,
      }),
    ]);

    const hangUpCallButton = { onPressHandler: jest.fn() };

    render(<CallControlsView hangUpCallButton={hangUpCallButton} />, {
      call,
    });

    const button = await screen.findByLabelText(A11yButtons.HANG_UP_CALL);

    fireEvent.press(button);

    expect(hangUpCallButton.onPressHandler).toHaveBeenCalled();
  });

  it('execute call.leave when hangup button is pressed with no custom handler in call controls view', async () => {
    const call = mockCall(mockClientWithUser(), [
      mockParticipant({
        isLocalParticipant: true,
        sessionId: P_IDS.LOCAL_1,
        userId: P_IDS.LOCAL_1,
      }),
    ]);

    render(<CallControlsView />, {
      call,
    });

    const button = await screen.findByLabelText(A11yButtons.HANG_UP_CALL);

    fireEvent.press(button);

    expect(call.leave).toHaveBeenCalled();
  });
});
