import React from 'react';
import mockParticipant from '../mocks/participant';
import { SfuModels } from '@stream-io/video-client';
import { ComponentTestIds, IconTestIds } from '../../src/constants/TestIds';
import { render, screen } from '../utils/RNTLTools';
import {
  ParticipantLabel,
  ParticipantNetworkQualityIndicator,
  ParticipantReaction,
  ParticipantVideoFallback,
  ParticipantView,
  VideoRenderer,
} from '../../src/components';
import { defaultEmojiReactions } from '../../src/constants';

console.warn = jest.fn();
jest.useFakeTimers();

describe('ParticipantView', () => {
  it('should render participant`s avatar when set to not visible, label, user name and reaction', async () => {
    const testParticipant = mockParticipant({
      image: 'https://picsum.photos/200/300',
      publishedTracks: [],
      reaction: {
        type: 'reaction',
        emoji_code: ':fireworks:',
      },
    });
    render(
      <ParticipantView
        reactions={defaultEmojiReactions}
        participant={testParticipant}
        trackType="videoTrack"
        isVisible={false}
        ParticipantLabel={ParticipantLabel}
        ParticipantReaction={ParticipantReaction}
        ParticipantNetworkQualityIndicator={ParticipantNetworkQualityIndicator}
        ParticipantVideoFallback={ParticipantVideoFallback}
        VideoRenderer={VideoRenderer}
      />,
    );

    expect(
      await screen.findByTestId(ComponentTestIds.PARTICIPANT_AVATAR),
    ).toBeOnTheScreen();
    expect(screen.getByTestId(IconTestIds.MUTED_VIDEO)).toBeOnTheScreen();
    expect(screen.getByText(testParticipant.name)).toBeOnTheScreen();
    // reaction is visible and then disappears after 5500 ms
    expect(screen.getByText('🎉')).toBeOnTheScreen();
  });

  it('should render participant`s screen when of screen mode', async () => {
    const testParticipant = mockParticipant({
      image: undefined,
      publishedTracks: [SfuModels.TrackType.SCREEN_SHARE],
      screenShareStream: {
        // @ts-expect-error due to dom event type not being compatible with RN
        toURL: () => 'test-url',
      },
    });
    render(
      <ParticipantView
        participant={testParticipant}
        trackType="screenShareTrack"
        ParticipantLabel={ParticipantLabel}
        ParticipantReaction={ParticipantReaction}
        ParticipantNetworkQualityIndicator={ParticipantNetworkQualityIndicator}
        ParticipantVideoFallback={ParticipantVideoFallback}
        VideoRenderer={VideoRenderer}
      />,
    );

    expect(
      await screen.findByTestId(ComponentTestIds.PARTICIPANT_MEDIA_STREAM),
    ).toBeOnTheScreen();
    expect(
      screen.getByText(/Testy van der Test is sharing their screen/i),
    ).toBeOnTheScreen();
    expect(
      await screen.findByTestId(IconTestIds.SCREEN_SHARE_INDICATOR),
    ).toBeOnTheScreen();
  });

  it('should render participant`s video and audio when of video mode and partic. speaks', async () => {
    const testParticipant = mockParticipant({
      image: undefined,
      publishedTracks: [SfuModels.TrackType.VIDEO, SfuModels.TrackType.AUDIO],
      isSpeaking: true,
    });
    render(
      <ParticipantView
        participant={testParticipant}
        trackType="videoTrack"
        ParticipantLabel={ParticipantLabel}
        ParticipantReaction={ParticipantReaction}
        ParticipantNetworkQualityIndicator={ParticipantNetworkQualityIndicator}
        ParticipantVideoFallback={ParticipantVideoFallback}
        VideoRenderer={VideoRenderer}
      />,
    );

    const [VideoRTCView] = await screen.findAllByTestId(
      ComponentTestIds.PARTICIPANT_MEDIA_STREAM,
    );
    // Video and Audio streams are rendered
    // This is our best way to test if video and audio is on
    expect(VideoRTCView).toBeOnTheScreen();
    expect(VideoRTCView).toHaveProp('streamURL', 'video-test-url');

    // Participant is speaking style is applied
    expect(
      screen.getByTestId(`participant-${testParticipant.userId}-is-speaking`),
    ).toBeOnTheScreen();
  });
});
