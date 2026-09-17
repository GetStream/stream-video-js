import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { callManager } from '../../../modules/call-manager';
import { useTheme } from '../../../contexts';
import { Z_INDEX } from '../../../constants';
import { IconWrapper } from '../../../icons';
import { PauseIcon, PlayIcon } from '../../../icons/LivestreamControls';

/**
 * Props for the ViewerLivestreamOverlay component.
 */
export type ViewerLivestreamOverlayProps = {
  /**
   * Whether the controls are currently visible.
   */
  showControls: boolean;
  /**
   * Sets the visibility of the controls.
   */
  setShowControls: (show: boolean) => void;
};

/**
 * The ViewerLivestreamOverlay component displays frame overlay over the live stream video.
 */
export const ViewerLivestreamOverlay = ({
  showControls,
  setShowControls,
}: ViewerLivestreamOverlayProps) => {
  const {
    theme: { viewerLivestreamOverlay, semantics, primitives, insets },
  } = useTheme();

  const playPauseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showPlayPauseButton, setShowPlayPauseButton] = useState(true);
  const [size, setSize] = useState({ width: 0, height: 0 });

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

  useEffect(() => {
    // always unmute audio output on mount for consistency
    callManager.speaker.setMute(false);
  }, []);

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

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    showPlayPauseButtonWithTimeout();
  };

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height },
    );
  };

  return (
    <>
      {!isPlaying && (
        <View
          style={[
            styles.blackOverlay,
            {
              zIndex: showControls
                ? Z_INDEX.IN_FRONT - 1
                : Z_INDEX.IN_FRONT + 1,
            },
          ]}
        />
      )}

      <Pressable
        style={[styles.container, viewerLivestreamOverlay.container]}
        onPress={showControlsHandler}
        onLayout={onLayout}
      >
        {showPlayPauseButton && (
          <View style={styles.centerButtonContainer}>
            <Pressable onPress={togglePlayPause} style={styles.playPauseButton}>
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
          </View>
        )}

        {size.width > 0 && size.height > 0 && showControls && (
          <RoundedHoleOverlay
            size={size}
            inset={insets.bottom}
            style={viewerLivestreamOverlay.frame}
          />
        )}
      </Pressable>
    </>
  );
};

type RoundedHoleOverlayProps = {
  size: { width: number; height: number };
  /**
   * Height of the solid strip along the bottom edge. The rounded frame takes
   * the remaining `height - inset`, so frame + strip always add up to `height`.
   */
  inset?: number;
  style?: Pick<ViewStyle, 'padding' | 'borderRadius' | 'backgroundColor'>;
};

const toLength = (value: unknown, fallback: number) =>
  typeof value === 'number' ? value : fallback;

function RoundedHoleOverlay({
  size,
  inset = 0,
  style = {
    padding: 8,
    borderRadius: 24,
    backgroundColor: 'white',
  },
}: RoundedHoleOverlayProps) {
  const pad = toLength(style.padding, 8);
  const cornerRadius = toLength(style.borderRadius, 24);

  // The strip needs no geometry of its own. `evenodd` fills everything the hole
  // does not cover, so shrinking the hole's frame by `inset` leaves exactly an
  // `inset`-tall band of fill running to the bottom edge.
  const frameHeight = size.height - inset;
  const innerW = size.width - pad * 2;
  const innerH = frameHeight - pad * 2;

  const outer = `M0 0 H${size.width} V${size.height} H0 Z`;

  // padding and inset have eaten the whole area - nothing left to punch out
  if (innerW <= 0 || innerH <= 0) {
    return (
      <Svg
        width={size.width}
        height={size.height}
        style={[StyleSheet.absoluteFill, { zIndex: Z_INDEX.IN_FRONT }]}
        pointerEvents="none"
      >
        <Path d={outer} fill={style.backgroundColor} />
      </Svg>
    );
  }

  const r = Math.max(0, Math.min(cornerRadius, innerW / 2, innerH / 2));
  const x = pad;
  const y = pad;
  const d = `
    ${outer}
    M${x + r} ${y}
    H${x + innerW - r}
    A${r} ${r} 0 0 1 ${x + innerW} ${y + r}
    V${y + innerH - r}
    A${r} ${r} 0 0 1 ${x + innerW - r} ${y + innerH}
    H${x + r}
    A${r} ${r} 0 0 1 ${x} ${y + innerH - r}
    V${y + r}
    A${r} ${r} 0 0 1 ${x + r} ${y}
    Z
  `;
  return (
    <Svg
      width={size.width}
      height={size.height}
      style={[StyleSheet.absoluteFill]}
      pointerEvents="none"
    >
      <Path d={d} fill={style.backgroundColor} fillRule="evenodd" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: Z_INDEX.IN_FRONT + 2,
  },
  centerButtonContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  playPauseButton: {
    height: 200,
    width: 200,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -100 }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  blackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
  },
});
