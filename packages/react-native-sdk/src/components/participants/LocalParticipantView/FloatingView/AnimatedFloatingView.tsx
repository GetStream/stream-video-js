import React, { useRef, useReducer, useEffect } from 'react';
import {
  Animated,
  LayoutRectangle,
  PanResponder,
  Easing,
  View,
  StyleSheet,
} from 'react-native';
import {
  FloatingViewProps,
  getSnapAlignments,
  FloatingViewAlignment,
  getClosestSnapAlignment,
  floatingChildViewContainerStyle,
} from './common';

const AnimatedFloatingView = ({
  initialAlignment,
  containerWidth,
  containerHeight,
  children,
}: FloatingViewProps) => {
  // the translate is calculated using distance of dragging (dx, dy)
  // computed value = value + offset
  // Start of a DRAG state: value is (0,0) and offset is the last (translateX, translateY)
  // DRAGGING state: value is always current (dx, dy) and offset is last (translateX, translateY)
  const translateRef = useRef(new Animated.ValueXY());
  const opacity = useRef(new Animated.Value(0));

  const [rectangle, setRectangle] = React.useState<LayoutRectangle>();

  // we need to force update the component when the rectangle is available
  // we cannot just rely on the rectangle because it is not available on the first render
  // and we need snapAlignments to be in a Ref so that it can be used in the panResponder's creation Ref
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

  useEffect(() => {
    console.info(
      'react-native-reanimated and/or react-native-gesture-handler libraries are not installed. Please install them to get a more performant draggable local video component',
    );
  }, []);

  const containerStyle = {
    ...styles.animContainer,
    height: rectangle?.height,
    width: rectangle?.width,
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
        onLayout={(event) => {
          const layout = event.nativeEvent.layout;
          setRectangle((prev) => {
            if (
              prev &&
              prev.width === layout.width &&
              prev.height === layout.height &&
              prev.x === layout.x &&
              prev.y === layout.y
            ) {
              return prev;
            }
            return layout;
          });
        }}
        style={floatingChildViewContainerStyle}
      >
        {children}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  animContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

export default AnimatedFloatingView;
