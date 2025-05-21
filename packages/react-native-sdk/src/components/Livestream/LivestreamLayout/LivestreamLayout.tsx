import React, { useCallback, useEffect, useState } from 'react';
import { hasScreenShare, SfuModels } from '@stream-io/video-client';
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

  const [objectFit, setObjectFit] =
    useState<
      React.ComponentProps<NonNullable<typeof VideoRenderer>>['objectFit']
    >();

  // no need to pass object fit for local participant as the dimensions are for remote tracks
  const objectFitToBeSet = currentSpeaker?.isLocalParticipant
    ? undefined
    : objectFit;

  const onDimensionsChange = useCallback(
    (d: SfuModels.VideoDimension | undefined) => {
      if (d) {
        const isWidthWide = d.width > d.height;
        setObjectFit(isWidthWide ? 'contain' : 'cover');
      }
    },
    [],
  );

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
      <RemoteVideoTrackDimensionsRenderLessComponent
        onDimensionsChange={onDimensionsChange}
      />
      {VideoRenderer &&
        hasOngoingScreenShare &&
        presenter &&
        (presenter.isLocalParticipant && ScreenShareOverlay ? (
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
  onDimensionsChange: (d: SfuModels.VideoDimension | undefined) => void;
}) => {
  const [dimension, setDimension] = useState<SfuModels.VideoDimension>();
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
