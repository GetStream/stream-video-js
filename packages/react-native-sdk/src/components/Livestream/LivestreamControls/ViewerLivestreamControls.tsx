import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type ViewProps } from 'react-native';
import {
  ViewerLeaveStreamButton as DefaultViewerLeaveStreamButton,
  type ViewerLeaveStreamButtonProps,
} from './ViewerLeaveStreamButton';
import { callManager } from '../../../modules/call-manager';
import { useTheme } from '../../../contexts';
import { Z_INDEX } from '../../../constants';
import { DurationBadge, FollowerCount } from '../LivestreamTopView';
import { ControlButtonIcon, IconWrapper, Maximize } from '../../../icons';
import {
  PauseIcon,
  PlayIcon,
  VolumeOff,
  VolumeOn,
} from '../../../icons/LivestreamControls';
import { CallControlsButton } from '../../Call/CallControls/Buttons/CallControlsButton';

/**
 * Props for the ViewerLivestreamControls component.
 */
export type ViewerLivestreamControlsProps = ViewerLeaveStreamButtonProps & {
  /**
   * Component to customize the leave stream button on the viewer's end live stream.
   */
  ViewerLeaveStreamButton?: React.ComponentType<ViewerLeaveStreamButtonProps> | null;

  /**
   * Handler to be called when the leave stream button is pressed.
   */
  onLeaveStreamHandler?: () => void;

  /**
   * Handler to be called when the layout of the component changes.
   */
  onLayout?: ViewProps['onLayout'];

  /**
   * Whether to humanize the participant count.
   * @default true
   * @example 1000 -> 1k; 1500 -> 1.5k
   */
  humanizeParticipantCount?: boolean;
};

/**
 * The ViewerLivestreamControls component displays the call controls for the live stream at viewer's end.
 */
export const ViewerLivestreamControls = ({
  ViewerLeaveStreamButton = DefaultViewerLeaveStreamButton,
  onLeaveStreamHandler,
  onLayout,
  humanizeParticipantCount,
}: ViewerLivestreamControlsProps) => {
  const {
    theme: { viewerLivestreamControls, semantics, primitives },
  } = useTheme();

  const [showControls, setShowControls] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showPlayPauseButton, setShowPlayPauseButton] = useState(true);
  const playPauseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hidePlayPauseButtonAfterDelay = useCallback(() => {
    if (playPauseTimeout.current) {
      clearTimeout(playPauseTimeout.current);
    }

    playPauseTimeout.current = setTimeout(() => {
      setShowPlayPauseButton(false);
      playPauseTimeout.current = null;
    }, 3000);
  }, []);

  useEffect(() => {
    hidePlayPauseButtonAfterDelay();
    return () => {
      if (playPauseTimeout.current) {
        clearTimeout(playPauseTimeout.current);
      }
    };
  }, [hidePlayPauseButtonAfterDelay]);

  const showPlayPauseButtonWithTimeout = () => {
    setShowPlayPauseButton(true);
    hidePlayPauseButtonAfterDelay();
  };

  const showControlsHandler = () => {
    showPlayPauseButtonWithTimeout();
    if (showControls) {
      return;
    }

    setShowControls(true);
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const toggleAudio = () => {
    const shouldMute = !isMuted;
    callManager.speaker.setMute(shouldMute);
    setIsMuted(shouldMute);
  };

  useEffect(() => {
    // always unmute audio output on mount for consistency
    callManager.speaker.setMute(false);
  }, []);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    showPlayPauseButtonWithTimeout();
  };

  const VolumeButton = (
    <CallControlsButton onPress={toggleAudio}>
      <ControlButtonIcon icon={isMuted ? VolumeOff : VolumeOn} />
    </CallControlsButton>
  );

  const MaximizeButton = (
    <CallControlsButton onPress={toggleControls}>
      <ControlButtonIcon icon={Maximize} />
    </CallControlsButton>
  );

  const PlayPauseButton = (
    <Pressable
      onPress={togglePlayPause}
      style={styles.playPauseButton}
      hitSlop={40}
    >
      <IconWrapper>
        {isPlaying ? (
          <PauseIcon
            color={semantics.textOnAccent}
            size={primitives.spacing2xl}
          />
        ) : (
          <PlayIcon
            color={semantics.textOnAccent}
            size={primitives.spacing2xl}
          />
        )}
      </IconWrapper>
    </Pressable>
  );

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={showControlsHandler}>
      {!isPlaying && <View style={styles.blackOverlay} />}

      {showPlayPauseButton && (
        <View style={styles.centerButtonContainer}>{PlayPauseButton}</View>
      )}

      {showControls && (
        <View
          style={[styles.container, viewerLivestreamControls.container]}
          onLayout={onLayout}
        >
          <View
            style={[styles.leftElement, viewerLivestreamControls.leftElement]}
          >
            <View
              style={[styles.leftElement, viewerLivestreamControls.leftElement]}
            >
              {/* <LiveIndicator /> */}
              <FollowerCount
                humanizeParticipantCount={humanizeParticipantCount}
              />
              <DurationBadge mode="viewer" />
            </View>
          </View>

          <View
            style={[styles.rightElement, viewerLivestreamControls.rightElement]}
          >
            {VolumeButton}
            {MaximizeButton}
            {ViewerLeaveStreamButton && (
              <ViewerLeaveStreamButton
                onLeaveStreamHandler={onLeaveStreamHandler}
              />
            )}
          </View>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: Z_INDEX.IN_FRONT,
  },
  leftElement: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  rightElement: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  liveInfo: {
    flexDirection: 'row',
  },
  centerButtonContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: Z_INDEX.IN_FRONT,
    pointerEvents: 'box-none',
  },
  playPauseButton: {
    height: 200,
    width: 200,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: Z_INDEX.IN_FRONT + 1,
  },
  blackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
    zIndex: Z_INDEX.IN_FRONT - 1,
  },
});
