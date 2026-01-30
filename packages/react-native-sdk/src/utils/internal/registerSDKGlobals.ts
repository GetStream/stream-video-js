import { StreamRNVideoSDKGlobals } from '@stream-io/video-client';
import { NativeModules, Platform } from 'react-native';
import { getCallingxLibIfAvailable } from '../push/libs/callingx';
import { endCallingxCall, startCallingxCall } from './callingx';

const StreamInCallManagerNativeModule = NativeModules.StreamInCallManager;

const CallingxModule = getCallingxLibIfAvailable();

/**
 * Checks if StreamInCallManager should be bypassed because CallKit is handling
 * the audio session via CallingX.
 *
 * On iOS, when CallingX is set up and has a registered call, the audio session
 * is managed by CallKit through CallingxImpl.swift.
 * In this case, StreamInCallManager should not run to avoid conflicting audio
 * session configurations.
 */
const shouldBypassForCallKit = ({
  isRingingTypeCall,
}: {
  isRingingTypeCall: boolean;
}): boolean => {
  if (Platform.OS !== 'ios') {
    return false;
  }
  if (!CallingxModule) {
    return false;
  }
  const bypass =
    CallingxModule.isSetup &&
    (isRingingTypeCall || CallingxModule.isOngoingCallsEnabled);
  return bypass;
};

const streamRNVideoSDKGlobals: StreamRNVideoSDKGlobals = {
  callingX: {
    startCall: startCallingxCall,
    endCall: endCallingxCall,
  },
  callManager: {
    setup: ({ defaultDevice, isRingingTypeCall }) => {
      if (shouldBypassForCallKit({ isRingingTypeCall })) {
        return;
      }
      StreamInCallManagerNativeModule.setDefaultAudioDeviceEndpointType(
        defaultDevice,
      );
      StreamInCallManagerNativeModule.setup();
    },
    start: ({ isRingingTypeCall }) => {
      if (shouldBypassForCallKit({ isRingingTypeCall })) {
        return;
      }
      StreamInCallManagerNativeModule.start();
    },
    stop: ({ isRingingTypeCall }) => {
      if (shouldBypassForCallKit({ isRingingTypeCall })) {
        return;
      }
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
