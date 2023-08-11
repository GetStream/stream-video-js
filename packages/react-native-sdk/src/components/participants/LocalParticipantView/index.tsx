import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import {
  useCameraState,
  useCallStateHooks,
} from '@stream-io/video-react-bindings';
import { SfuModels } from '@stream-io/video-client';
import { LOCAL_VIDEO_VIEW_STYLE, Z_INDEX } from '../../../constants';
import { ComponentTestIds } from '../../../constants/TestIds';
import { VideoSlash } from '../../../icons';
import { theme } from '../../../theme';
import { useDebouncedValue } from '../../../utils/hooks';
import { Avatar } from '../../utility';
import { VideoRenderer } from '../../utility/internal/VideoRenderer';
import { ParticipantReaction } from '../internal/ParticipantReaction';
import { FloatingViewAlignment } from './FloatingView/common';
import FloatingView from './FloatingView';

/**
 * Props to be passed for the LocalVideoView component.
 */
export interface LocalParticipantViewProps {
  /**
   * An optional style object to be applied to the local video view
   * @defaultValue
   * The default is `{
   *     position: 'absolute',
   *     height: 140,
   *     width: 80,
   *     right: 2 * theme.spacing.lg,
   *     top: 100,
   *     borderRadius: theme.rounded.sm,
   *     zIndex: 1,
   *   }`
   */
  style?: StyleProp<ViewStyle>;

  /**
   * The layout of the local video view controls weather the local participant's video will be rendered in full screen or floating
   * @defaultValue 'floating'
   */
  layout?: 'floating' | 'fullscreen';
}

/**
 * A component to render the local participant's video.
 */
export const LocalParticipantView = (props: LocalParticipantViewProps) => {
  const { layout = 'floating' } = props;
  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const { direction } = useCameraState();
  const isCameraOnFrontFacingMode = direction === 'front';
  // it takes a few milliseconds for the camera stream to actually switch
  const debouncedCameraOnFrontFacingMode = useDebouncedValue(
    isCameraOnFrontFacingMode,
    300,
  );
  const [containerDimensions, setContainerDimensions] = React.useState<{
    width: number;
    height: number;
  }>();

  if (!localParticipant) {
    return null;
  }

  const isVideoMuted = !localParticipant.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );

  // when camera is switching show a blank stream
  // otherwise the camera stream will be shown in wrong mirror state for a few milliseconds
  const showBlankStream =
    isCameraOnFrontFacingMode !== debouncedCameraOnFrontFacingMode;

  if (layout === 'fullscreen') {
    return (
      <View
        testID={ComponentTestIds.LOCAL_PARTICIPANT_FULLSCREEN}
        style={styles.fullScreenContainer}
      >
        <View style={styles.topView}>
          <ParticipantReaction
            reaction={localParticipant.reaction}
            sessionId={localParticipant.sessionId}
          />
        </View>
        {isVideoMuted ? (
          <Avatar participant={localParticipant} />
        ) : showBlankStream ? (
          <View style={styles.videoStreamFullScreen} />
        ) : (
          <VideoRenderer
            mirror={debouncedCameraOnFrontFacingMode}
            mediaStream={localParticipant.videoStream}
            style={styles.videoStreamFullScreen}
          />
        )}
      </View>
    );
  }

  return (
    <View
      testID={ComponentTestIds.LOCAL_PARTICIPANT}
      style={styles.floatingContainer}
      // "box-none" disallows the container view to be not take up touches
      // and allows only the floating view (its child view) to take up the touches
      pointerEvents="box-none"
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setContainerDimensions((prev) => {
          if (prev && prev.width === width && prev.height === height) {
            return prev;
          }
          return {
            width: width,
            height: height,
          };
        });
      }}
    >
      {containerDimensions && (
        <FloatingView
          containerHeight={containerDimensions.height}
          containerWidth={containerDimensions.width}
          initialAlignment={FloatingViewAlignment.topRight}
        >
          <View style={styles.floatingViewContainer}>
            <View style={styles.topView}>
              <ParticipantReaction
                reaction={localParticipant.reaction}
                sessionId={localParticipant.sessionId}
              />
            </View>
            {isVideoMuted ? (
              <View style={theme.icon.md}>
                <VideoSlash color={theme.light.static_white} />
              </View>
            ) : showBlankStream ? (
              <View style={styles.videoStream} />
            ) : (
              <VideoRenderer
                mirror={debouncedCameraOnFrontFacingMode}
                mediaStream={localParticipant.videoStream}
                style={styles.videoStream}
                // zOrder should higher than the zOrder used in the ParticipantView
                zOrder={Z_INDEX.IN_MIDDLE}
              />
            )}
          </View>
        </FloatingView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  floatingViewContainer: {
    height: LOCAL_VIDEO_VIEW_STYLE.height,
    width: LOCAL_VIDEO_VIEW_STYLE.width,
    borderRadius: LOCAL_VIDEO_VIEW_STYLE.borderRadius,
    backgroundColor: theme.light.static_grey,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  videoStream: {
    height: LOCAL_VIDEO_VIEW_STYLE.height,
    width: LOCAL_VIDEO_VIEW_STYLE.width,
  },
  videoStreamFullScreen: {
    ...StyleSheet.absoluteFillObject,
  },
  topView: {
    position: 'absolute',
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    zIndex: Z_INDEX.IN_FRONT,
  },
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.light.disabled,
  },
  avatarContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingContainer: {
    ...StyleSheet.absoluteFillObject,
    margin: theme.padding.md,
    // Needed to make the view on top and draggable
    zIndex: Z_INDEX.IN_MIDDLE,
  },
});
