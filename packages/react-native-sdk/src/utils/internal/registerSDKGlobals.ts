import {
  StreamRNVideoSDKGlobals,
  videoLoggerSystem,
} from '@stream-io/video-client';
import { AppState, PermissionsAndroid, Platform } from 'react-native';
import NativeStreamInCallManager from '../../native/NativeStreamInCallManager';
import NativeStreamVideoReactNative from '../../native/NativeStreamVideoReactNative';
import {
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
import { beforeJoin, onJoinFailed, onLeave } from './ringingCallLifecycle';
import { callManager as publicCallManager } from '../../modules/call-manager';

const StreamInCallManagerNativeModule = NativeStreamInCallManager;

const CallingxModule = getCallingxLibIfAvailable();

/**
 * Runs a fire-and-forget native call, logging instead of throwing on a bridge
 * error so it can't crash the caller (e.g. the join/leave flow).
 */
const safeNativeCall = (label: string, fn: () => void): void => {
  try {
    fn();
  } catch (error) {
    videoLoggerSystem.getLogger('CallManager').warn(`${label} failed`, error);
  }
};

/**
 * Checks if StreamInCallManager should be bypassed because callingx is handling
 * the audio session via CallingX.
 *
 * On iOS, when CallingX is set up and has a registered call, the audio session
 * is managed by the system call layer through CallingxImpl.swift.
 * In this case, StreamInCallManager should not run to avoid conflicting audio
 * session configurations.
 */
const shouldBypassForCallingx = ({
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

const toAndroidPermission = (permission: 'microphone' | 'camera') =>
  permission === 'camera'
    ? PermissionsAndroid.PERMISSIONS.CAMERA
    : PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;

const streamRNVideoSDKGlobals: StreamRNVideoSDKGlobals = {
  callingX: {
    joinCall: joinCallingxCall,
    endCall: endCallingxCall,
    registerOutgoingCall: registerOutgoingCall,
    wireAudioEngineSubscription: wireAudioEngineSubscription,
    unwireAudioEngineSubscription: unwireAudioEngineSubscription,
  },
  ringingCallLifecycle: { beforeJoin, onJoinFailed, onLeave },
  callManager: {
    setup: ({ defaultDevice, isRingingTypeCall, cid }) => {
      const isTelecomManaged = isAndroidTelecomManaged({ cid });
      const isCallingxManaged = shouldBypassForCallingx({ isRingingTypeCall });
      if (Platform.OS === 'android') {
        StreamInCallManagerNativeModule.setTelecomManagedMode(isTelecomManaged);
      }

      if (isTelecomManaged || isCallingxManaged) {
        safeNativeCall('setup defaultAudioDevice (callingx)', () =>
          CallingxModule?.setDefaultAudioDeviceEndpointType(defaultDevice),
        );
      }

      if (!isTelecomManaged) {
        safeNativeCall('setup defaultAudioDevice', () =>
          StreamInCallManagerNativeModule.setDefaultAudioDeviceEndpointType(
            defaultDevice,
          ),
        );
      }
    },
    start: ({ isRingingTypeCall, cid }) => {
      safeNativeCall('stopRingtone', () =>
        //stop the ringtone if it is playing before audio session setup
        StreamInCallManagerNativeModule.stopSound(),
      );

      // Apply the audio config a consumer recorded via `callManager.start(config)` at this single
      // join-time start, before the native audio manager is activated.
      const config = publicCallManager.getStoredConfig();
      const deviceOverride =
        config?.audioRole === 'communicator'
          ? config.deviceEndpointType
          : undefined;

      if (shouldBypassForCallingx({ isRingingTypeCall })) {
        // The system call layer owns activation. Only forward an explicit endpoint override; the
        // SpeakerManager-derived default was already forwarded via `setup`.
        if (deviceOverride) {
          safeNativeCall('start defaultAudioDevice (callingx)', () =>
            CallingxModule?.setDefaultAudioDeviceEndpointType(deviceOverride),
          );
          safeNativeCall('start defaultAudioDevice', () =>
            StreamInCallManagerNativeModule.setDefaultAudioDeviceEndpointType(
              deviceOverride,
            ),
          );
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
          safeNativeCall('start defaultAudioDevice (callingx)', () =>
            CallingxModule?.setDefaultAudioDeviceEndpointType(deviceOverride),
          );
        } else {
          safeNativeCall('start defaultAudioDevice', () =>
            StreamInCallManagerNativeModule.setDefaultAudioDeviceEndpointType(
              deviceOverride,
            ),
          );
        }
      }

      const stereoOutput = config?.audioRole === 'listener';
      StreamInCallManagerNativeModule.setEnableStereoAudioOutput(stereoOutput);
      StreamInCallManagerNativeModule.start();
    },
    stop: ({ isRingingTypeCall, shouldStopCallManager }) => {
      // Clear the stored audio config so it doesn't carry into the next call.
      publicCallManager.stop();

      // We want to interact with ADM only when it was instantiated. This guards a case when
      // leave is invoked for ringing call - in this case PC Factory and ADM are not yet created.
      if (shouldStopCallManager) {
        // Teardown of setMutedRecordingPrepared. Done here (before the callingx gate)
        // so it runs on both paths and while the call factory is still alive: leave()
        // calls stop() before disposing the engine, so the ADM resolves to the call's
        // factory rather than a default.
        if (Platform.OS === 'ios') {
          StreamInCallManagerNativeModule.setRecordingAlwaysPreparedMode(false);
        }
        if (shouldBypassForCallingx({ isRingingTypeCall })) {
          return;
        }
        StreamInCallManagerNativeModule.stop();
      }
    },
    // iOS-only. Keep the AVAudioEngine mic-input (voice-processing) chain
    // prepared while muted so the engine stays full-duplex and remote audio
    // renders when joining muted. Intentionally NOT gated by
    // `shouldBypassForCallingx`: it acts on the shared `RTCAudioDeviceModule`, so
    // it must run for both the StreamInCallManager and callingx paths.
    setMutedRecordingPrepared: (enabled) => {
      if (Platform.OS !== 'ios') {
        return;
      }
      if (enabled) {
        // Mute via the voice-processing unit (it's the default, fail safe config here) so the input chain
        // stays built while muted, rather than tearing the engine down.
        StreamInCallManagerNativeModule.setMuteMode(
          AudioEngineMuteMode.VoiceProcessing,
        );
      }
      StreamInCallManagerNativeModule.setRecordingAlwaysPreparedMode(enabled);
    },
  },
  permissions: {
    check: async (permission) => {
      if (Platform.OS === 'android') {
        return PermissionsAndroid.check(toAndroidPermission(permission));
      }

      // use our own service on iOS
      const state =
        await NativeStreamVideoReactNative.checkPermission(permission);
      return state === 'granted';
    },
    query: async (permission) => {
      if (Platform.OS === 'android') {
        // check() is read-only: false = denied or never requested
        // (indistinguishable without requesting)
        const granted = await PermissionsAndroid.check(
          toAndroidPermission(permission),
        );
        return granted ? 'granted' : 'prompt';
      }

      // iOS: reads the AVCaptureDevice authorization status, never prompts
      const state =
        await NativeStreamVideoReactNative.checkPermission(permission);
      if (state === 'granted' || state === 'denied' || state === 'prompt') {
        return state;
      }
      throw new Error(`Unexpected ${permission} permission state: ${state}`);
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
    appForeground: {
      subscribe(cb) {
        let previous = AppState.currentState;
        const subscription = AppState.addEventListener('change', (next) => {
          if (previous !== 'active' && next === 'active') cb();
          previous = next;
        });
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
