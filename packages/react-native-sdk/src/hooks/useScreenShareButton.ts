import {
  getLogger,
  hasScreenShare,
  OwnCapability,
} from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import React, { useEffect, useRef } from 'react';
import { findNodeHandle, NativeModules, Platform } from 'react-native';
import { usePrevious } from '../utils/hooks';
import { useIsIosScreenshareBroadcastStarted } from './useIsIosScreenshareBroadcastStarted';

// ios >= 14.0 or android - platform restrictions
const CanDeviceScreenShare =
  (Platform.OS === 'ios' &&
    Number.parseInt(Platform.Version?.split('.')[0] ?? '0', 10) >= 14) ||
  Platform.OS === 'android';

export const useScreenShareButton = (
  /**
   * Ref of the ScreenCapturePickerView component.
   *
   */
  screenCapturePickerViewiOSRef: React.MutableRefObject<any>,
  /**
   * Handler to be called when the screen-share has been started.
   *
   */
  onScreenShareStartedHandler?: () => void,
  /**
   * Handler to be called when the screen-share has been stopped.
   *
   */
  onScreenShareStoppedHandler?: () => void,
  /**
   * Handler to be called when the permissions to stream screen share media is missing
   *
   */
  onMissingScreenShareStreamPermission?: () => void,
) => {
  const call = useCall();
  const { useLocalParticipant, useCallSettings, useOwnCapabilities } =
    useCallStateHooks();
  const callSettings = useCallSettings();
  const ownCapabilities = useOwnCapabilities();
  const hasScreenSharingPermissions = ownCapabilities?.includes(
    OwnCapability.SCREENSHARE,
  );
  const isScreenSharingEnabledInCall = callSettings?.screensharing.enabled;

  const onScreenShareStartedHandlerRef = useRef(onScreenShareStartedHandler);
  onScreenShareStartedHandlerRef.current = onScreenShareStartedHandler;
  const onScreenShareStoppedHandlerRef = useRef(onScreenShareStoppedHandler);
  onScreenShareStoppedHandlerRef.current = onScreenShareStoppedHandler;

  const iosScreenShareStartedFromSystem = useIsIosScreenshareBroadcastStarted();
  const prevIosScreenShareStartedFromSystem = usePrevious(
    iosScreenShareStartedFromSystem,
  );

  const localParticipant = useLocalParticipant();
  const hasPublishedScreenShare =
    localParticipant && hasScreenShare(localParticipant);

  // listens to iOS screen share broadcast started event from the system
  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }
    if (
      iosScreenShareStartedFromSystem &&
      !prevIosScreenShareStartedFromSystem
    ) {
      onScreenShareStartedHandlerRef.current?.();
      call?.screenShare.enable();
    } else if (
      !iosScreenShareStartedFromSystem &&
      prevIosScreenShareStartedFromSystem
    ) {
      onScreenShareStoppedHandlerRef.current?.();
      call?.screenShare.disable(true);
    }
  }, [
    call,
    iosScreenShareStartedFromSystem,
    prevIosScreenShareStartedFromSystem,
  ]);

  const onPress = async () => {
    if (!hasScreenSharingPermissions) {
      const logger = getLogger(['useScreenShareButton']);
      logger(
        'info',
        'User does not have permissions to stream the screen share media, calling onMissingScreenShareStreamPermission handler if present',
      );
      onMissingScreenShareStreamPermission?.();
    }
    if (!hasPublishedScreenShare) {
      if (Platform.OS === 'ios') {
        const reactTag = findNodeHandle(screenCapturePickerViewiOSRef.current);
        await NativeModules.ScreenCapturePickerViewManager.show(reactTag);
        // After this the iOS screen share broadcast started/stopped event will be triggered
        // and the useEffect listener will handle the rest
      } else {
        try {
          await call?.screenShare.enable();
          onScreenShareStartedHandler?.();
        } catch (error) {
          // ignored.. user didnt allow the screen share in the popup
          const logger = getLogger(['useScreenShareButton']);
          logger(
            'info',
            'User opted to not give permissions to start a screen share stream',
            error,
          );
        }
      }
    } else if (hasPublishedScreenShare) {
      onScreenShareStoppedHandler?.();
      await call?.screenShare.disable(true);
    }
  };

  if (!isScreenSharingEnabledInCall || !CanDeviceScreenShare) {
    return { onPress: undefined, hasPublishedScreenShare: false };
  }
  return { onPress, hasPublishedScreenShare };
};
