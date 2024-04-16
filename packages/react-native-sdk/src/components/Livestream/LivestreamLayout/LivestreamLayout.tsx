import React, { useCallback, useEffect, useState } from 'react';
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
import { VideoDimension } from '@stream-io/video-client/dist/src/gen/video/sfu/models/models';

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

  const [objectFit, setObjectFit] =
    useState<
      React.ComponentProps<NonNullable<typeof VideoRenderer>>['objectFit']
    >();

  // no need to pass object fit for local participant as the dimensions are for remote tracks
  const objectFitToBeSet = currentSpeaker?.isLocalParticipant
    ? undefined
    : objectFit;

  const onDimensionsChange = useCallback((d: VideoDimension | undefined) => {
    if (d) {
      const isWidthWide = d.width > d.height;
      setObjectFit(isWidthWide ? 'contain' : 'cover');
    }
  }, []);

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
      <RemoteVideoTrackDimensionsRenderLessComponent
        onDimensionsChange={onDimensionsChange}
      />
      {VideoRenderer &&
        hasOngoingScreenShare &&
        presenter &&
        (ScreenShareOverlay ? (
          <ScreenShareOverlay />
        ) : (
          <VideoRenderer trackType="screenShareTrack" participant={presenter} />
        ))}
      {VideoRenderer && !hasOngoingScreenShare && currentSpeaker && (
        <VideoRenderer
          participant={currentSpeaker}
          objectFit={objectFitToBeSet}
          trackType="videoTrack"
        />
      )}
    </View>
  );
};

const RemoteVideoTrackDimensionsRenderLessComponent = ({
  onDimensionsChange,
}: {
  onDimensionsChange: (d: VideoDimension | undefined) => void;
}) => {
  const [dimension, setDimension] = useState<VideoDimension>();
  const { useCallStatsReport } = useCallStateHooks();
  const statsReport = useCallStatsReport();
  const highestFrameHeight = statsReport?.subscriberStats?.highestFrameHeight;
  const highestFrameWidth = statsReport?.subscriberStats?.highestFrameWidth;

  useEffect(() => {
    if (highestFrameHeight && highestFrameWidth) {
      setDimension({ height: highestFrameHeight, width: highestFrameWidth });
    }
  }, [highestFrameHeight, highestFrameWidth]);

  useEffect(() => {
    onDimensionsChange(dimension);
  }, [dimension, onDimensionsChange]);

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
