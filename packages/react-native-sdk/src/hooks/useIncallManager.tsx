import { useEffect } from 'react';
import { getRNIncallManagerLib } from '../utils/incall-manager/lib';

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
    const incallManagerLib = getRNIncallManagerLib();
    if (incallManagerLib) {
      incallManagerLib.start({ media, auto });
    }

    return () => {
      if (incallManagerLib) {
        incallManagerLib.stop();
      }
    };
  }, [auto, media]);
};
