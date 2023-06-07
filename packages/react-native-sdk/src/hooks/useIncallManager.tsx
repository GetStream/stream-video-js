import { useEffect } from 'react';
import InCallManager from 'react-native-incall-manager';

export type IncallManagerProps = {
  media: 'audio' | 'video';
  auto: boolean;
};

/**
 * A hook to handle IncallManager specs in the application.
 *
 * @param media
 * @param auto
 *
 * @category Device Management
 *  */
export const useIncallManager = ({ auto, media }: IncallManagerProps) => {
  useEffect(() => {
    InCallManager.start({ media, auto });

    return () => InCallManager.stop();
  }, [auto, media]);
};
