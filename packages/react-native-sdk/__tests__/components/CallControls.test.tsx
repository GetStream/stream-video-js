import React from 'react';
import { mockClientWithUser } from '../mocks/client';
import mockParticipant from '../mocks/participant';
import { ButtonTestIds, ComponentTestIds } from '../../src/constants/TestIds';
import { mockCall } from '../mocks/call';
import { fireEvent, render, screen } from '../utils/RNTLTools';
import { OwnCapability } from '@stream-io/video-client';
import { defaultEmojiReactions } from '../../src/constants';
import { CallControls } from '../../src';
import { HangUpCallButton } from '../../src/components/Call/CallControls/HangupCallButton';
import { ReactionsButton } from '../../src/components/Call/CallControls/ReactionsButton';

console.warn = jest.fn();
jest.useFakeTimers();

enum P_IDS {
  LOCAL_1 = 'local-1',
}

describe('ReactionsButton', () => {
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
      [OwnCapability.CREATE_REACTION]
    );

    render(<ReactionsButton reactions={defaultEmojiReactions} />, {
      call,
    });

    const button = await screen.findByTestId(ButtonTestIds.REACTION);

    fireEvent.press(button);

    expect(screen.getByTestId(ComponentTestIds.REACTIONS_PICKER)).toBeVisible();
  });
});

describe('HangupCallButton', () => {
  it('execute onPressHandler when its passed to hangup call button when its pressed in call controls component', async () => {
    const call = mockCall(mockClientWithUser(), [
      mockParticipant({
        isLocalParticipant: true,
        sessionId: P_IDS.LOCAL_1,
        userId: P_IDS.LOCAL_1,
      }),
    ]);

    const onHangupCallHandler = jest.fn();

    render(<HangUpCallButton onPressHandler={onHangupCallHandler} />, {
      call,
    });

    const button = await screen.findByTestId(ButtonTestIds.HANG_UP_CALL);

    fireEvent.press(button);

    expect(onHangupCallHandler).toHaveBeenCalled();
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
