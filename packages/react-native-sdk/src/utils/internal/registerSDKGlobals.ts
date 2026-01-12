import { StreamRNVideoSDKGlobals } from '@stream-io/video-client';
import { NativeModules } from 'react-native';

const StreamInCallManagerNativeModule = NativeModules.StreamInCallManager;

declare global {
  var streamRNVideoSDK: StreamRNVideoSDKGlobals | undefined;
}

const streamRNVideoSDKGlobals: StreamRNVideoSDKGlobals = {
  callManager: {
    setup: ({ default_device }) => {
      StreamInCallManagerNativeModule.setDefaultAudioDeviceEndpointType(
        default_device,
      );
      StreamInCallManagerNativeModule.setup();
    },
    start: () => {
      StreamInCallManagerNativeModule.start();
    },
    stop: () => {
      StreamInCallManagerNativeModule.stop();
    },
  },
};

export function registerSDKGlobals() {
  if (!global.streamRNVideoSDK) {
    global.streamRNVideoSDK = streamRNVideoSDKGlobals;
  }
}
