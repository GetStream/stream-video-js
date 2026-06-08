import React from 'react';
import { hasScreenShare, type VideoTrackType } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { usePaginatedLayoutSortPreset } from '../../../hooks/usePaginatedLayoutSortPreset';
import { useTheme } from '../../../contexts';
import {
  VideoRenderer as DefaultVideoRenderer,
  type VideoRendererProps,
} from '../../Participant';
import type { ScreenShareOverlayProps } from '../../utility/ScreenShareOverlay';
import { useTrackDimensions } from '../../../hooks';

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
  const participants = useParticipants();
  const [currentSpeaker] = participants;
  const hasOngoingScreenShare = useHasOngoingScreenShare();
  const presenter = hasOngoingScreenShare
    ? participants.find(hasScreenShare)
    : undefined;

  usePaginatedLayoutSortPreset(call);

  // objectFit is derived from the active track's dimensions during render.
  // A renderless child probe would set it via an effect and force an extra re-render.
  const activeTrackType: VideoTrackType = hasOngoingScreenShare
    ? 'screenShareTrack'
    : 'videoTrack';
  const activeParticipant = hasOngoingScreenShare ? presenter : currentSpeaker;
  const { width, height } = useTrackDimensions(
    activeParticipant,
    activeTrackType,
  );
  const objectFit: 'contain' | 'cover' = width > height ? 'contain' : 'cover';

  const landScapeStyles: ViewStyle = {
    flexDirection: landscape ? 'row' : 'column',
  };

  return (
    <View
      style={[
        styles.container,
        landScapeStyles,
        { backgroundColor: colors.sheetPrimary },
        livestreamLayout.container,
      ]}
    >
      {VideoRenderer &&
        hasOngoingScreenShare &&
        presenter &&
        (presenter.isLocalParticipant && ScreenShareOverlay ? (
          <ScreenShareOverlay />
        ) : (
          <VideoRenderer
            trackType="screenShareTrack"
            objectFit={objectFit}
            participant={presenter}
          />
        ))}
      {VideoRenderer && !hasOngoingScreenShare && currentSpeaker && (
        <VideoRenderer
          participant={currentSpeaker}
          objectFit={objectFit}
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
