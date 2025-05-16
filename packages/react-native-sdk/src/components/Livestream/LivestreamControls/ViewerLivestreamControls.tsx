import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, StyleSheet, View, type ViewProps } from 'react-native';
import {
  ViewerLeaveStreamButton as DefaultViewerLeaveStreamButton,
  type ViewerLeaveStreamButtonProps,
} from './ViewerLeaveStreamButton';
import { useTheme } from '../../../contexts';
import { Z_INDEX } from '../../../constants';
import {
  DurationBadge,
  FollowerCount,
  LiveIndicator,
} from '../LivestreamTopView';
import { IconWrapper, Maximize } from '../../../icons';
import InCallManager from 'react-native-incall-manager';
import {
  VolumeOff,
  VolumeOn,
  PauseIcon,
  PlayIcon,
} from '../../../icons/LivestreamControls';

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
};

/**
 * The ViewerLivestreamControls component displays the call controls for the live stream at viewer's end.
 */
export const ViewerLivestreamControls = ({
  ViewerLeaveStreamButton = DefaultViewerLeaveStreamButton,
  onLeaveStreamHandler,
  onLayout,
}: ViewerLivestreamControlsProps) => {
  const styles = useStyles();
  const {
    theme: { colors, viewerLivestreamControls, variants },
  } = useTheme();

  const [showControls, setShowControls] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showPlayPauseButton, setShowPlayPauseButton] = useState(true);
  const playPauseTimeout = useRef<NodeJS.Timeout | null>(null);

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
    setIsMuted(!isMuted);
    InCallManager.setForceSpeakerphoneOn(isMuted);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    showPlayPauseButtonWithTimeout();
  };

  const VolumeButton = (
    <Pressable onPress={toggleAudio} style={[styles.fullscreenButton]}>
      <View style={[styles.icon]}>
        <IconWrapper>
          {isMuted ? (
            <VolumeOff
              color={colors.iconPrimary}
              size={variants.iconSizes.sm}
            />
          ) : (
            <VolumeOn color={colors.iconPrimary} size={variants.iconSizes.sm} />
          )}
        </IconWrapper>
      </View>
    </Pressable>
  );

  const MaximizeButton = (
    <Pressable onPress={toggleControls} style={[styles.fullscreenButton]}>
      <View style={[styles.icon]}>
        <Maximize
          color={colors.iconPrimary}
          width={variants.iconSizes.sm}
          height={variants.iconSizes.sm}
        />
      </View>
    </Pressable>
  );

  const PlayPauseButton = (
    <Pressable onPress={togglePlayPause} style={styles.playPauseButton}>
      <View style={styles.playPauseIcon}>
        <IconWrapper>
          {isPlaying ? (
            <PauseIcon
              color={colors.iconPrimary}
              size={variants.iconSizes.lg * 3}
            />
          ) : (
            <PlayIcon
              color={colors.iconPrimary}
              size={variants.iconSizes.lg * 3}
            />
          )}
        </IconWrapper>
      </View>
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
            <View style={[styles.leftElement]}>
              <View style={[styles.liveInfo]}>
                <LiveIndicator />
                <FollowerCount />
              </View>
            </View>
          </View>
          <View>
            <DurationBadge mode="viewer" />
          </View>

          <View
            style={[styles.rightElement, viewerLivestreamControls.rightElement]}
          >
            <View style={styles.buttonContainer}>
              {VolumeButton}
              {MaximizeButton}
              {ViewerLeaveStreamButton && (
                <ViewerLeaveStreamButton
                  onLeaveStreamHandler={onLeaveStreamHandler}
                />
              )}
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          position: 'absolute',
          bottom: 0,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 16,
          paddingHorizontal: 8,
          zIndex: Z_INDEX.IN_FRONT,
          backgroundColor: theme.colors.sheetOverlay,
        },
        leftElement: {
          flex: 1,
          alignItems: 'flex-start',
          justifyContent: 'center',
        },
        rightElement: {
          flex: 1,
          alignItems: 'flex-end',
        },
        liveInfo: {
          flexDirection: 'row',
        },
        icon: {
          height: theme.variants.iconSizes.sm,
          width: theme.variants.iconSizes.sm,
        },
        fullscreenButton: {
          backgroundColor: theme.colors.buttonSecondary,
          height: theme.variants.buttonSizes.xs,
          width: theme.variants.buttonSizes.xs,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: theme.variants.borderRadiusSizes.sm,
          zIndex: 2,
        },
        buttonContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.variants.spacingSizes.sm,
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
        playPauseIcon: {
          height: 200,
          width: 200,
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
      }),
    [theme],
  );
};
