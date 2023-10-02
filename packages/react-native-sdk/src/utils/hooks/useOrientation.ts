import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

export type Orientation = 'portrait' | 'landscape';

const isPortrait = () => {
  const dimensions = Dimensions.get('screen');
  return dimensions.height >= dimensions.width;
};

/**
 * A hook that returns device orientation.
 * @returns 'portrait' : 'landscape'
 */
export const useOrientation = () => {
  const [orientation, setOrientation] = useState<Orientation>(
    isPortrait() ? 'portrait' : 'landscape',
  );

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(isPortrait() ? 'portrait' : 'landscape');
    };

    Dimensions.addEventListener('change', updateOrientation);

    return () => {
      // @ts-ignore
      Dimensions.removeEventListener('change', updateOrientation);
    };
  }, []);

  return orientation;
};
