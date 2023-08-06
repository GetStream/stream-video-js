import React, { useEffect, useMemo, useReducer, useRef } from 'react';
import {
  Animated,
  View,
  StyleSheet,
  PanResponder,
  LayoutRectangle,
  Easing,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';

import Reanimated, {
  withSpring,
  useAnimatedStyle,
  useSharedValue,
  useAnimatedGestureHandler,
} from 'react-native-reanimated';

const enum FloatingViewAlignment {
  // Aligns the floating view to the top left corner.
  topLeft,

  // Aligns the floating view to the top right corner.
  topRight,

  // Aligns the floating view to the bottom left corner.
  bottomLeft,

  // Aligns the floating view to the bottom right corner.
  bottomRight,
}

type SnapAlignments = Record<FloatingViewAlignment, { x: number; y: number }>;

function getSnapAlignments({
  rootContainerDimensions,
  floatingViewDimensions,
}: {
  rootContainerDimensions: { width: number; height: number };
  floatingViewDimensions: { width: number; height: number };
}): SnapAlignments {
  const right = rootContainerDimensions.width - floatingViewDimensions.width;
  const bottom = rootContainerDimensions.height - floatingViewDimensions.height;
  const snapOffsets = {
    [FloatingViewAlignment.topLeft]: {
      x: 0,
      y: 0,
    },
    [FloatingViewAlignment.topRight]: {
      x: right,
      y: 0,
    },
    [FloatingViewAlignment.bottomLeft]: {
      x: 0,
      y: bottom,
    },
    [FloatingViewAlignment.bottomRight]: {
      x: right,
      y: bottom,
    },
  };
  return snapOffsets;
}

// which is the closest snap alignment to the current position?
// this is done by finding the closest snap offset by computing which point is
// in the minimum distance between the current position and all the 4 snap offset bounds
function getClosestSnapAlignment({
  position,
  snapAlignments,
}: {
  position: { x: number; y: number };
  snapAlignments: SnapAlignments;
}) {
  'worklet';
  let minDistanceSquared = Number.MAX_VALUE;
  let closestSnapAlignmentKey: FloatingViewAlignment =
    FloatingViewAlignment.topRight;
  for (const key in snapAlignments) {
    // NOTE: key is a string always but we know that it is a FloatingViewAlignment, so we have to cast it unfortunately
    const currentAlignmentKey = key as unknown as FloatingViewAlignment;
    const offset = snapAlignments[currentAlignmentKey];
    const currDistanceSquared =
      (offset.x - position.x) * (offset.x - position.x) +
      (offset.y - position.y) * (offset.y - position.y);
    if (currDistanceSquared < minDistanceSquared) {
      minDistanceSquared = currDistanceSquared;
      closestSnapAlignmentKey = currentAlignmentKey;
    }
  }
  return snapAlignments[closestSnapAlignmentKey];
}

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootView />
    </GestureHandlerRootView>
    // </GestureHandlerRootView>
  );
};
const RootView = () => {
  const [rectangle, setRectangle] = React.useState<LayoutRectangle>();
  return (
    <View
      style={styles.container}
      onLayout={(event) => {
        setRectangle(event.nativeEvent.layout);
      }}
    >
      {rectangle && (
        <FloatingView
          initialAlignment={FloatingViewAlignment.bottomRight}
          containerWidth={rectangle.width}
          containerHeight={rectangle.height}
        />
      )}
    </View>
  );
};

type Props = {
  initialAlignment: FloatingViewAlignment;
  containerWidth: number;
  containerHeight: number;
};

const FloatingView = ({
  initialAlignment,
  containerWidth,
  containerHeight,
}: Props) => {
  // the translate is calculated using distance of dragging (dx, dy)
  // computed value = value + offset
  // Start of a DRAG state: value is (0,0) and offset is the last (translateX, translateY)
  // DRAGGING state: value is always current (dx, dy) and offset is last (translateX, translateY)
  const translateRef = useRef(new Animated.ValueXY());
  const opacity = useRef(new Animated.Value(0));

  const [rectangle, setRectangle] = React.useState<LayoutRectangle>();

  // we need to force update the component when the rectangle is available
  // we cannot just rely on the rectangle because it is not available on the first render
  // and we need snapAlignmentsRef to be computed once
  const [_, forceUpdate] = useReducer((x) => x + 1, 0);

  // the offsets for the translate bounds of the floating view
  // stored in ref, because it is used in the panResponder (which has to be a ref)
  const snapAlignmentsRef = useRef<ReturnType<typeof getSnapAlignments>>({
    [FloatingViewAlignment.topLeft]: { x: 0, y: 0 },
    [FloatingViewAlignment.topRight]: { x: 0, y: 0 },
    [FloatingViewAlignment.bottomLeft]: { x: 0, y: 0 },
    [FloatingViewAlignment.bottomRight]: { x: 0, y: 0 },
  });

  useEffect(() => {
    if (!rectangle) {
      return;
    }
    const snapAlignments = getSnapAlignments({
      rootContainerDimensions: {
        width: containerWidth,
        height: containerHeight,
      },
      floatingViewDimensions: {
        width: rectangle.width,
        height: rectangle.height,
      },
    });
    const { x, y } = snapAlignments[initialAlignment];
    snapAlignmentsRef.current = snapAlignments;
    translateRef.current.setOffset({ x, y });
    translateRef.current.setValue({ x: 0, y: 0 });
    opacity.current.setValue(1);
    forceUpdate();
    // any time the dependency changes, we need to snap to the new alignment
  }, [initialAlignment, rectangle, containerWidth, containerHeight]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // while doing move, the value will be set to distance and offset is the current position
      // example if we 100 to the left
      // value is x:-100 y:0, offset is the previous position
      onPanResponderMove: Animated.event(
        [
          null, // raw native event arg ignored
          {
            // dx, dy are the accumulated distance of the gesture since the touch started
            dx: translateRef.current.x,
            dy: translateRef.current.y,
          },
        ],
        {
          useNativeDriver: false, // pan responder move event doesn't support nativeDriver
        },
      ),
      onPanResponderGrant: () => {
        // start of a drag value is always (0,0) and offset is the last (translateX, translateY)
        translateRef.current.extractOffset();
      },
      onPanResponderRelease: () => {
        // make offset to 0 and value is set to the current position (so that we can do the timing animation later)
        translateRef.current.flattenOffset();
        // @ts-expect-error panResponder doesn't support nativeDriver so we can use __getValue() safely
        const currentPosition = translateRef.current.__getValue() as {
          x: number;
          y: number;
        };
        const closestAlignment = getClosestSnapAlignment({
          position: currentPosition,
          snapAlignments: snapAlignmentsRef.current,
        });
        Animated.timing(translateRef.current, {
          toValue: closestAlignment,
          duration: 300,
          useNativeDriver: true, // can pass true since we only use transform animation
          easing: Easing.inOut(Easing.quad),
        }).start();
      },
    }),
  ).current;

  const containerStyle = {
    ...styles.animContainer,
    // do not show anything in the UI until we have the rectangle (onLayout)
    opacity: opacity.current,
    // we use interpolation to keep the value in the bounds of the necessary FloatingViewAlignment
    transform: [
      {
        translateX: translateRef.current.x.interpolate({
          inputRange: [
            0,
            snapAlignmentsRef.current[FloatingViewAlignment.topRight].x,
          ],
          outputRange: [
            0,
            snapAlignmentsRef.current[FloatingViewAlignment.topRight].x,
          ],
          extrapolate: 'clamp',
        }),
      },
      {
        translateY: translateRef.current.y.interpolate({
          inputRange: [
            0,
            snapAlignmentsRef.current[FloatingViewAlignment.bottomRight].y,
          ],
          outputRange: [
            0,
            snapAlignmentsRef.current[FloatingViewAlignment.bottomRight].y,
          ],
          extrapolate: 'clamp',
        }),
      },
    ],
  };

  return (
    <Animated.View style={containerStyle} {...panResponder.panHandlers}>
      <View
        style={styles.box}
        onLayout={(event) => {
          setRectangle(event.nativeEvent.layout);
        }}
      />
    </Animated.View>
  );
};

const ReanimatedFloatingView = ({
  initialAlignment,
  containerHeight,
  containerWidth,
}: Props) => {
  // to store the starting position of the gesture (should not be used for styling)
  const start = useSharedValue({ x: 0, y: 0 });
  // to store the necessary translate x, y position
  const translation = useSharedValue({ x: 0, y: 0 });
  // we don't want to show the floating view until we have the layout rectangle
  const opacity = useSharedValue(0);
  const [rectangle, setRectangle] = React.useState<LayoutRectangle>();

  const snapAlignments = useMemo(() => {
    if (!rectangle) {
      return {
        [FloatingViewAlignment.topLeft]: { x: 0, y: 0 },
        [FloatingViewAlignment.topRight]: { x: 0, y: 0 },
        [FloatingViewAlignment.bottomLeft]: { x: 0, y: 0 },
        [FloatingViewAlignment.bottomRight]: { x: 0, y: 0 },
      };
    }
    return getSnapAlignments({
      rootContainerDimensions: {
        width: containerWidth,
        height: containerHeight,
      },
      floatingViewDimensions: {
        width: rectangle.width,
        height: rectangle.height,
      },
    });
  }, [rectangle, containerWidth, containerHeight]);

  const dragGesture = Gesture.Pan()
    .onStart((_e) => {
      // store the starting position of the gesture
      start.value = {
        x: translation.value.x,
        y: translation.value.y,
      };
    })
    .onUpdate((e) => {
      // update the translation with the distance of the gesture + starting position
      translation.value = {
        x: Math.max(
          0,
          Math.min(
            e.translationX + start.value.x,
            snapAlignments[FloatingViewAlignment.bottomRight].x,
          ),
        ),
        y: Math.max(
          0,
          Math.min(
            translation.value.y,
            snapAlignments[FloatingViewAlignment.bottomRight].y,
          ),
        ),
      };
    })
    .onEnd(() => {
      // snap to the closest alignment with a spring animation
      const position = translation.value;
      const closestAlignment = getClosestSnapAlignment({
        position,
        snapAlignments,
      });
      translation.value = withSpring(closestAlignment);
    });

  useEffect(() => {
    translation.value = snapAlignments[initialAlignment];
    opacity.value = 1;
  }, [snapAlignments, initialAlignment, translation, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      ...StyleSheet.absoluteFillObject,
      opacity: opacity.value,
      // to keep the value in the bounds we use min and max
      transform: [
        {
          translateX: translation.value.x,
        },
        {
          translateY: translation.value.y,
        },
      ],
    };
  });

  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFill}>
      <GestureDetector gesture={dragGesture}>
        <Reanimated.View style={animatedStyle}>
          <View
            style={styles.box}
            onLayout={(event) => {
              setRectangle(event.nativeEvent.layout);
            }}
          />
        </Reanimated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'pink',
  },
  titleText: {
    fontSize: 14,
    lineHeight: 24,
    fontWeight: 'bold',
  },
  animContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  box: {
    height: 150,
    width: 150,
    backgroundColor: 'blue',
    borderRadius: 5,
  },
});

export default App;
