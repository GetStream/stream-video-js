import React from 'react';
import { mockClientWithUser } from '../mocks/client';
import mockParticipant from '../mocks/participant';
import { A11yButtons, A11yComponents } from '../../src/constants/A11yLabels';
import { mockCall } from '../mocks/call';
import { fireEvent, render, screen } from '../utils/RNTLTools';
import { CallControlsView } from '../../src/components';
import { OwnCapability } from '@stream-io/video-client';

console.warn = jest.fn();
jest.useFakeTimers();

enum P_IDS {
  LOCAL_1 = 'local-1',
  REMOTE_1 = 'remote-1',
  REMOTE_2 = 'remote-2',
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
        chatButton={{ onPressHandler: () => {}, unreadBadgeCountIndicator: 1 }}
      />,
      {
        call,
      },
    );

    const indicator = await screen.findByLabelText(
      A11yComponents.CHAT_UNREAD_BADGE_COUNT_INDICATOR,
    );

    expect(indicator).toBeDefined();
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
        chatButton={{ onPressHandler: () => {}, unreadBadgeCountIndicator: 0 }}
      />,
      {
        call,
      },
    );

    const indicator = screen.queryAllByLabelText(
      A11yComponents.CHAT_UNREAD_BADGE_COUNT_INDICATOR,
    );

    expect(indicator.length).toBe(0);
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

    const button = await screen.findByLabelText(A11yButtons.REACTION_BUTTON);

    expect(button).toBeDefined();

    fireEvent.press(button);

    const reactionsModal = await screen.findAllByLabelText(
      A11yComponents.REACTIONS_MODAL,
    );

    expect(reactionsModal).toBeDefined();
  });

  it('terminate call when hangup call button is pressed in call controls view', async () => {
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

    expect(button).toBeDefined();

    fireEvent.press(button);
  });
});
