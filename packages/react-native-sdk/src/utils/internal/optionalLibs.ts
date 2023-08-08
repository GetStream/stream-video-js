export type GestureHandlerType = typeof import('react-native-gesture-handler');
export type ReanimatedType = typeof import('react-native-reanimated');

let gestureHandler: GestureHandlerType | undefined;
let reanimated: ReanimatedType | undefined;

try {
  gestureHandler = require('react-native-gesture-handler');
} catch (e) {}

try {
  reanimated = require('react-native-reanimated');
} catch (e) {}

export const getReanimatedLib = (onPackageNotFound = () => {}) => {
  if (!reanimated) {
    onPackageNotFound();
  }
  return reanimated;
};

export const getGestureHandlerLib = (onPackageNotFound = () => {}) => {
  if (!gestureHandler) {
    onPackageNotFound();
  }
  return gestureHandler;
};
