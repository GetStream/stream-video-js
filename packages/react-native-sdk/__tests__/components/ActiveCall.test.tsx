import React from 'react';
import { mockClientWithUser } from '../mocks/client';
import { ActiveCall } from '../../src/components';
import { SfuModels } from '@stream-io/video-client';
import mockParticipant from '../mocks/participant';
import {
  A11yButtons,
  A11yComponents,
  A11yIcons,
} from '../../src/constants/A11yLabels';
import { ViewToken } from 'react-native';
import { mockCall } from '../mocks/call';
import { act, render, screen, within } from '../utils/RNTLTools';

console.warn = jest.fn();
jest.useFakeTimers();

enum P_IDS {
  LOCAL_1 = 'local-1',
  REMOTE_1 = 'remote-1',
  REMOTE_2 = 'remote-2',
}
const simulateOnViewableItemsChanged = async (
  viewableItems: Array<ViewToken>,
) => {
  const flatList = await screen.findByLabelText(
    A11yComponents.CALL_PARTICIPANTS_LIST,
  );
  await act(() => {
    flatList.props.onViewableItemsChanged({
      viewableItems,
    });
    // Advance pending timers to allow the FlatList to rerender
    // This is needed because of useDebouncedValue we use in
    // forceUpdateValue to force rerender the FlatList
    jest.advanceTimersByTime(500);
  });
};
describe('ActiveCall', () => {
  it('should render an active call with 1 partic. when the user is alone in the call', async () => {
    const call = mockCall(mockClientWithUser(), [
      mockParticipant({ isLocalParticipant: true }),
    ]);
    render(<ActiveCall />, {
      call,
    });

    expect(
      await screen.findByLabelText(A11yButtons.PARTICIPANTS_INFO),
    ).toHaveTextContent('1');
    expect(
      screen.getByLabelText(A11yComponents.PARTICIPANT_MEDIA_STREAM),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText(A11yIcons.HANG_UP_CALL)).toBeOnTheScreen();
  });

  it('should render an active call with 3 partic. local partic., partic. 2 muted video, partic. 3 muted audio', async () => {
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
    render(<ActiveCall />, {
      call,
    });

    const visibleParticipantsItems = call.state.participants.map((p) => ({
      key: p.sessionId,
      item: 'some-item',
      index: null,
      isViewable: true,
    }));

    await simulateOnViewableItemsChanged(visibleParticipantsItems);

    expect(
      await screen.findByLabelText(A11yButtons.PARTICIPANTS_INFO),
    ).toHaveTextContent('3');

    // Locating and verifying that all ParticipantViews are rendered
    const localParticipant = within(
      screen.getByLabelText(A11yComponents.LOCAL_PARTICIPANT),
    );
    const participant1 = within(
      screen.getByLabelText(`participant-${P_IDS.REMOTE_1}`),
    );
    const participant2 = within(
      screen.getByLabelText(`participant-${P_IDS.REMOTE_2}`),
    );

    // Verifying that the local partic.'s video/audio are rendered within their respective participant
    expect(
      localParticipant.getByLabelText(A11yComponents.PARTICIPANT_MEDIA_STREAM),
    ).toHaveProp('streamURL', 'video-test-url');
    expect(
      participant1.getByLabelText(A11yComponents.PARTICIPANT_MEDIA_STREAM),
    ).toHaveProp('streamURL', 'audio-test-url');
    expect(
      participant2.getByLabelText(A11yComponents.PARTICIPANT_MEDIA_STREAM),
    ).toHaveProp('streamURL', 'video-test-url');
    // Verifying no extra/unknown RTCViews are rendered
    expect(
      screen.getAllByLabelText(A11yComponents.PARTICIPANT_MEDIA_STREAM),
    ).toHaveLength(3);
  });
});
