import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { LOCAL_VIDEO_VIEW_STYLE, Z_INDEX } from '../../../constants';
import { ComponentTestIds } from '../../../constants/TestIds';
import { VideoSlash } from '../../../icons';
import { theme } from '../../../theme';
import FloatingView from './FloatingView';
import { CallParticipantsListProps } from '../../Call';
import { FloatingViewAlignment } from './FloatingView/common';
import {
  ParticipantView as DefaultParticipantView,
  ParticipantViewComponentProps,
} from '../ParticipantView';

export type LocalParticipantViewAlignment =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

/**
 * Props to be passed for the LocalVideoView component.
 */
export type LocalParticipantViewProps = ParticipantViewComponentProps &
  Pick<CallParticipantsListProps, 'ParticipantView'> & {
    /**
     * Determines where the floating participant video will be placed.
     */
    alignment?: LocalParticipantViewAlignment;
    /**
     * Custom style to be merged with the local participant view.
     */
    style?: StyleProp<ViewStyle>;
  };

const CustomLocalParticipantViewVideoFallback = () => {
  return (
    <View style={styles.videoFallback}>
      <View style={theme.icon.md}>
        <VideoSlash color={theme.light.static_white} />
      </View>
    </View>
  );
};

/**
 * A component to render the local participant's video.
 */
export const LocalParticipantView = ({
  alignment = 'top-right',
  style,
  ParticipantView = DefaultParticipantView,
  ParticipantNetworkQualityIndicator,
  ParticipantReaction,
  VideoRenderer,
}: LocalParticipantViewProps) => {
  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();

  const floatingAlignmentMap: Record<
    LocalParticipantViewAlignment,
    FloatingViewAlignment
  > = {
    'top-left': FloatingViewAlignment.topLeft,
    'top-right': FloatingViewAlignment.topRight,
    'bottom-left': FloatingViewAlignment.bottomLeft,
    'bottom-right': FloatingViewAlignment.bottomRight,
  };

  const [containerDimensions, setContainerDimensions] = React.useState<{
    width: number;
    height: number;
  }>();

  if (!localParticipant) {
    return null;
  }

  const participantViewProps: ParticipantViewComponentProps = {
    ParticipantLabel: null,
    ParticipantNetworkQualityIndicator,
    ParticipantReaction,
    ParticipantVideoFallback: CustomLocalParticipantViewVideoFallback,
    VideoRenderer,
  };

  return (
    <View
      testID={ComponentTestIds.LOCAL_PARTICIPANT}
      style={[styles.floatingContainer, style]}
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
          initialAlignment={floatingAlignmentMap[alignment]}
        >
          {ParticipantView && (
            <ParticipantView
              participant={localParticipant}
              videoMode={'video'}
              style={[styles.floatingViewContainer, style]}
              // video z order must be one above the one used in grid view
              // (which uses the default: 0)
              videoZOrder={1}
              {...participantViewProps}
            />
          )}
        </FloatingView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    // Needed to make the view on top and draggable
    zIndex: Z_INDEX.IN_MIDDLE,
    flex: 1,
    margin: theme.margin.sm,
  },
  floatingViewContainer: {
    height: LOCAL_VIDEO_VIEW_STYLE.height,
    width: LOCAL_VIDEO_VIEW_STYLE.width,
    borderRadius: LOCAL_VIDEO_VIEW_STYLE.borderRadius,
    backgroundColor: theme.light.static_grey,
    shadowColor: theme.light.static_black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  videoFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.light.disabled,
  },
});
