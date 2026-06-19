import React from 'react';
import { hasScreenShare } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { usePaginatedLayoutSortPreset } from '../../../hooks/usePaginatedLayoutSortPreset';
import { useTheme } from '../../../contexts';
import {
  VideoRenderer as DefaultVideoRenderer,
  type VideoRendererProps,
} from '../../Participant';
import type { ScreenShareOverlayProps } from '../../utility/ScreenShareOverlay';

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

  // objectFit is intentionally left unset: VideoRenderer already derives it from
  // its own track-dimensions subscription, so setting it here would only add
  // a layout re-render on every dimension change without changing the result.

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
