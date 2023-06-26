import React from 'react';
import { mockClientWithUser } from '../mocks/client';
import mockParticipant from '../mocks/participant';
import { A11yComponents } from '../../src/constants/A11yLabels';
import { mockCall } from '../mocks/call';
import { render, screen } from '../utils/RNTLTools';
import { CallControlsView } from '../../src/components';

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

    const indicator = await screen.queryAllByLabelText(
      A11yComponents.CHAT_UNREAD_BADGE_COUNT_INDICATOR,
    );

    expect(indicator.length).toBe(0);
  });
});
