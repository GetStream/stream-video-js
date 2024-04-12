import React from 'react';
import { SfuModels, StreamVideoParticipant } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { usePaginatedLayoutSortPreset } from '../../../hooks/usePaginatedLayoutSortPreset';
import { useTheme } from '../../../contexts';
import {
  VideoRenderer as DefaultVideoRenderer,
  VideoRendererProps,
} from '../../Participant';
import { ScreenShareOverlayProps } from '../../utility/ScreenShareOverlay';

/**
 * Props for the LivestreamLayout component.
 */
export type LivestreamLayoutProps = {
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
   * Component to customize the ScreenShareOverlay.
   */
  ScreenShareOverlay?: React.ComponentType<ScreenShareOverlayProps> | null;
};

const hasScreenShare = (p?: StreamVideoParticipant) =>
  p?.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE);

/**
 * The LivestreamLayout component presents the live stream video layout.
 */
export const LivestreamLayout = ({
  landscape,
  VideoRenderer = DefaultVideoRenderer,
  ScreenShareOverlay,
}: LivestreamLayoutProps) => {
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
        { backgroundColor: colors.static_grey },
        livestreamLayout.container,
      ]}
    >
      {VideoRenderer &&
        hasOngoingScreenShare &&
        presenter &&
        (ScreenShareOverlay ? (
          <ScreenShareOverlay />
        ) : (
          <VideoRenderer trackType="screenShareTrack" participant={presenter} />
        ))}
      {VideoRenderer && !hasOngoingScreenShare && currentSpeaker && (
        <VideoRenderer participant={currentSpeaker} trackType="videoTrack" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
