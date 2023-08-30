import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { FLOATING_VIDEO_VIEW_STYLE, Z_INDEX } from '../../../constants';
import { ComponentTestIds } from '../../../constants/TestIds';
import { VideoSlash } from '../../../icons';
import { CallParticipantsListProps } from '../../Call';
import { FloatingViewAlignment } from './FloatingView/common';
import {
  ParticipantView as DefaultParticipantView,
  ParticipantViewComponentProps,
} from '../ParticipantView';
import { useTheme } from '../../../contexts/ThemeContext';
import AnimatedFloatingView from './FloatingView/AnimatedFloatingView';
import { StreamVideoParticipant } from '@stream-io/video-client';

export type FloatingParticipantViewAlignment =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

/**
 * Props to be passed for the LocalVideoView component.
 */
export type FloatingParticipantViewProps = ParticipantViewComponentProps &
  Pick<CallParticipantsListProps, 'ParticipantView'> & {
    /**
     * Determines where the floating participant video will be placed.
     */
    alignment?: FloatingParticipantViewAlignment;
    /**
     * The participant to be rendered in the FloatingParticipantView
     */
    participant?: StreamVideoParticipant;
    /**
     * Custom style to be merged with the floating participant view.
     */
    style?: StyleProp<ViewStyle>;
    /**
     * Handler used to handle actions on click of the participant view in FloatingParticipantView.
     * Eg: Can be used to handle participant switch on click.
     */
    onPressHandler?: () => void;
  };

const CustomLocalParticipantViewVideoFallback = () => {
  const {
    theme: {
      colors,
      floatingParticipantsView,
      variants: { iconSizes },
    },
  } = useTheme();

  return (
    <View
      style={[
        styles.videoFallback,
        { backgroundColor: colors.disabled },
        floatingParticipantsView.videoFallback,
      ]}
    >
      <View style={{ height: iconSizes.md, width: iconSizes.md }}>
        <VideoSlash color={colors.static_white} />
      </View>
    </View>
  );
};

/**
 * A component to render the floating participant's video.
 */
export const FloatingParticipantView = ({
  alignment = 'top-right',
  onPressHandler,
  participant,
  style,
  ParticipantView = DefaultParticipantView,
  ParticipantNetworkQualityIndicator,
  ParticipantReaction,
  VideoRenderer,
}: FloatingParticipantViewProps) => {
  const {
    theme: { colors, floatingParticipantsView },
  } = useTheme();

  const floatingAlignmentMap: Record<
    FloatingParticipantViewAlignment,
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

  const participantViewProps: ParticipantViewComponentProps = {
    ParticipantLabel: null,
    ParticipantNetworkQualityIndicator,
    ParticipantReaction,
    ParticipantVideoFallback: CustomLocalParticipantViewVideoFallback,
    VideoRenderer,
  };

  if (!participant) {
    return null;
  }

  return (
    <View
      testID={ComponentTestIds.LOCAL_PARTICIPANT}
      style={[styles.container, floatingParticipantsView.container]}
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
        <AnimatedFloatingView
          containerHeight={containerDimensions.height}
          containerWidth={containerDimensions.width}
          initialAlignment={floatingAlignmentMap[alignment]}
        >
          <Pressable onPress={onPressHandler}>
            {ParticipantView && (
              <ParticipantView
                participant={participant}
                videoMode={'video'}
                style={[
                  styles.participantViewContainer,
                  style,
                  {
                    backgroundColor: colors.static_grey,
                    shadowColor: colors.static_black,
                  },
                  floatingParticipantsView.participantViewContainer,
                ]}
                // video z order must be one above the one used in grid view
                // (which uses the default: 0)
                videoZOrder={1}
                {...participantViewProps}
              />
            )}
          </Pressable>
        </AnimatedFloatingView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 8,
    // Needed to make the view on top and draggable
    zIndex: Z_INDEX.IN_MIDDLE,
    flex: 1,
  },
  participantViewContainer: {
    height: FLOATING_VIDEO_VIEW_STYLE.height,
    width: FLOATING_VIDEO_VIEW_STYLE.width,
    borderRadius: FLOATING_VIDEO_VIEW_STYLE.borderRadius,
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
  },
});
