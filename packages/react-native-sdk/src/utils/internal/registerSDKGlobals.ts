import { StreamRNVideoSDKGlobals } from '@stream-io/video-client';
import { NativeModules } from 'react-native';

const StreamInCallManagerNativeModule = NativeModules.StreamInCallManager;

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

// Note: The global type declaration for `streamRNVideoSDK` is defined in
// @stream-io/video-client/src/types.ts and is automatically available when
// importing from the client package.
export function registerSDKGlobals() {
  if (!global.streamRNVideoSDK) {
    global.streamRNVideoSDK = streamRNVideoSDKGlobals;
  }
}
