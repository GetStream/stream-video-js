import { useEffect } from 'react';
import InCallManager from 'react-native-incall-manager';

export type IncallManagerProps = {
  media: 'audio' | 'video';
  auto: boolean;
};

// This hook is responsible to handle the proximity effect through IncallManager
export const useIncallManager = ({ auto, media }: IncallManagerProps) => {
  useEffect(() => {
    InCallManager.start({ media, auto });

    return () => InCallManager.stop();
  }, [auto, media]);
};
