import React, { useRef } from 'react';
import {
  Animated,
  PanResponder,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { VideoRenderer } from './VideoRenderer';
import { useLocalParticipant } from '@stream-io/video-react-bindings';
import { SfuModels } from '@stream-io/video-client';
import { useStreamVideoStoreValue } from '../contexts';
import { theme } from '../theme';
import { VideoSlash } from '../icons';
import { LOCAL_VIDEO_VIEW_STYLE } from '../constants';

/**
 * Props to be passed for the LocalVideoView component.
 */
export interface LocalVideoViewProps {
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
 * Shows a floating participant UI that can be dragged (to be implemented) within certain bounds.
 *
 * | Local Video | Local Video in relation to active call screen |
 * | :---- | :----: |
 * |![local-video-view-1](https://user-images.githubusercontent.com/25864161/217491433-60848d95-1a14-422e-b4e1-7540f3ba30b4.png)|![local-video-view-2](https://user-images.githubusercontent.com/25864161/217491438-75bad10c-8850-49f5-b3bd-af22995e11c2.png)|
 */
export const LocalVideoView = (props: LocalVideoViewProps) => {
  const { layout = 'floating', zOrder = 1 } = props;
  const containerStyle =
    layout === 'floating'
      ? styles.floatingContainer
      : styles.fullScreenContainer;
  const { style = containerStyle } = props;
  const localParticipant = useLocalParticipant();
  const isCameraOnFrontFacingMode = useStreamVideoStoreValue(
    (store) => store.isCameraOnFrontFacingMode,
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

  if (!localParticipant) return null;

  const isVideoMuted = !localParticipant.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );

  if (layout === 'fullscreen') {
    return (
      <VideoRenderer
        mirror={isCameraOnFrontFacingMode}
        mediaStream={localParticipant.videoStream}
        style={style}
        zOrder={zOrder}
      />
    );
  }

  return (
    <Animated.View
      style={{
        zIndex: 5,
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
        <VideoRenderer
          mirror={isCameraOnFrontFacingMode}
          mediaStream={localParticipant.videoStream}
          style={style}
          zOrder={zOrder}
        />
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
    top: theme.margin.md,
    borderRadius: LOCAL_VIDEO_VIEW_STYLE.borderRadius,
    zIndex: 1,
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
});
