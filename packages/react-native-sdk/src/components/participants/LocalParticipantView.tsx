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
import { A11yComponents } from '../../constants/A11yLabels';
import { Avatar } from '../utility/Avatar';
import { LOCAL_VIDEO_VIEW_STYLE, Z_INDEX } from '../../constants';
import { useStreamVideoStoreValue } from '../../contexts';
import { useDebouncedValue } from '../../utils/hooks';

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

  zOrder?: number;
}

/**
 * A component to render the local participant's video.
 */
export const LocalParticipantView = (props: LocalParticipantViewProps) => {
  const { layout = 'floating', zOrder = Z_INDEX.IN_MIDDLE } = props;
  const containerStyle =
    layout === 'floating'
      ? styles.floatingContainer
      : styles.fullScreenContainer;
  const { style = containerStyle } = props;
  const localParticipant = useLocalParticipant();
  const isCameraOnFrontFacingMode = useStreamVideoStoreValue(
    (store) => store.isCameraOnFrontFacingMode,
  );
  // it takes a few milliseconds for the camera stream to actually switch
  const debouncedCameraOnFrontFacingMode = useDebouncedValue(
    isCameraOnFrontFacingMode,
    500,
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

  const VideoRenderOrBlankComponent = showBlankStream ? (
    <View style={style} />
  ) : (
    <VideoRenderer
      mirror={debouncedCameraOnFrontFacingMode}
      mediaStream={localParticipant.videoStream}
      style={style}
      zOrder={zOrder}
    />
  );

  if (layout === 'fullscreen') {
    if (isVideoMuted) {
      return (
        <View
          accessibilityLabel={A11yComponents.LOCAL_PARTICIPANT_FULLSCREEN}
          style={styles.avatarContainer}
        >
          <Avatar participant={localParticipant} />
        </View>
      );
    }
    return VideoRenderOrBlankComponent;
  }

  return (
    <Animated.View
      accessibilityLabel={A11yComponents.LOCAL_PARTICIPANT}
      style={{
        // Needed to make the view is on top and draggable
        zIndex: Z_INDEX.IN_MIDDLE,
        transform: [{ translateX: pan.x }, { translateY: pan.y }],
      }}
      {...panResponder.panHandlers}
    >
      {isVideoMuted ? (
        <View style={style}>
          <View style={theme.icon.md}>
            <VideoSlash color={theme.light.static_white} />
          </View>
        </View>
      ) : (
        VideoRenderOrBlankComponent
      )}
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
    overflow: 'hidden',
    backgroundColor: theme.light.disabled,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
