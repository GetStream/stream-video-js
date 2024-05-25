import {
  CallControlsButton,
  useCallStateHooks,
} from '@stream-io/video-react-native-sdk';
import { MediaStream } from '@stream-io/react-native-webrtc';
import React, { useEffect, useState } from 'react';
import { NativeModules, Platform } from 'react-native';
import { Blur } from '../assets/Blur';

export const BlurVideoFilterButton = () => {
  const { useCameraState } = useCallStateHooks();
  const { camera } = useCameraState();
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // initialise native blur filter with medium intensity
    // TODO: switch intensity
    NativeModules.StreamVideoReactNative.registerBackgroundBlurVideoFilter(
      'medium',
    );
  }, []);

  const onPressHandler = async () => {
    console.log('onPressHandler');
    if (!isEnabled) {
      console.log('enabling');
      setIsEnabled(true);
      (camera.state.mediaStream as MediaStream)
        .getVideoTracks()
        .forEach((track) => {
          track._setVideoEffect('BackgroundBlur');
        });
    } else {
      console.log('disabling 2');
      setIsEnabled(false);
      //   await unregisterFilterRef.current();
      (camera.state.mediaStream as MediaStream)
        .getVideoTracks()
        .forEach((track) => {
          // @ts-ignore
          track._setVideoEffect(null);
        });
    }
  };

  if (Platform.OS !== 'android') {
    return null;
  }

  return (
    <CallControlsButton onPress={onPressHandler}>
      <Blur />
    </CallControlsButton>
  );
};
