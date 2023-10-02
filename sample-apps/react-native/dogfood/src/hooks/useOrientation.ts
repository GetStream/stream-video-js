import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

type Orientation = 'portrait' | 'landscape';

const isPortrait = (): Orientation => {
  const dimensions = Dimensions.get('screen');
  return dimensions.height >= dimensions.width ? 'portrait' : 'landscape';
};

/**
 * A hook that returns device orientation.
 * @returns 'portrait' : 'landscape'
 */
export const useOrientation = () => {
  const [orientation, setOrientation] = useState<Orientation>(isPortrait());

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(isPortrait());
    };

    Dimensions.addEventListener('change', updateOrientation);

    return () => {
      // @ts-ignore
      Dimensions.removeEventListener('change', updateOrientation);
    };
  }, []);

  return orientation;
};
