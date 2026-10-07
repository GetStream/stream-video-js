import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View as RNView } from 'react-native';
import { StreamTheme, useTheme } from '@stream-io/video-react-native-sdk';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { FoldDivision, useFoldDivision } from '../hooks/useFoldDivision';
import {
  BarLayoutContext,
  type BarLayoutReporters,
} from '../contexts/FoldAwareBarLayoutContext';

// hinge angle (degrees) where the layout starts to re-center, and where it is
// fully centered on the hinge. iOS reports partiallyOpen up to 175 and then
// jumps to 180 (fullyOpen), so 175 is treated as flat.
const FLAT_ANGLE = 175;
const FOLDED_ANGLE = 150;

// short critically damped spring that smooths the steps between hinge angle
// updates without lagging behind the hinge
const PROGRESS_SPRING = { duration: 120, dampingRatio: 1 };

/** 0 when flat (or no hinge), 1 when folded to FOLDED_ANGLE or further. */
const getFoldProgress = (fold: FoldDivision | undefined) => {
  if (!fold) return 0;
  if (fold.angle < 0) return fold.active ? 1 : 0;
  const progress = (FLAT_ANGLE - fold.angle) / (FLAT_ANGLE - FOLDED_ANGLE);
  return Math.min(1, Math.max(0, progress));
};

/**
 * Owns the call screen's safe-area side padding and follows the hinge, so
 * that the participants grid ends up split at the fold as the device folds:
 * - vertical hinge (landscape): the sides blend to equal insets, centering
 *   the call layout on the hinge;
 * - horizontal hinge (portrait): extra top or bottom padding moves the middle
 *   of the participants area (between the top bar and the bottom controls)
 *   onto the hinge.
 * Inset changes that are not about the hinge (rotation) apply immediately.
 * Children get zero side insets through the theme, so nothing pads twice.
 */
export const FoldAwareCallArea = ({ children }: React.PropsWithChildren) => {
  const { theme } = useTheme();
  const { left, right, bottom } = useSafeAreaInsets();
  const fold = useFoldDivision();
  const targetProgress = getFoldProgress(fold);
  const isHorizontalFold = !!fold && fold.width > fold.height;

  const containerRef = useRef<RNView>(null);
  const [area, setArea] = useState<{ y: number; height: number }>();
  const [topBarHeight, setTopBarHeight] = useState(0);
  const [bottomBarHeight, setBottomBarHeight] = useState(0);

  const onContainerLayout = useCallback(() => {
    containerRef.current?.measureInWindow((_x, y, _width, height) => {
      setArea((prev) =>
        prev && prev.y === y && prev.height === height ? prev : { y, height },
      );
    });
  }, []);

  const barLayout = useMemo<BarLayoutReporters>(
    () => ({
      onTopBarLayout: (event) =>
        setTopBarHeight(event.nativeEvent.layout.height),
      setBottomBarHeight,
    }),
    [],
  );

  // extra padding that centers the participants area on a horizontal hinge;
  // it is computed from sizes the padding itself does not change
  let extraTop = 0;
  let extraBottom = 0;
  if (fold && isHorizontalFold && area) {
    const participantsTop = area.y + topBarHeight;
    const participantsBottom = area.y + area.height - bottom - bottomBarHeight;
    const offset =
      fold.y + fold.height / 2 - (participantsTop + participantsBottom) / 2;
    extraTop = Math.max(0, offset * 2);
    extraBottom = Math.max(0, -offset * 2);
  }
  const sideProgress = isHorizontalFold ? 0 : targetProgress;
  const verticalProgress = isHorizontalFold ? targetProgress : 0;

  const insetLeft = useSharedValue(left);
  const insetRight = useSharedValue(right);
  const extraTopValue = useSharedValue(extraTop);
  const extraBottomValue = useSharedValue(extraBottom);
  const sideProgressValue = useSharedValue(sideProgress);
  const verticalProgressValue = useSharedValue(verticalProgress);

  useEffect(() => {
    insetLeft.value = left;
    insetRight.value = right;
    extraTopValue.value = extraTop;
    extraBottomValue.value = extraBottom;
  }, [
    left,
    right,
    extraTop,
    extraBottom,
    insetLeft,
    insetRight,
    extraTopValue,
    extraBottomValue,
  ]);

  useEffect(() => {
    sideProgressValue.value = withSpring(sideProgress, PROGRESS_SPRING);
    verticalProgressValue.value = withSpring(verticalProgress, PROGRESS_SPRING);
  }, [
    sideProgress,
    verticalProgress,
    sideProgressValue,
    verticalProgressValue,
  ]);

  const animatedStyle = useAnimatedStyle(() => {
    const side = Math.max(insetLeft.value, insetRight.value);
    return {
      paddingLeft:
        insetLeft.value + (side - insetLeft.value) * sideProgressValue.value,
      paddingRight:
        insetRight.value + (side - insetRight.value) * sideProgressValue.value,
      paddingTop: extraTopValue.value * verticalProgressValue.value,
      paddingBottom: extraBottomValue.value * verticalProgressValue.value,
    };
  });

  return (
    <Animated.View
      ref={containerRef}
      onLayout={onContainerLayout}
      style={[styles.container, animatedStyle]}
    >
      <BarLayoutContext.Provider value={barLayout}>
        <StreamTheme theme={theme}>{children}</StreamTheme>
      </BarLayoutContext.Provider>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});
