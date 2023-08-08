import React, { useRef } from 'react';
import {
  Animated,
  PanResponder,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { VideoRenderer } from '../utility/internal/VideoRenderer';
import { useLocalParticipant } from '@stream-io/video-react-bindings';
import { SfuModels } from '@stream-io/video-client';
import { theme } from '../../theme';
import { VideoSlash } from '../../icons';
import { ComponentTestIds } from '../../constants/TestIds';
import { Avatar } from '../utility/Avatar';
import { LOCAL_VIDEO_VIEW_STYLE, Z_INDEX } from '../../constants';
import { useDebouncedValue } from '../../utils/hooks';
import { useMediaStreamManagement } from '../../providers/MediaStreamManagement';
import { ParticipantReaction } from './internal/ParticipantReaction';

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
  const containerStyle =
    layout === 'floating'
      ? styles.floatingContainer
      : styles.fullScreenContainer;
  const { style = containerStyle } = props;
  const localParticipant = useLocalParticipant();
  const { isCameraOnFrontFacingMode } = useMediaStreamManagement();
  // it takes a few milliseconds for the camera stream to actually switch
  const debouncedCameraOnFrontFacingMode = useDebouncedValue(
    isCameraOnFrontFacingMode,
    300,
  );
  const pan = useRef(new Animated.ValueXY()).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        pan.extractOffset();
      },
    }),
  ).current;

  if (!localParticipant) {
    return null;
  }

  const isVideoMuted = !localParticipant.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );

  // when camera is switching show a blank stream
  //otherwise the camera stream will be shown in wrong mirror state for a few milliseconds
  const showBlankStream =
    isCameraOnFrontFacingMode !== debouncedCameraOnFrontFacingMode;

  if (layout === 'fullscreen') {
    return (
      <View
        testID={ComponentTestIds.LOCAL_PARTICIPANT_FULLSCREEN}
        style={style}
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
    <Animated.View
      testID={ComponentTestIds.LOCAL_PARTICIPANT}
      style={{
        // Needed to make the view is on top and draggable
        zIndex: Z_INDEX.IN_MIDDLE,
        transform: [{ translateX: pan.x }, { translateY: pan.y }],
      }}
      {...panResponder.panHandlers}
    >
      <View style={style}>
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
          />
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    height: LOCAL_VIDEO_VIEW_STYLE.height,
    width: LOCAL_VIDEO_VIEW_STYLE.width,
    right: theme.spacing.lg * 2,
    top: theme.margin.xl * 2,
    borderRadius: LOCAL_VIDEO_VIEW_STYLE.borderRadius,
    zIndex: Z_INDEX.IN_MIDDLE,
    backgroundColor: theme.light.static_grey,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  videoStream: {
    height: LOCAL_VIDEO_VIEW_STYLE.height,
    width: LOCAL_VIDEO_VIEW_STYLE.width,
    flex: 1,
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
});
