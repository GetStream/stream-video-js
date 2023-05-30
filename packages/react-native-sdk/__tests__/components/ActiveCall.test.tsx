import React, { ReactNode } from 'react';
import { CallCycleLogicsWrapper, StreamVideo } from '../../src/providers';
import { mockClientWithUser } from '../mocks/client';
import { act, render, screen, within } from '@testing-library/react-native';
import { ActiveCall } from '../../src/components';
import { StreamCallProvider } from '@stream-io/video-react-bindings';
import {
  Call,
  OwnCapability,
  SfuModels,
  StreamVideoClient,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import mockParticipant from '../mocks/participant';
import {
  A11yButtons,
  A11yComponents,
  A11yIcons,
} from '../../src/constants/A11yLabels';

console.warn = jest.fn();

const mockCall = (
  client: StreamVideoClient,
  participants?: StreamVideoParticipant[],
) => {
  const call = client?.call('default', 'test-123');
  const _participants = participants || [mockParticipant()];
  call.state.setParticipantCount(_participants.length);
  call.state.setParticipants(_participants);
  call?.permissionsContext.setPermissions([
    OwnCapability.SEND_AUDIO,
    OwnCapability.SEND_VIDEO,
  ]);
  return call;
};
const Wrapper: ({
  children,
  call,
}: {
  children: ReactNode;
  call?: Call;
}) => JSX.Element = ({ children, call }) => {
  const testClient = mockClientWithUser({ id: 'test-user-id' });
  const testCall = call || mockCall(testClient);
  return (
    <StreamVideo client={testClient} language={'en'}>
      <StreamCallProvider call={testCall}>
        <CallCycleLogicsWrapper callCycleHandlers={{}}>
          {children}
        </CallCycleLogicsWrapper>
      </StreamCallProvider>
    </StreamVideo>
  );
};
describe('ActiveCall', () => {
  it('should render an active call with 1 partic. when the user is alone in the call', async () => {
    const call = mockCall(mockClientWithUser(), [
      mockParticipant({ isLoggedInUser: true }),
    ]);
    render(<ActiveCall />, {
      wrapper: (props) => <Wrapper {...props} call={call} />,
    });
    expect(
      await screen.findByLabelText(A11yButtons.PARTICIPANTS_INFO),
    ).toHaveTextContent('1');
    expect(
      await screen.findByLabelText(A11yComponents.PARTICIPANT_MEDIA_STREAM),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText(A11yIcons.HANG_UP_CALL)).toBeOnTheScreen();
  });

  it('should render an active call with 3 partic. local partic., partic. 2 muted video, partic. 3 muted audio', async () => {
    enum P_IDS {
      LOCAL_1 = 'local-1',
      REMOTE_1 = 'remote-1',
      REMOTE_2 = 'remote-2',
    }
    const call = mockCall(mockClientWithUser(), [
      mockParticipant({
        isLoggedInUser: true,
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
      wrapper: (props) => <Wrapper {...props} call={call} />,
    });

    const flatList = await screen.findByLabelText(
      A11yComponents.CALL_PARTICIPANTS_LIST,
    );
    await act(() =>
      flatList.props.onViewableItemsChanged({
        viewableItems: call.state.participants.map((p) => ({
          key: p.sessionId,
        })),
      }),
    );

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
    // Veryifying no extra/unknown RTCViews are rendered
    expect(
      screen.getAllByLabelText(A11yComponents.PARTICIPANT_MEDIA_STREAM),
    ).toHaveLength(3);
  });
});
