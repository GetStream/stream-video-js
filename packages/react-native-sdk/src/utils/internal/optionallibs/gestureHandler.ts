export type GestureHandlerType = typeof import('react-native-gesture-handler');

let gestureHandler: GestureHandlerType | undefined;

try {
  gestureHandler = require('react-native-gesture-handler');
} catch (e) {}

export const getGestureHandlerLib = (onPackageNotFound = () => {}) => {
  if (!gestureHandler) {
    onPackageNotFound();
  }
  return gestureHandler;
};
