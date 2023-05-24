/**
 * Checks whether we are using React Native
 */
export const isReactNative = () => {
  if (typeof navigator === 'undefined') return false;
  return navigator.product?.toLowerCase() === 'reactnative';
};
