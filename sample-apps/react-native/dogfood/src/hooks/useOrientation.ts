import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

type Orientation = 'portrait' | 'landscape';

const getOrientation = (): Orientation => {
  const dimensions = Dimensions.get('screen');
  return dimensions.height >= dimensions.width ? 'portrait' : 'landscape';
};

/**
 * A hook that returns device orientation.
 * @returns 'portrait' : 'landscape'
 */
export const useOrientation = () => {
  const [orientation, setOrientation] = useState<Orientation>(getOrientation());

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ screen }) => {
      setOrientation(screen.height >= screen.width ? 'portrait' : 'landscape');
    });
    return () => subscription?.remove();
  }, []);

  return orientation;
};
