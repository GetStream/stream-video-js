import {
  StreamRNVideoSDKGlobals,
  videoLoggerSystem,
} from '@stream-io/video-client';
import { NativeModules, Platform } from 'react-native';
import { getCallingxLibIfAvailable } from '../push/libs/callingx';

const StreamInCallManagerNativeModule = NativeModules.StreamInCallManager;
const CallingxModule = getCallingxLibIfAvailable();

/**
 * Checks if StreamInCallManager should be bypassed because CallKit is handling
 * the audio session via CallingX.
 *
 * On iOS, when CallingX is set up and has a registered call, the audio session
 * is managed by CallKit through CallingxImpl.swift and AudioSessionManager.swift.
 * In this case, StreamInCallManager should not run to avoid conflicting audio
 * session configurations.
 */
const shouldBypassForCallKit = (isRingingTypeCall: boolean): boolean => {
  if (Platform.OS !== 'ios' || !isRingingTypeCall) {
    return false;
  }
  if (!CallingxModule) {
    return false;
  }
  return CallingxModule.isSetup;
};

const streamRNVideoSDKGlobals: StreamRNVideoSDKGlobals = {
  callManager: {
    setup: ({ default_device, isRingingTypeCall }) => {
      if (shouldBypassForCallKit(isRingingTypeCall)) {
        videoLoggerSystem
          .getLogger('streamRNVideoSDKGlobals')
          .debug(`callManager setup: skipping setup for ringing type of call`);
        return;
      }
      StreamInCallManagerNativeModule.setDefaultAudioDeviceEndpointType(
        default_device,
      );
      StreamInCallManagerNativeModule.setup();
      videoLoggerSystem
        .getLogger('streamRNVideoSDKGlobals')
        .debug(
          `callManager setup: ${default_device} isRingingTypeCall: ${isRingingTypeCall}`,
        );
    },
    start: ({ isRingingTypeCall }) => {
      if (shouldBypassForCallKit(isRingingTypeCall)) {
        videoLoggerSystem
          .getLogger('streamRNVideoSDKGlobals')
          .debug(`callManager start: skipping start for ringing type of call`);
        return;
      }
      videoLoggerSystem
        .getLogger('streamRNVideoSDKGlobals')
        .debug(`callManager start`);
      StreamInCallManagerNativeModule.start();
    },
    stop: ({ isRingingTypeCall }) => {
      if (shouldBypassForCallKit(isRingingTypeCall)) {
        videoLoggerSystem
          .getLogger('streamRNVideoSDKGlobals')
          .debug(`callManager stop: skipping stop for ringing type of call`);
        return;
      }
      videoLoggerSystem
        .getLogger('streamRNVideoSDKGlobals')
        .debug(`callManager stop`);
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
