import { useWindowDimensions } from 'react-native';

type Orientation = 'portrait' | 'landscape';

/**
 * A hook that returns the orientation of the app's window.
 * The window can differ from the device screen (Split View, resizable
 * windows), so this is derived from the window's shape, not the device.
 * @returns 'portrait' : 'landscape'
 */
export const useOrientation = (): Orientation => {
  const { width, height } = useWindowDimensions();
  return height >= width ? 'portrait' : 'landscape';
};
