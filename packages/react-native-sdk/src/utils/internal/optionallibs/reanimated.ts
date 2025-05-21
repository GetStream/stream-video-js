export type ReanimatedType = typeof import('react-native-reanimated');

let reanimated: ReanimatedType | undefined;

try {
  reanimated = require('react-native-reanimated');
} catch {}

export const getReanimatedLib = (onPackageNotFound = () => {}) => {
  if (!reanimated) {
    onPackageNotFound();
  }
  return reanimated;
};
