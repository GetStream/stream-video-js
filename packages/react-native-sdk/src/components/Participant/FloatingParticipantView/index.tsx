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
import FloatingView from './FloatingView';
import {
  CallContentProps,
  CallParticipantsListComponentProps,
} from '../../Call';
import { FloatingViewAlignment } from './FloatingView/common';
import {
  ParticipantView as DefaultParticipantView,
  ParticipantViewComponentProps,
  ParticipantViewProps,
} from '../ParticipantView';
import { useTheme } from '../../../contexts/ThemeContext';
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
  Pick<CallParticipantsListComponentProps, 'ParticipantView'> &
  Pick<CallContentProps, 'supportedReactions'> &
  Pick<ParticipantViewProps, 'objectFit' | 'videoZOrder'> & {
    /**
     * Determines where the floating participant video will be placed.
     */
    alignment?: FloatingParticipantViewAlignment;
    /**
     * The participant to be rendered in the FloatingParticipantView
     */
    participant?: StreamVideoParticipant;
    /**
     * Custom style to be merged with the container of the participant view.
     */
    participantViewStyle?: StyleProp<ViewStyle>;
    /**
     * Custom style to be merged with the absolute container of the floating participant view.
     * This is the container that holds the participant view and the whole of its draggable area.
     */
    draggableContainerStyle?: StyleProp<ViewStyle>;
    /**
     * Handler used to handle actions on click of the participant view in FloatingParticipantView.
     * Eg: Can be used to handle participant switch on click.
     */
    onPressHandler?: () => void;
  };

const DefaultLocalParticipantViewVideoFallback = () => {
  const {
    theme: {
      colors,
      floatingParticipantsView,
      variants: { iconSizes },
      defaults,
    },
  } = useTheme();

  return (
    <View
      style={[
        styles.videoFallback,
        { backgroundColor: colors.sheetSecondary },
        floatingParticipantsView.videoFallback,
      ]}
    >
      <View style={{ height: iconSizes.md, width: iconSizes.md }}>
        <VideoSlash color={colors.iconPrimary} size={defaults.iconSize} />
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
  participantViewStyle,
  draggableContainerStyle,
  ParticipantView = DefaultParticipantView,
  ParticipantNetworkQualityIndicator,
  ParticipantVideoFallback = DefaultLocalParticipantViewVideoFallback,
  ParticipantReaction,
  VideoRenderer,
  supportedReactions,
  videoZOrder = 1,
  objectFit,
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
    ParticipantVideoFallback,
    VideoRenderer,
  };

  if (!participant) {
    return null;
  }

  return (
    <View
      testID={ComponentTestIds.LOCAL_PARTICIPANT}
      style={[
        styles.container,
        draggableContainerStyle,
        floatingParticipantsView.container,
      ]}
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
          <Pressable onPress={onPressHandler}>
            {ParticipantView && (
              <ParticipantView
                participant={participant}
                trackType="videoTrack"
                style={[
                  styles.participantViewContainer,
                  participantViewStyle,
                  { shadowColor: colors.sheetPrimary },
                  floatingParticipantsView.participantViewContainer,
                ]}
                // video z order must be one above the one used in grid view
                // (which uses the default: 0)
                videoZOrder={videoZOrder}
                objectFit={objectFit}
                supportedReactions={supportedReactions}
                {...participantViewProps}
              />
            )}
          </Pressable>
        </FloatingView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
