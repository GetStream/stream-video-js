import { useEffect, useState } from 'react';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

type Event = {
  name: 'iOS_BroadcastStarted' | 'iOS_BroadcastStopped';
};

export function useIsIosScreenshareBroadcastStarted() {
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }

    const eventEmitter = new NativeEventEmitter(
      NativeModules.StreamVideoReactNative,
    );

    const subscription = eventEmitter.addListener(
      'StreamVideoReactNative_Ios_Screenshare_Event',
      (event: Event) => {
        setHasStarted(event.name === 'iOS_BroadcastStarted');
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return hasStarted;
}
