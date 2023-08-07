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

export const getReanimatedLib = (onNotFound = () => {}) => {
  if (!reanimated) {
    onNotFound();
  }
  return reanimated;
};

export const getGestureHandlerLib = (onNotFound = () => {}) => {
  if (!gestureHandler) {
    onNotFound();
  }
  return gestureHandler;
};
