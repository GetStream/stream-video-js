import React, { useMemo, useEffect, useRef, MutableRefObject } from 'react';
import { LayoutRectangle, View } from 'react-native';
import {
  FloatingViewAlignment,
  getSnapAlignments,
  getClosestSnapAlignment,
  floatingChildViewContainerStyle,
  FloatingViewProps,
} from './common';
type GestureHandlerExportsType = typeof import('react-native-gesture-handler');
type ReanimatedNamespaceType = typeof import('react-native-reanimated').default;
type ReanimatedExportsType = typeof import('react-native-reanimated');

let ReanimatedFloatingView: React.FC<FloatingViewProps> = () => {
  throw new Error(
    'ReanimatedFloatingView component must not be used without the react-native-reanimated library and react-native-gesture-handler library installed',
  );
};

try {
  const {
    Gesture,
    GestureDetector,
  }: {
    Gesture: GestureHandlerExportsType['Gesture'];
    GestureDetector: GestureHandlerExportsType['GestureDetector'];
  } = require('react-native-gesture-handler');
  const Reanimated: ReanimatedNamespaceType =
    require('react-native-reanimated').default;
  const {
    useSharedValue,
    withTiming,
    useAnimatedStyle,
    withDelay,
  }: {
    useSharedValue: ReanimatedExportsType['useSharedValue'];
    withTiming: ReanimatedExportsType['withTiming'];
    useAnimatedStyle: ReanimatedExportsType['useAnimatedStyle'];
    withDelay: ReanimatedExportsType['withDelay'];
  } = require('react-native-reanimated');

  ReanimatedFloatingView = ({
    initialAlignment,
    containerHeight,
    containerWidth,
    children,
  }: FloatingViewProps) => {
    // to store the starting position of the gesture
    const startRef: MutableRefObject<{ x: number; y: number } | null> = useRef<{
      x: number;
      y: number;
    }>({
      x: 0,
      y: 0,
    });
    // to store the necessary translate x, y position
    const translationX = useSharedValue(0);
    const translationY = useSharedValue(0);
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

    const dragGesture = useMemo(
      () =>
        Gesture.Pan()
          .onStart((_e) => {
            // store the starting position of the gesture
            startRef.current = {
              x: translationX.value,
              y: translationY.value,
            };
          })
          .onUpdate((e) => {
            // update the translation with the distance of the gesture + starting position
            translationX.value = Math.max(
              0,
              Math.min(
                e.translationX + (startRef.current?.x ?? 0),
                snapAlignments[FloatingViewAlignment.bottomRight].x,
              ),
            );
            translationY.value = Math.max(
              0,
              Math.min(
                e.translationY + (startRef.current?.y ?? 0),
                snapAlignments[FloatingViewAlignment.bottomRight].y,
              ),
            );
          })
          .onEnd(() => {
            // snap to the closest alignment with a spring animation
            const position = {
              x: translationX.value,
              y: translationY.value,
            };
            const closestAlignment = getClosestSnapAlignment({
              position,
              snapAlignments,
            });
            translationX.value = withTiming(closestAlignment.x);
            translationY.value = withTiming(closestAlignment.y);
          }),
      [snapAlignments, translationX, translationY],
    );

    useEffect(() => {
      if (!rectangle) {
        return;
      }
      const alignment = snapAlignments[initialAlignment];
      startRef.current = alignment;

      translationX.value = alignment.x;
      translationY.value = alignment.y;

      // add a small delay to the opacity animation to avoid
      // the floating view to be visible when it is being moved
      opacity.value = withDelay(500, withTiming(1, { duration: 50 }));
    }, [
      rectangle,
      snapAlignments,
      initialAlignment,
      opacity,
      translationX,
      translationY,
    ]);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        height: rectangle?.height,
        width: rectangle?.width,
        opacity: opacity.value,
        // to keep the value in the bounds we use min and max
        transform: [
          {
            translateX: translationX.value,
          },
          {
            translateY: translationY.value,
          },
        ],
      };
    });

    return (
      // gesture handler root view must absolutely fill the bounds
      // to intercept gestures within those bounds
      <GestureDetector gesture={dragGesture}>
        <Reanimated.View style={animatedStyle}>
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
        </Reanimated.View>
      </GestureDetector>
    );
  };
} catch (e) {}

export default ReanimatedFloatingView;
