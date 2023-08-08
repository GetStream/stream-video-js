import { StyleProp, ViewStyle } from 'react-native';

export const enum FloatingViewAlignment {
  // Aligns the floating view to the top left corner.
  topLeft,

  // Aligns the floating view to the top right corner.
  topRight,

  // Aligns the floating view to the bottom left corner.
  bottomLeft,

  // Aligns the floating view to the bottom right corner.
  bottomRight,
}

export type SnapAlignments = Record<
  FloatingViewAlignment,
  { x: number; y: number }
>;

// find the bounds for the floating view
export function getSnapAlignments({
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
export function getClosestSnapAlignment({
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

export type FloatingViewProps = React.PropsWithChildren<{
  initialAlignment: FloatingViewAlignment;
  containerWidth: number;
  containerHeight: number;
}>;

export const floatingChildViewContainerStyle: StyleProp<ViewStyle> = {
  alignSelf: 'flex-start',
};
