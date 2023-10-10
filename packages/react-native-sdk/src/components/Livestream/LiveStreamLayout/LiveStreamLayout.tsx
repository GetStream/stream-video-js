import React from 'react';
import { SfuModels, StreamVideoParticipant } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { usePaginatedLayoutSortPreset } from '../../../hooks/usePaginatedLayoutSortPreset';
import { useTheme } from '../../../contexts';
import {
  FloatingParticipantView as DefaultFloatingParticipantView,
  FloatingParticipantViewProps,
  VideoRenderer as DefaultVideoRenderer,
  VideoRendererProps,
} from '../../Participant';

export type LiveStreamLayoutProps = {
  /*
   * Check if device is in landscape mode.
   * This will apply the landscape mode styles to the component.
   */
  landscape?: boolean;
  /**
   * Component to customize the video component of the participant.
   */
  VideoRenderer?: React.ComponentType<VideoRendererProps> | null;
  /**
   * Component to customize the FloatingParticipantView when screen is shared.
   */
  FloatingParticipantView?: React.ComponentType<FloatingParticipantViewProps> | null;
};

const hasScreenShare = (p?: StreamVideoParticipant) =>
  p?.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE);

export const LiveStreamLayout = ({
  landscape,
  VideoRenderer = DefaultVideoRenderer,
  FloatingParticipantView = DefaultFloatingParticipantView,
}: LiveStreamLayoutProps) => {
  const { useParticipants, useHasOngoingScreenShare } = useCallStateHooks();
  const call = useCall();
  const {
    theme: { colors, livestreamLayout },
  } = useTheme();
  const [currentSpeaker, ...otherParticipants] = useParticipants();
  const hasOngoingScreenShare = useHasOngoingScreenShare();
  const presenter = hasOngoingScreenShare
    ? hasScreenShare(currentSpeaker) && currentSpeaker
    : otherParticipants.find(hasScreenShare);

  usePaginatedLayoutSortPreset(call);

  const landScapeStyles: ViewStyle = {
    flexDirection: landscape ? 'row' : 'column',
  };

  return (
    <View
      style={[
        styles.container,
        landScapeStyles,
        { backgroundColor: colors.dark_gray },
        livestreamLayout.container,
      ]}
    >
      {hasOngoingScreenShare && presenter && VideoRenderer && (
        <VideoRenderer trackType="screenShareTrack" participant={presenter} />
      )}
      {hasOngoingScreenShare
        ? FloatingParticipantView && (
            <FloatingParticipantView participant={currentSpeaker} />
          )
        : currentSpeaker &&
          VideoRenderer && (
            <VideoRenderer
              participant={currentSpeaker}
              trackType="videoTrack"
            />
          )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
