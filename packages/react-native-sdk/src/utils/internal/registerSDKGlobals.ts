import type { StreamRNVideoSDKGlobals } from '@stream-io/video-client';
import { NativeModules } from 'react-native';

const StreamInCallManagerNativeModule = NativeModules.StreamInCallManager;
const StreamVideoReactNativeModule = NativeModules.StreamVideoReactNative as {
  checkPermission: StreamRNVideoSDKGlobals['permissions']['check'];
};

const streamRNVideoSDKGlobals: StreamRNVideoSDKGlobals = {
  callManager: {
    setup: ({ defaultDevice }) => {
      StreamInCallManagerNativeModule.setDefaultAudioDeviceEndpointType(
        defaultDevice,
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
  permissions: {
    check: async (permission) => {
      return Boolean(
        await StreamVideoReactNativeModule.checkPermission(permission),
      );
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
