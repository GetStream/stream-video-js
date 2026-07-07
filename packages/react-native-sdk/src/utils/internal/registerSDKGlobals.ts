import { StreamRNVideoSDKGlobals } from '@stream-io/video-client';
import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import {
  AudioDeviceModule,
  AudioEngineMuteMode,
  audioDeviceModuleEvents,
} from '@stream-io/react-native-webrtc';
import { getCallingxLibIfAvailable } from '../push/libs/callingx';
import {
  endCallingxCall,
  registerOutgoingCall,
  joinCallingxCall,
} from './callingx/callingx';

const StreamInCallManagerNativeModule = NativeModules.StreamInCallManager;
const StreamVideoReactNativeModule = NativeModules.StreamVideoReactNative as {
  checkPermission: StreamRNVideoSDKGlobals['permissions']['check'] | undefined;
};

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

/**
 * On Android, when the call is registered with the Telecom stack (via CallingX),
 * routing/focus/mode must be owned by Telecom (per Android guidance we must not use
 * AudioManager.setCommunicationDevice / startBluetoothSco). Unlike iOS, we do NOT skip
 * StreamInCallManager entirely — Telecom provides no proximity/keep-screen-on — instead we
 * run it in "telecom-managed" mode where it only keeps proximity/keep-screen-on/mute.
 */
const isAndroidTelecomManaged = ({
  isRingingTypeCall,
}: {
  isRingingTypeCall: boolean;
}): boolean => {
  if (Platform.OS !== 'android') {
    return false;
  }
  if (!CallingxModule) {
    return false;
  }
  return (
    CallingxModule.isSetup &&
    CallingxModule.isTelecomBacked &&
    (isRingingTypeCall || CallingxModule.isOngoingCallsEnabled)
  );
};

const streamRNVideoSDKGlobals: StreamRNVideoSDKGlobals = {
  callingX: {
    joinCall: joinCallingxCall,
    endCall: endCallingxCall,
    registerOutgoingCall: registerOutgoingCall,
  },
  callManager: {
    setup: ({ defaultDevice, isRingingTypeCall }) => {
      if (shouldBypassForCallKit({ isRingingTypeCall })) {
        // Forward the sticky preference; callingx reads it on next CallKit activation.
        CallingxModule?.setDefaultAudioDeviceEndpointType(defaultDevice);
        return;
      }
      if (isAndroidTelecomManaged({ isRingingTypeCall })) {
        // Telecom owns routing; forward the sticky preference to callingx and run the
        // in-call manager in telecom-managed mode (proximity/keep-screen-on only).
        CallingxModule?.setDefaultAudioDeviceEndpointType(defaultDevice);
        StreamInCallManagerNativeModule.setTelecomManagedMode(true);
        StreamInCallManagerNativeModule.setup();
        return;
      }
      StreamInCallManagerNativeModule.setTelecomManagedMode(false);
      StreamInCallManagerNativeModule.setDefaultAudioDeviceEndpointType(
        defaultDevice,
      );
      StreamInCallManagerNativeModule.setup();
    },
    start: ({ isRingingTypeCall }) => {
      if (shouldBypassForCallKit({ isRingingTypeCall })) {
        return;
      }
      // Android telecom-managed calls still start (for proximity/keep-screen-on);
      // the native side skips routing/focus internally.
      StreamInCallManagerNativeModule.start();
    },
    stop: ({ isRingingTypeCall }) => {
      if (shouldBypassForCallKit({ isRingingTypeCall })) {
        return;
      }
      StreamInCallManagerNativeModule.stop();
    },
    // iOS-only. Keep the AVAudioEngine mic-input (voice-processing) chain
    // prepared while muted so the engine stays full-duplex and remote audio
    // renders when joining muted. Intentionally NOT gated by
    // `shouldBypassForCallKit`: it acts on the shared `RTCAudioDeviceModule`, so
    // it must run for both the StreamInCallManager and CallKit/callingx paths.
    setMutedRecordingPrepared: (enabled) => {
      if (Platform.OS !== 'ios') {
        return;
      }
      if (enabled) {
        // Mute via the voice-processing unit (it's the default, fail safe config here) so the input chain
        // stays built while muted, rather than tearing the engine down.
        AudioDeviceModule.setMuteMode(
          AudioEngineMuteMode.VoiceProcessing,
        ).catch(() => {});
      }
      AudioDeviceModule.setRecordingAlwaysPreparedMode(enabled).catch(() => {});
    },
  },
  permissions: {
    check: async (permission) => {
      if (Platform.OS === 'android') {
        const nativeAndroidPermission =
          permission === 'camera'
            ? PermissionsAndroid.PERMISSIONS.CAMERA
            : PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;
        return PermissionsAndroid.check(nativeAndroidPermission);
      }

      // use our own service on iOS
      return Boolean(
        await StreamVideoReactNativeModule.checkPermission?.(permission),
      );
    },
  },
  nativeEvents: {
    speechActivity: {
      subscribe(cb) {
        const subscription = audioDeviceModuleEvents.addSpeechActivityListener(
          (data) => {
            cb({ isSoundDetected: data.event === 'started' });
          },
        );
        return () => subscription.remove();
      },
    },
  },
};

// Note: The global type declaration for `streamRNVideoSDK` is defined in
// @stream-io/video-client/src/types.ts and is automatically available when
// importing from the client package.
export function registerSDKGlobals() {
  if (!globalThis.streamRNVideoSDK) {
    globalThis.streamRNVideoSDK = streamRNVideoSDKGlobals;
  }
}
