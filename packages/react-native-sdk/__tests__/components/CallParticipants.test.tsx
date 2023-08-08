import React from 'react';
import { mockClientWithUser } from '../mocks/client';
import { SfuModels } from '@stream-io/video-client';
import mockParticipant from '../mocks/participant';
import { ComponentTestIds } from '../../src/constants/TestIds';
import { mockCall } from '../mocks/call';
import { act, render, screen, within } from '../utils/RNTLTools';
import { CallContent } from '../../src/components';
import { ViewToken } from 'react-native';

console.warn = jest.fn();
jest.useFakeTimers();

enum P_IDS {
  LOCAL_1 = 'local-1',
  REMOTE_1 = 'remote-1',
  REMOTE_2 = 'remote-2',
  REMOTE_3 = 'remote-3',
}

const simulateOnViewableItemsChanged = async (
  viewableItems: Array<ViewToken>,
) => {
  const flatList = await screen.findByTestId(
    ComponentTestIds.CALL_PARTICIPANTS_LIST,
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

describe('CallParticipants', () => {
  it('should render an call participants with grid mode with 2 participants when no screen shared', async () => {
    const call = mockCall(mockClientWithUser(), [
      mockParticipant({
        isLocalParticipant: true,
        sessionId: P_IDS.LOCAL_1,
        userId: P_IDS.LOCAL_1,
      }),
      mockParticipant({
        publishedTracks: [SfuModels.TrackType.AUDIO],
        sessionId: P_IDS.REMOTE_1,
        userId: P_IDS.REMOTE_1,
      }),
    ]);

    render(<CallContent />, {
      call,
    });

    expect(
      await screen.findByTestId(ComponentTestIds.CALL_PARTICIPANTS_GRID),
    ).toBeVisible();

    // Locating and verifying that all ParticipantViews are rendered
    const localParticipant = within(
      screen.getByTestId(ComponentTestIds.LOCAL_PARTICIPANT),
    );
    const participant1 = within(
      screen.getByTestId(`participant-${P_IDS.REMOTE_1}`),
    );

    expect(
      localParticipant.getByTestId(ComponentTestIds.PARTICIPANT_MEDIA_STREAM),
    ).toHaveProp('streamURL', 'video-test-url');

    expect(
      participant1.getByTestId(ComponentTestIds.PARTICIPANT_MEDIA_STREAM),
    ).toHaveProp('streamURL', 'audio-test-url');

    // flat list should not be rendered for 2 participants as we should not wrap them in a grid
    expect(
      screen.queryByLabelText(ComponentTestIds.CALL_PARTICIPANTS_LIST),
    ).toBeNull();
  });
  it('should render call participants component with spotlight mode with 2 participants', async () => {
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

    render(<CallContent />, {
      call,
    });

    expect(
      await screen.findByTestId(ComponentTestIds.CALL_PARTICIPANTS_SPOTLIGHT),
    ).toBeVisible();

    // Since it has a screen share and thereby spotlight, we should render the flatlist even with 2 participants
    expect(
      await screen.findByTestId(ComponentTestIds.CALL_PARTICIPANTS_LIST),
    ).toBeVisible();
  });

  it('should render an active call with 4 participants. partic. 1 local partic., partic. 2 muted video, partic. 3 muted audio, partic. 4 muted audio', async () => {
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
      mockParticipant({
        publishedTracks: [SfuModels.TrackType.VIDEO],
        audioStream: null,
        sessionId: P_IDS.REMOTE_3,
        userId: P_IDS.REMOTE_3,
      }),
    ]);

    render(<CallContent />, {
      call,
    });

    const visibleParticipantsItems = call.state.participants.map((p) => ({
      key: p.sessionId,
      item: 'some-item',
      index: null,
      isViewable: true,
    }));

    await simulateOnViewableItemsChanged(visibleParticipantsItems);

    // Locating and verifying that all ParticipantViews are rendered
    const localParticipant = within(
      screen.getByTestId(`participant-${P_IDS.LOCAL_1}`),
    );
    const participant1 = within(
      screen.getByTestId(`participant-${P_IDS.REMOTE_1}`),
    );
    const participant2 = within(
      screen.getByTestId(`participant-${P_IDS.REMOTE_2}`),
    );

    const participant3 = within(
      screen.getByTestId(`participant-${P_IDS.REMOTE_3}`),
    );

    // Verifying that the local partic.'s video/audio are rendered within their respective participant
    expect(
      localParticipant.getByTestId(ComponentTestIds.PARTICIPANT_MEDIA_STREAM),
    ).toHaveProp('streamURL', 'video-test-url');
    expect(
      participant1.getByTestId(ComponentTestIds.PARTICIPANT_MEDIA_STREAM),
    ).toHaveProp('streamURL', 'audio-test-url');
    expect(
      participant2.getByTestId(ComponentTestIds.PARTICIPANT_MEDIA_STREAM),
    ).toHaveProp('streamURL', 'video-test-url');
    expect(
      participant3.getByTestId(ComponentTestIds.PARTICIPANT_MEDIA_STREAM),
    ).toHaveProp('streamURL', 'video-test-url');
    // Verifying no extra/unknown RTCViews are rendered
    expect(
      screen.getAllByTestId(ComponentTestIds.PARTICIPANT_MEDIA_STREAM),
    ).toHaveLength(4);
  });
});
