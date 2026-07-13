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
  wireAudioEngineSubscription,
  unwireAudioEngineSubscription,
} from './callingx/callingx';
import { registerCallMediaEngine } from './registerMediaEngine';
import { callManager as publicCallManager } from '../../modules/call-manager';

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
const isAndroidTelecomManaged = ({ cid }: { cid: string }): boolean => {
  if (Platform.OS !== 'android' || !CallingxModule) {
    return false;
  }
  if (!CallingxModule.isSetup || !CallingxModule.isTelecomBacked) {
    return false;
  }
  // Trust Telecom's actual per-call registration. A call that never registered
  // (e.g. Telecom registration failed) is not managed, so start() falls through
  // to the classic path — this is where audio recovery happens.
  return CallingxModule.isCallTracked(cid);
};

const streamRNVideoSDKGlobals: StreamRNVideoSDKGlobals = {
  callingX: {
    joinCall: joinCallingxCall,
    endCall: endCallingxCall,
    registerOutgoingCall: registerOutgoingCall,
    wireAudioEngineSubscription: wireAudioEngineSubscription,
    unwireAudioEngineSubscription: unwireAudioEngineSubscription,
  },
  callManager: {
    setup: ({ defaultDevice, isRingingTypeCall, cid }) => {
      const isTelecomManaged = isAndroidTelecomManaged({ cid });
      const isCallKitManaged = shouldBypassForCallKit({ isRingingTypeCall });
      if (Platform.OS === 'android') {
        StreamInCallManagerNativeModule.setTelecomManagedMode(isTelecomManaged);
      }

      if (isTelecomManaged || isCallKitManaged) {
        // Telecom owns routing; forward the sticky preference to callingx and run the
        // in-call manager in telecom-managed mode (proximity/keep-screen-on only).
        CallingxModule?.setDefaultAudioDeviceEndpointType(defaultDevice);
      } else {
        StreamInCallManagerNativeModule.setDefaultAudioDeviceEndpointType(
          defaultDevice,
        );
      }
    },
    start: ({ isRingingTypeCall, cid }) => {
      // Apply the audio config a consumer recorded via `callManager.start(config)` at this single
      // join-time start, before the native audio manager is activated.
      const config = publicCallManager.getStoredConfig();
      const deviceOverride =
        config?.audioRole === 'communicator'
          ? config.deviceEndpointType
          : undefined;
      const stereoOutput =
        config?.audioRole === 'listener'
          ? config.enableStereoAudioOutput === true
          : false;

      if (shouldBypassForCallKit({ isRingingTypeCall })) {
        // CallKit owns activation. Only forward an explicit endpoint override; the
        // SpeakerManager-derived default was already forwarded via `setup`.
        if (deviceOverride) {
          CallingxModule?.setDefaultAudioDeviceEndpointType(deviceOverride);
        }
        return;
      }

      const isTelecomManaged = isAndroidTelecomManaged({ cid });
      if (Platform.OS === 'android') {
        StreamInCallManagerNativeModule.setTelecomManagedMode(isTelecomManaged);
      }
      if (config?.audioRole) {
        StreamInCallManagerNativeModule.setAudioRole(config.audioRole);
      }
      if (deviceOverride) {
        // Override the SpeakerManager-derived default device (set via `setup`).
        if (isTelecomManaged) {
          CallingxModule?.setDefaultAudioDeviceEndpointType(deviceOverride);
        } else {
          StreamInCallManagerNativeModule.setDefaultAudioDeviceEndpointType(
            deviceOverride,
          );
        }
      }
      StreamInCallManagerNativeModule.setEnableStereoAudioOutput(stereoOutput);
      StreamInCallManagerNativeModule.start();
    },
    stop: ({ isRingingTypeCall, shouldStopCallManager }) => {
      // Clear the stored audio config so it doesn't carry into the next call.
      publicCallManager.stop();

      // We want to interact with ADM only when it was instantiated. This guards a case when
      // leave is invoked for ringing call - in this case PC Factory and ADM are not yet created.
      if (shouldStopCallManager) {
        // Teardown of setMutedRecordingPrepared. Done here (before the CallKit gate)
        // so it runs on both paths and while the call factory is still alive: leave()
        // calls stop() before disposing the engine, so the ADM resolves to the call's
        // factory rather than a default.
        if (Platform.OS === 'ios') {
          AudioDeviceModule.setRecordingAlwaysPreparedMode(false).catch(
            () => {},
          );
        }
        if (shouldBypassForCallKit({ isRingingTypeCall })) {
          return;
        }
        StreamInCallManagerNativeModule.stop();
      }
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

  registerCallMediaEngine();
}
