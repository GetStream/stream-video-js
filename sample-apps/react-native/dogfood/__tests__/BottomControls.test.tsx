import React from 'react';
import { ScrollView } from 'react-native';
import { render } from '@testing-library/react-native';
import { BottomControls } from '../src/components/CallControls/BottomControls';

jest.mock(
  '@stream-io/video-react-native-sdk',
  () => ({
    useTheme: () => ({
      theme: { variants: { spacingSizes: { xs: 4, sm: 8, md: 16 } } },
    }),
    ScreenShareToggleButton: () => null,
    ToggleAudioPublishingButton: () => null,
    ToggleVideoPublishingButton: () => null,
  }),
  { virtual: true },
);
jest.mock('../src/components/CallControls/MoreActionsButton', () => ({
  MoreActionsButton: () => null,
}));
jest.mock(
  '../src/components/CallControls/BottomControls/ParticipantsButton',
  () => ({ ParticipantsButton: () => null }),
);
jest.mock('../src/components/CallControls/BottomControls/ChatButton', () => ({
  ChatButton: () => null,
}));
jest.mock(
  '../src/components/CallControls/BottomControls/RecordCallButton',
  () => ({ RecordCallButton: () => null }),
);
jest.mock(
  '../src/components/CallControls/BottomControls/SubtitleContainer',
  () => ({ SubtitleContainer: () => null }),
);

const renderControls = (landscape?: boolean) =>
  render(
    <BottomControls
      landscape={landscape}
      onChatOpenHandler={() => {}}
      onParticipantInfoPress={() => {}}
      toggleCallRecording={async () => {}}
      isAwaitingResponse={false}
      isCallRecordingInProgress={false}
    />,
  );

describe('BottomControls', () => {
  it('scrolls the stacked controls in landscape', () => {
    const { UNSAFE_queryByType } = renderControls(true);
    expect(UNSAFE_queryByType(ScrollView)).not.toBeNull();
  });

  it('keeps the plain row layout in portrait', () => {
    const { UNSAFE_queryByType } = renderControls();
    expect(UNSAFE_queryByType(ScrollView)).toBeNull();
  });
});
