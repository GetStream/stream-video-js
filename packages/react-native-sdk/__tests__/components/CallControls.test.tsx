import React from 'react';
import { mockClientWithUser } from '../mocks/client';
import mockParticipant from '../mocks/participant';
import { ButtonTestIds, ComponentTestIds } from '../../src/constants/TestIds';
import { mockCall } from '../mocks/call';
import { fireEvent, render, screen, waitFor } from '../utils/RNTLTools';
import { CallControls } from '../../src/components';
import { OwnCapability } from '@stream-io/video-client';

console.warn = jest.fn();
jest.useFakeTimers();

enum P_IDS {
  LOCAL_1 = 'local-1',
}

describe('CallControls', () => {
  it('should render an unread badge indicator when the value is defined in the chatButton prop', async () => {
    const call = mockCall(mockClientWithUser(), [
      mockParticipant({
        isLocalParticipant: true,
        sessionId: P_IDS.LOCAL_1,
        userId: P_IDS.LOCAL_1,
      }),
    ]);

    render(
      <CallControls
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
      <CallControls
        chatButton={{ onPressHandler: jest.fn(), unreadBadgeCountIndicator: 0 }}
      />,
      {
        call,
      },
    );

    await waitFor(() =>
      expect(() =>
        screen.getByTestId(ComponentTestIds.CHAT_UNREAD_BADGE_COUNT_INDICATOR),
      ).toThrow(
        /Unable to find an element with testID: chat-unread-badge-count-indicator/i,
      ),
    );
  });

  it('render reaction button in call controls component', async () => {
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

    render(<CallControls />, {
      call,
    });

    const button = await screen.findByTestId(ButtonTestIds.REACTION);

    fireEvent.press(button);

    expect(screen.getByTestId(ComponentTestIds.REACTIONS_MODAL)).toBeVisible();
  });

  it('execute onPressHandler when its passed to hangup call button when its pressed in call controls component', async () => {
    const call = mockCall(mockClientWithUser(), [
      mockParticipant({
        isLocalParticipant: true,
        sessionId: P_IDS.LOCAL_1,
        userId: P_IDS.LOCAL_1,
      }),
    ]);

    const hangUpCallButton = { onPressHandler: jest.fn() };

    render(<CallControls hangUpCallButton={hangUpCallButton} />, {
      call,
    });

    const button = await screen.findByTestId(ButtonTestIds.HANG_UP_CALL);

    fireEvent.press(button);

    expect(hangUpCallButton.onPressHandler).toHaveBeenCalled();
  });

  it('execute call.leave when hangup button is pressed with no custom handler in call controls component', async () => {
    const call = mockCall(mockClientWithUser(), [
      mockParticipant({
        isLocalParticipant: true,
        sessionId: P_IDS.LOCAL_1,
        userId: P_IDS.LOCAL_1,
      }),
    ]);

    render(<CallControls />, {
      call,
    });

    const button = await screen.findByTestId(ButtonTestIds.HANG_UP_CALL);

    fireEvent.press(button);

    expect(call.leave).toHaveBeenCalled();
  });
});
