import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import NativeStreamVideoReactNative from '../native/NativeStreamVideoReactNative';

export function useIsIosScreenshareBroadcastStarted() {
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }

    const subscription = NativeStreamVideoReactNative.onScreenShareEvent(
      (event: { name: string }) => {
        setHasStarted(event.name === 'iOS_BroadcastStarted');
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return hasStarted;
}
