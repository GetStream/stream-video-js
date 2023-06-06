import React from 'react';
import mockParticipant from '../mocks/participant';
import { ParticipantView } from '../../src/components/ParticipantView';
import { SfuModels } from '@stream-io/video-client';
import {
  A11yComponents,
  A11yIcons,
  A11yValues,
} from '../../src/constants/A11yLabels';
import { act, render, screen } from '../utils/RNTLTools';

console.warn = jest.fn();
jest.useFakeTimers();

describe('ParticipantView', () => {
  it('should render participant`s avatar when set to not visible, label, user name and reaction', async () => {
    const testParticipant = mockParticipant({
      image: undefined,
      publishedTracks: [],
      reaction: {
        type: 'reaction',
        emoji_code: ':fireworks:',
      },
    });
    render(
      <ParticipantView
        participant={testParticipant}
        kind={'video'}
        isVisible={false}
      />,
    );

    expect(
      await screen.findByLabelText(A11yComponents.PARTICIPANT_AVATAR),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText(A11yIcons.MUTED_VIDEO)).toBeOnTheScreen();
    expect(screen.getByText(testParticipant.userId)).toBeOnTheScreen();
    // reaction is visible and then disappears after 5500 ms
    expect(screen.getByText('🎉')).toBeOnTheScreen();
    await act(() => jest.advanceTimersByTime(5500));
    expect(() => screen.getByText('🎉')).toThrow(
      /unable to find an element with text: 🎉/i,
    );
  });

  it('should render participant`s screen when of screen kind', async () => {
    const testParticipant = mockParticipant({
      image: undefined,
      publishedTracks: [SfuModels.TrackType.SCREEN_SHARE],
      screenShareStream: {
        toURL: () => 'test-url',
      },
    });
    render(<ParticipantView participant={testParticipant} kind={'screen'} />);

    expect(
      await screen.findByLabelText(A11yComponents.PARTICIPANT_MEDIA_STREAM),
    ).toBeOnTheScreen();
    expect(
      screen.getByText(/123-456 is sharing their screen/i),
    ).toBeOnTheScreen();
    expect(
      await screen.findByLabelText(A11yIcons.SCREEN_SHARE),
    ).toBeOnTheScreen();
  });

  it('should render participant`s video and audio when of video kind and partic. speaks', async () => {
    const testParticipant = mockParticipant({
      image: undefined,
      publishedTracks: [SfuModels.TrackType.VIDEO, SfuModels.TrackType.AUDIO],
      isSpeaking: true,
    });
    render(<ParticipantView participant={testParticipant} kind={'video'} />);

    const [VideoRTCView, AudioRTCView] = await screen.findAllByLabelText(
      A11yComponents.PARTICIPANT_MEDIA_STREAM,
    );
    // Video and Audio streams are rendered
    // This is our best way to test if video and audio is on
    expect(VideoRTCView).toBeOnTheScreen();
    expect(VideoRTCView).toHaveProp('streamURL', 'video-test-url');
    expect(AudioRTCView).toBeOnTheScreen();
    expect(AudioRTCView).toHaveProp('streamURL', 'audio-test-url');

    // Participant is speaking style is applied
    expect(
      screen.getByAccessibilityValue({
        text: A11yValues.PARTICIPANTS_IS_SPEAKING,
      }),
    ).toBeOnTheScreen();
  });
});
