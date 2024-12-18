import {
  StreamCallProvider,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-bindings';
import React, { PropsWithChildren, useEffect, useRef } from 'react';
import {
  Call,
  CallingState,
  setThermalState,
  setPowerState,
} from '@stream-io/video-client';
import { useIosCallkeepWithCallingStateEffect } from '../hooks/push/useIosCallkeepWithCallingStateEffect';
import {
  canAddPushWSSubscriptionsRef,
  clearPushWSEventSubscriptions,
} from '../utils/push/internal/utils';
import { useAndroidKeepCallAliveEffect } from '../hooks/useAndroidKeepCallAliveEffect';
import {
  AppState,
  NativeModules,
  Platform,
  NativeEventEmitter,
  EmitterSubscription,
} from 'react-native';
import { shouldDisableIOSLocalVideoOnBackgroundRef } from '../utils/internal/shouldDisableIOSLocalVideoOnBackground';

export type StreamCallProps = {
  /**
   * Stream Call instance propagated to the component's children as a part of StreamCallContext.
   * Children can access it with useCall() hook.
   */
  call: Call;
};
/**
 * StreamCall is a wrapper component that orchestrates the call life cycle logic and
 * provides the call object to the children components.
 * @param PropsWithChildren<StreamCallProps>
 *
 * @category Client State
 */
export const StreamCall = ({
  call,
  children,
}: PropsWithChildren<StreamCallProps>) => {
  return (
    <StreamCallProvider call={call}>
      <AppStateListener />
      <AndroidKeepCallAlive />
      <IosInformCallkeepCallEnd />
      <ClearPushWSSubscriptions />
      <DeviceStats />
      {children}
    </StreamCallProvider>
  );
};

// Resume/Disable video stream tracks when app goes to background/foreground
// To save on CPU resources
const AppStateListener = () => {
  const call = useCall();
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    // due to strange behavior in iOS when app goes to "inactive" state
    // we dont check for inactive states
    // ref: https://www.reddit.com/r/reactnative/comments/15kib42/appstate_behavior_in_ios_when_swiping_down_to/
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/background/) && nextAppState === 'active') {
        if (
          call?.camera?.state.status === 'enabled' &&
          Platform.OS === 'android'
        ) {
          // when device is locked and resumed, the status isnt made disabled but stays enabled
          // as a workaround we stop the track and enable again if its already in enabled state
          call?.camera?.disable(true).then(() => {
            call?.camera?.enable();
          });
        } else {
          call?.camera?.resume();
        }
        appState.current = nextAppState;
      } else if (
        appState.current === 'active' &&
        nextAppState.match(/background/)
      ) {
        if (Platform.OS === 'android') {
          // in Android, we need to check if we are in PiP mode
          // in PiP mode, we don't want to disable the camera
          NativeModules?.StreamVideoReactNative?.isInPiPMode().then(
            (isInPiP: boolean | null | undefined) => {
              if (!isInPiP) {
                if (AppState.currentState === 'active') {
                  // this is to handle the case that the app became active as soon as it went to background
                  // in this case, we dont want to disable the camera
                  // this happens on foreground push notifications
                  return;
                }
                if (call?.camera?.state.status === 'enabled') {
                  call?.camera?.disable();
                }
              }
            }
          );
        } else {
          // shouldDisableIOSLocalVideoOnBackgroundRef is false, if local video is enabled on PiP
          if (shouldDisableIOSLocalVideoOnBackgroundRef.current) {
            if (call?.camera?.state.status === 'enabled') {
              call?.camera?.disable();
            }
          }
        }
        appState.current = nextAppState;
      }
    });

    return () => {
      subscription.remove();
    };
  }, [call]);

  return null;
};

/**
 * This is a renderless component to keep the call alive on Android device using useAndroidKeepCallAliveEffect.
 * useAndroidKeepCallAliveEffect needs to called inside a child of StreamCallProvider.
 */
const AndroidKeepCallAlive = () => {
  useAndroidKeepCallAliveEffect();
  return null;
};

/**
 * This is a renderless component to end the call in callkeep for ios.
 * useAndroidKeepCallAliveEffect needs to called inside a child of StreamCallProvider.
 */
const IosInformCallkeepCallEnd = () => {
  useIosCallkeepWithCallingStateEffect();
  return null;
};

/**
 * This is a renderless component to clear all push ws event subscriptions
 * and set whether push ws subscriptions can be added or not.
 */
const ClearPushWSSubscriptions = () => {
  useEffect(() => {
    clearPushWSEventSubscriptions();
    canAddPushWSSubscriptionsRef.current = false;
    return () => {
      canAddPushWSSubscriptionsRef.current = true;
    };
  }, []);
  return null;
};

const eventEmitter = NativeModules?.StreamVideoReactNative
  ? new NativeEventEmitter(NativeModules?.StreamVideoReactNative)
  : undefined;

/**
 * This is a renderless component to get the device stats like thermal state and power saver mode.
 */
const DeviceStats = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  useEffect(() => {
    if (callingState !== CallingState.JOINED) {
      return;
    }

    NativeModules?.StreamVideoReactNative.isLowPowerModeEnabled().then(
      (initialPowerMode: boolean) => setPowerState(initialPowerMode)
    );

    let powerModeSubscription = eventEmitter?.addListener(
      'isLowPowerModeEnabled',
      (isLowPowerMode: boolean) => setPowerState(isLowPowerMode)
    );

    NativeModules?.StreamVideoReactNative.currentThermalState().then(
      (initialState: string) => setThermalState(initialState)
    );

    let thermalStateSubscription = eventEmitter?.addListener(
      'thermalStateDidChange',
      (thermalState: string) => setThermalState(thermalState)
    );

    // on android we need to explicitly start and stop the thermal status updates
    if (Platform.OS === 'android') {
      NativeModules?.StreamVideoReactNative.startThermalStatusUpdates();
    }

    return () => {
      powerModeSubscription?.remove();
      thermalStateSubscription?.remove();
      if (Platform.OS === 'android') {
        NativeModules?.StreamVideoReactNative.stopThermalStatusUpdates();
      }
    };
  }, [callingState]);

  return null;
};
